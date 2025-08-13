import { activeAdapters } from '../integrations';
import { ingestGoogleTrends } from '@/integrations/googleTrends';
import { fetchDefaultHashtagSet } from '@/integrations/instagram';
import { getOpenGraph, looksLowRes } from '@/server/opengraph';
import { prisma, redis } from './db';
import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL ?? 'info' });

function pickImageUrl(it: any): { imageUrl?: string | null; images?: string[] } {
  // Respect explicit field if set by adapter
  if (it.imageUrl && typeof it.imageUrl === 'string' && it.imageUrl.startsWith('http')) {
    return { imageUrl: it.imageUrl, images: it.images ?? [] };
  }

  const raw = it.raw || it.meta || {};
  const candidates: string[] = [];

  // Common places across providers:
  // Reddit
  if (raw?.thumbnail && typeof raw.thumbnail === 'string' && /^https?:\/\//.test(raw.thumbnail) && !/(^self$|^default$)/.test(raw.thumbnail)) candidates.push(raw.thumbnail);
  if (raw?.url_overridden_by_dest && /^https?:\/\//.test(raw.url_overridden_by_dest)) candidates.push(raw.url_overridden_by_dest);
  if (raw?.preview?.images?.[0]?.source?.url) candidates.push(String(raw.preview.images[0].source.url).replace(/&amp;/g,'&'));

  // YouTube - prioritize highest resolution
  if (raw?.thumbnails?.maxres?.url) candidates.push(raw.thumbnails.maxres.url);
  if (raw?.thumbnails?.standard?.url) candidates.push(raw.thumbnails.standard.url);
  if (raw?.thumbnails?.high?.url) candidates.push(raw.thumbnails.high.url);
  if (raw?.thumbnails?.medium?.url) candidates.push(raw.thumbnails.medium.url);
  if (raw?.thumbnails?.default?.url) candidates.push(raw.thumbnails.default.url);
  if (raw?.snippet?.thumbnails?.maxres?.url) candidates.push(raw.snippet.thumbnails.maxres.url);
  if (raw?.snippet?.thumbnails?.standard?.url) candidates.push(raw.snippet.thumbnails.standard.url);
  if (raw?.snippet?.thumbnails?.high?.url) candidates.push(raw.snippet.thumbnails.high.url);

  // NewsAPI
  if (raw?.urlToImage) candidates.push(raw.urlToImage);

  // CoinGecko
  if (raw?.image?.large) candidates.push(raw.image.large);
  if (raw?.image?.small) candidates.push(raw.image.small);
  if (raw?.image) candidates.push(raw.image);

  // Google Trends (trending_now)
  if (raw?.img?.image) candidates.push(raw.img.image);
  if (raw?.image?.image) candidates.push(raw.image.image);

  // Generic web image
  if (it.url && /https?:\/\//.test(it.url) && /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(it.url)) candidates.push(it.url);

  // Dedup + pick first http(s)
  const uniq = Array.from(new Set(candidates.map(String)));
  const first = uniq.find(u => /^https?:\/\//.test(u));
  return { imageUrl: first || null, images: uniq.slice(0, 6) };
}

async function tryOgUpgrade(current: { imageUrl?: string | null; images?: string[] }, pageUrl?: string | null) {
  const cur = current?.imageUrl ?? null;
  if (!pageUrl) return current;
  // Only try if nothing or looks low-res
  if (cur && !looksLowRes(cur)) return current;

  const og = await getOpenGraph(pageUrl);
  if (!og || !og.images?.length) return current;

  // Prefer the first OG image, but if multiple exist and we have width/height hints, prefer the largest-looking
  const imgs = og.images;
  // Heuristic: choose the candidate with the longest width/height hint in URL or explicit OG width
  const scored = imgs.map((u) => {
    // parse .../1200x630/... or ?w=1200 etc.
    let s = 0;
    const m1 = u.match(/\b(\d{3,4})x(\d{3,4})\b/); if (m1) s = Math.max(s, Number(m1[1]) * Number(m1[2]));
    const m2 = u.match(/\b(w|width)=(\d{3,4})\b/i); if (m2) s = Math.max(s, Number(m2[2]) * 600);
    const m3 = u.match(/\b(h|height)=(\d{3,4})\b/i); if (m3) s = Math.max(s, 1200 * Number(m3[2]));
    return { u, s };
  }).sort((a,b) => b.s - a.s);
  const best = (scored[0]?.u ?? imgs[0]) || cur;

  const merged = Array.from(new Set([best, ...(current.images ?? []), ...imgs]));
  return { imageUrl: best || cur, images: merged.slice(0, 8) };
}

function bucketHour(d: Date) {
  const t = d.getTime();
  const hour = Math.floor(t / 3600000) * 3600000;
  return new Date(hour);
}

async function ingestInstagram() {
  const prisma = (await import('@/server/db')).prisma;
  const items = await fetchDefaultHashtagSet();
  let inserted = 0;

  for (const it of items) {
    const observedAt = it.observedAt ?? new Date();
    const observedBucket = new Date(Math.floor(observedAt.getTime()/3600000)*3600000);
    const tags = Array.isArray(it.tags) ? it.tags : [];
    const topic = it.topic;

    try {
      await prisma.trendRecord.upsert({
        where: {
          source_topic_observedBucket: {
            source: 'instagram',
            topic,
            observedBucket
          }
        },
        create: {
          source: 'instagram',
          topic,
          score: it.score ?? 0,
          delta24h: null,
          url: it.url ?? null,
          region: it.region ?? null,
          tags,
          raw: it.meta ?? {},
          observedAt,
          observedBucket,
          language: null,
          imageUrl: it.imageUrl ?? null,
          images: it.imageUrl ? [it.imageUrl] : []
        },
        update: {
          score: it.score ?? 0,
          url: it.url ?? null,
          tags,
          observedAt,
          imageUrl: it.imageUrl ?? null
        }
      });
      inserted++;
    } catch {
      // ignore row-level failures to keep the loop resilient
    }
  }
  return inserted;
}

export async function ingestAll() {
  const adapters = activeAdapters();
  const results = await Promise.allSettled(adapters.map(a => a.fetchTrends({})));
  let inserted = 0;
  const sources: string[] = [];
  
  // Process existing adapters
  for (let i=0;i<results.length;i++){
    const ad = adapters[i];
    sources.push(ad.SOURCE_ID);
    const r = results[i];
    if (r.status === 'fulfilled') {
      const items = r.value.slice(0, 200);
      for (const it of items) {
        try {
          const observedAt = it.observedAt ? new Date(it.observedAt) : new Date();
          const observedBucket = bucketHour(observedAt);
          const img = await tryOgUpgrade(pickImageUrl(it), it.url);
          await prisma.trendRecord.upsert({
            where: {
              source_topic_observedBucket: {
                source: it.source,
                topic: it.topic,
                observedBucket
              }
            },
            create: {
              source: it.source,
              topic: it.topic,
              score: it.score,
              delta24h: it.delta24h ?? null,
              url: it.url ?? null,
              region: it.region ?? null,
              tags: Array.isArray(it.tags) ? it.tags as string[] : [],
              raw: it.raw as any,
              observedAt,
              observedBucket,
              language: it.language ?? null,
              imageUrl: img.imageUrl ?? null,
              images: img.images ?? []
            },
            update: {
              // Keep latest score/delta/url/tags/observedAt if we re-see this within the same hour
              score: it.score,
              delta24h: it.delta24h ?? null,
              url: it.url ?? null,
              tags: Array.isArray(it.tags) ? it.tags as string[] : [],
              raw: it.raw as any,
              observedAt,
              imageUrl: img.imageUrl ?? null,
              images: img.images ?? []
            }
          });
          inserted++;
        } catch (e:any) {
          // log (optional) but continue
          if (process.env.NODE_ENV !== 'production') log.warn({ err: e, topic: it.topic }, 'upsert failed');
        }
      }
    } else {
      log.error({ source: ad.SOURCE_ID, err: r.reason }, 'adapter failed');
    }
  }

  // Ingest Google Trends if configured
  try {
    if (process.env.SERPAPI_API_KEY || process.env.TRENDS_ALPHA_ENABLED === 'true') {
      const googleQueries = [
        'artificial intelligence',
        'machine learning',
        'cryptocurrency',
        'blockchain',
        'startup',
        'entrepreneurship',
        'technology trends',
        'AI tools',
        'ChatGPT',
        'Web3'
      ];
      
      log.info('Starting Google Trends ingestion');
      await ingestGoogleTrends(googleQueries);
      sources.push('google_trends');
      log.info('Google Trends ingestion completed');
    }
  } catch (error: any) {
    log.error({ err: error }, 'Google Trends ingestion failed');
  }

  // Ingest Instagram if configured
  try {
    if (process.env.IG_LONG_LIVED_TOKEN && process.env.IG_USER_ID) {
      await ingestInstagram();
      sources.push('instagram');
      log.info('Instagram ingestion completed');
    }
  } catch (error: any) {
    log.error({ err: error }, 'Instagram ingestion failed');
  }

  // hot cache
  try {
    const latest = await prisma.trendRecord.findMany({
      orderBy: { observedAt: 'desc' },
      take: 100
    });
    await redis().set('trends:latest', JSON.stringify(latest), 'EX', 120);
  } catch {}
  return { inserted, sources };
}
