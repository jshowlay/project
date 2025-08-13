import { redis } from '@/server/db';

const TTL = Number(process.env.OG_CACHE_TTL_SECONDS ?? 86400);
const TIMEOUT = Number(process.env.OG_TIMEOUT_MS ?? 7000);
const MAX_BYTES = Number(process.env.OG_MAX_HTML_BYTES ?? 900_000);

function cacheKey(u: string) { return `trenderai:og:${u}`; }

function toAbs(base: string, u?: string | null): string | null {
  if (!u) return null;
  try { return new URL(u, base).toString(); } catch { return null; }
}

function dedupe(arr: (string|null|undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of arr) {
    if (!u) continue;
    const s = String(u);
    if (!seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out;
}

type OG = {
  url: string;
  title?: string;
  site?: string;
  images: string[];
  imageWidth?: number;
  imageHeight?: number;
  card?: string;
};

function extractAllMeta(html: string, baseUrl: string): OG {
  // Very lightweight meta parser; handles mixed attribute order & single/double quotes.
  // We scan only for tags we care about.
  const metas: Record<string, string[]> = {};
  const re = /<meta\s+[^>]*?(?:name|property)\s*=\s*["']([^"']+)["'][^>]*?\scontent\s*=\s*["']([^"']+)["'][^>]*?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const k = m[1].toLowerCase().trim();
    const v = m[2].trim();
    (metas[k] ||= []).push(v);
  }
  // <link rel="image_src" href="...">
  const linkRe = /<link\s+[^>]*?rel\s*=\s*["'][^"']*image_src[^"']*["'][^>]*?href\s*=\s*["']([^"']+)["'][^>]*?>/gi;
  const linkImgs: string[] = [];
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html))) linkImgs.push(lm[1]);

  const candidates = [
    ...(metas['og:image'] ?? []),
    ...(metas['og:image:url'] ?? []),
    ...(metas['twitter:image'] ?? []),
    ...(metas['twitter:image:src'] ?? []),
    ...(metas['og:image:secure_url'] ?? []),
    ...linkImgs
  ].map(u => toAbs(baseUrl, u)).filter(Boolean) as string[];

  // Width/height hints (single values only; if multiple we'll just take the first)
  const w = Number((metas['og:image:width'] ?? [])[0] ?? 0) || undefined;
  const h = Number((metas['og:image:height'] ?? [])[0] ?? 0) || undefined;

  return {
    url: baseUrl,
    title: (metas['og:title'] ?? metas['twitter:title'] ?? [])[0],
    site: (metas['og:site_name'] ?? [])[0],
    images: dedupe(candidates),
    imageWidth: w,
    imageHeight: h,
    card: (metas['twitter:card'] ?? [])[0]
  };
}

async function fetchHTML(u: string): Promise<string> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const r = await fetch(u, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent': 'TrenderAI-OG/1.0 (+https://trenderai.com)',
        'accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1'
      },
      signal: ctl.signal
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const ct = r.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml\+xml/i.test(ct)) throw new Error('Not HTML');

    // Stream up to MAX_BYTES
    const reader = r.body?.getReader();
    if (!reader) return '';
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        total += value.length;
        if (total > MAX_BYTES) break; // stop early
        chunks.push(value);
      }
    }
    return new TextDecoder('utf-8').decode(Buffer.concat(chunks));
  } finally {
    clearTimeout(t);
  }
}

export async function getOpenGraph(u: string): Promise<OG | null> {
  try {
    const key = cacheKey(u);
    const cached = await redis().get(key);
    if (cached) return JSON.parse(cached) as OG;

    const html = await fetchHTML(u);
    const og = extractAllMeta(html, u);

    // If no images and there is a canonical link with image? We already handled rel=image_src.
    await redis().setex(key, TTL, JSON.stringify(og));
    return og;
  } catch {
    return null;
  }
}

// Heuristic to detect "obviously low-res" URLs (don't fetch OG if we already have good ones)
export function looksLowRes(url?: string | null): boolean {
  if (!url) return true;
  const u = url.toLowerCase();
  // tiny youtube default frames, sprite/thumbs, or explicit small sizes
  if (/\/default\.jpg$/.test(u)) return true;
  if (/\b(w|width|h|height)=(\d{2,3})(\D|$)/.test(u)) {
    const m = u.match(/\b(w|width|h|height)=(\d{2,3})(\D|$)/);
    const n = m ? Number(m[2]) : 0;
    if (n && n < 400) return true;
  }
  if (/\b(\d{2,3})x(\d{2,3})\b/.test(u)) {
    const m = u.match(/\b(\d{2,3})x(\d{2,3})\b/);
    const w = m ? Number(m[1]) : 0;
    const h = m ? Number(m[2]) : 0;
    if ((w && w < 400) || (h && h < 400)) return true;
  }
  if (/gravatar|placeholder|sprite|thumbs?\//.test(u)) return true;
  return false;
}
