import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

function isHttpUrl(u: string) {
  try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; }
  catch { return false; }
}
function pickFormat(accept: string | null, fmtParam?: string | null) {
  const fmt = (fmtParam || '').toLowerCase();
  if (['avif','webp','jpeg','jpg','png'].includes(fmt)) return fmt === 'jpg' ? 'jpeg' : fmt;
  const a = (accept || '').toLowerCase();
  if (a.includes('image/avif')) return 'avif';
  if (a.includes('image/webp')) return 'webp';
  return 'jpeg';
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const src = url.searchParams.get('u') || '';
  if (!src || !isHttpUrl(src)) return new NextResponse('bad url', { status: 400 });

  // Width / DPR / quality (guarded)
  const wParam = Number(url.searchParams.get('w') || 0);
  const dpr    = Math.min(Math.max(Number(url.searchParams.get('dpr') || 1), 1), 3);
  const q      = Math.min(Math.max(Number(url.searchParams.get('q') || 88), 30), 95);
  const accept = req.headers.get('accept');
  const outFmt = pickFormat(accept, url.searchParams.get('fmt'));

  const reqW = wParam > 0 ? Math.min(wParam * dpr, 3000) : 0;

  // Deny private hosts
  const host = new URL(src).hostname.toLowerCase();
  if (/(^|\.)(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(host)) {
    return new NextResponse('forbidden', { status: 403 });
  }

  // Fetch upstream (follow redirects, small timeout, size cap)
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10000);
  try {
    const upstream = await fetch(src, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent': 'TrenderAI-ImageProxy/1.2 (+https://trenderai.com)',
        'accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
      },
      signal: ctl.signal,
      cache: 'force-cache',
      next: { revalidate: 86400 } // 1 day
    });
    if (!upstream.ok) return new NextResponse(`upstream ${upstream.status}`, { status: 502 });
    const reader = upstream.body?.getReader();
    if (!reader) return new NextResponse('no body', { status: 502 });

    const chunks: Uint8Array[] = [];
    let total = 0;
    const MAX = 10_000_000; // 10MB cap
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

    // Inspect source to avoid pointless upscaling
    const meta = await sharp(inputBuf, { limitInputPixels: 16000 * 16000 }).metadata();
    const srcW = meta.width || 0;

    // Target width: don't upscale beyond source width (keeps crisp detail)
    const targetW = reqW ? Math.min(Math.round(reqW), srcW || reqW) : (srcW || undefined);

    let pipe = sharp(inputBuf, { limitInputPixels: 16000 * 16000 })
      // Normalize color space and orientation for consistency
      .withMetadata()
      .rotate()
      .toColorspace('srgb');

    if (targetW) {
      pipe = pipe.resize({
        width: targetW,
        withoutEnlargement: true,
        fit: 'cover',
        position: 'entropy' // smart crop to the most "interesting" area
      });
    }

    // High-quality encoders
    if (outFmt === 'avif')      pipe = pipe.avif({ quality: Math.min(q, 55), effort: 4, chromaSubsampling: '4:2:0' });
    else if (outFmt === 'webp') pipe = pipe.webp({ quality: q, effort: 4 });
    else if (outFmt === 'png')  pipe = pipe.png({ compressionLevel: 9 });
    else                        pipe = pipe.jpeg({ quality: q, mozjpeg: true, progressive: true });

    const output = await pipe.toBuffer();

    const h = new Headers();
    h.set('content-type', `image/${outFmt}`);
    h.set('cache-control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return new NextResponse(output, { status: 200, headers: h });
  } catch (e) {
    return new NextResponse('timeout', { status: 504 });
  } finally {
    clearTimeout(timer);
  }
}
