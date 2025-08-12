import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

function isHttpUrl(u: string) {
  try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; }
  catch { return false; }
}

function pickFormat(accept: string | null, fmtParam?: string | null) {
  const fmt = (fmtParam || '').toLowerCase();
  if (fmt === 'avif' || fmt === 'webp' || fmt === 'jpeg' || fmt === 'jpg' || fmt === 'png') return fmt === 'jpg' ? 'jpeg' : fmt;
  const a = (accept || '').toLowerCase();
  if (a.includes('image/avif')) return 'avif';
  if (a.includes('image/webp')) return 'webp';
  return 'jpeg';
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const src = url.searchParams.get('u') || '';
  if (!src || !isHttpUrl(src)) return new NextResponse('bad url', { status: 400 });

  // Sizing params
  const wParam = url.searchParams.get('w');
  const dprParam = url.searchParams.get('dpr');
  const qParam = url.searchParams.get('q');
  const fmtParam = url.searchParams.get('fmt');

  const width = Math.max(0, Math.min(Number(wParam || 0), 2400)) || 0; // clamp max
  const dpr = Math.min(Math.max(Number(dprParam || 1), 1), 3) || 1;
  const outW = Math.min(width * dpr || 0, 3000) || undefined; // undefined -> skip resize
  const quality = Math.min(Math.max(Number(qParam || 82), 30), 95);
  const outFmt = pickFormat(req.headers.get('accept'), fmtParam);

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

    // Transform with sharp if width/format requested
    let pipeline = sharp(inputBuf, { limitInputPixels: 12000 * 12000 }); // ~144MP guard
    if (outW) pipeline = pipeline.resize({ width: Math.round(outW), withoutEnlargement: false, fit: 'cover' });

    if (outFmt === 'avif') pipeline = pipeline.avif({ quality, effort: 4, chromaSubsampling: '4:2:0' });
    else if (outFmt === 'webp') pipeline = pipeline.webp({ quality });
    else if (outFmt === 'jpeg') pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    else pipeline = pipeline.png({ compressionLevel: 9 });

    const output = await pipeline.toBuffer();

    const h = new Headers();
    h.set('content-type', `image/${outFmt}`);
    // Cache for a day; allow CDN to keep stale while revalidating
    h.set('cache-control', 'public, s-maxage=86400, stale-while-revalidate=604800');

    return new NextResponse(output, { status: 200, headers: h });
  } catch (e) {
    return new NextResponse('timeout', { status: 504 });
  } finally {
    clearTimeout(timer);
  }
}
