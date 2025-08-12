import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function isHttpUrl(u: string) {
  try {
    const x = new URL(u);
    return x.protocol === 'http:' || x.protocol === 'https:';
  } catch { return false; }
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('u') || '';
  if (!src || !isHttpUrl(src)) return new NextResponse('bad url', { status: 400 });

  // Basic denylist (avoid localhost/internal)
  const host = new URL(src).hostname.toLowerCase();
  if (/(^|\.)(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(host)) {
    return new NextResponse('forbidden', { status: 403 });
  }

  // Fetch with timeout and size guard
  const ctl = new AbortController();
  const t = setTimeout(()=>ctl.abort(), 8000);
  try {
    const r = await fetch(src, {
      headers: { 'user-agent': 'TrenderAI-ImageProxy/1.0' },
      signal: ctl.signal,
      cache: 'force-cache',
      next: { revalidate: 60 * 60 * 24 } // 1 day
    });
    if (!r.ok) return new NextResponse('fetch fail', { status: 502 });

    const ctype = r.headers.get('content-type') || 'image/jpeg';
    const clen = Number(r.headers.get('content-length') || '0');
    if (clen && clen > 6_000_000) return new NextResponse('too large', { status: 413 });

    const body = r.body;
    if (!body) return new NextResponse('no body', { status: 502 });

    const resp = new NextResponse(body, {
      status: 200,
      headers: {
        'content-type': ctype,
        'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800'
      }
    });
    return resp;
  } catch (e) {
    return new NextResponse('timeout', { status: 504 });
  } finally {
    clearTimeout(t);
  }
}
