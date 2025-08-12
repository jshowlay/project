import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function isHttpUrl(u: string) {
  try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; }
  catch { return false; }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const src = url.searchParams.get('u') || '';
  if (!src || !isHttpUrl(src)) return new NextResponse('bad url', { status: 400 });

  // Sizing params (for future Sharp implementation)
  const wParam = url.searchParams.get('w');
  const dprParam = url.searchParams.get('dpr');
  const qParam = url.searchParams.get('q');
  const fmtParam = url.searchParams.get('fmt');

  // For now, we'll just proxy the image without transforms
  // TODO: Add Sharp transforms when Node.js version is updated

  // Deny local hosts
  const host = new URL(src).hostname.toLowerCase();
  if (/(^|\.)(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(host)) {
    return new NextResponse('forbidden', { status: 403 });
  }

  // Fetch upstream
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10000);
  try {
    const upstream = await fetch(src, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent': 'TrenderAI-ImageProxy/1.1 (+https://trenderai.com)',
        'accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
      },
      signal: ctl.signal,
      cache: 'force-cache',
      next: { revalidate: 86400 } // 1 day
    });
    if (!upstream.ok) return new NextResponse(`upstream ${upstream.status}`, { status: 502 });

    // Read into buffer (cap size)
    const reader = upstream.body?.getReader();
    if (!reader) return new NextResponse('no body', { status: 502 });
    const chunks: Uint8Array[] = [];
    let total = 0;
    const MAX = 8_000_000; // 8MB
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.length;
        if (total > MAX) return new NextResponse('too large', { status: 413 });
        chunks.push(value);
      }
    }
    const inputBuf = Buffer.concat(chunks);

    // For now, return the original image without transforms
    // TODO: Add Sharp transforms here when Node.js version is updated
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';

    const h = new Headers();
    h.set('content-type', contentType);
    // Cache for a day; allow CDN to keep stale while revalidating
    h.set('cache-control', 'public, s-maxage=86400, stale-while-revalidate=604800');

    return new NextResponse(inputBuf, { status: 200, headers: h });
  } catch (e) {
    return new NextResponse('timeout', { status: 504 });
  } finally {
    clearTimeout(timer);
  }
}
