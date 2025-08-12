import { activeAdapters } from '../integrations';
import { ingestGoogleTrends } from '@/integrations/googleTrends';
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

  // YouTube
  if (raw?.thumbnails?.high?.url) candidates.push(raw.thumbnails.high.url);
  if (raw?.thumbnails?.medium?.url) candidates.push(raw.thumbnails.medium.url);
  if (raw?.thumbnails?.default?.url) candidates.push(raw.thumbnails.default.url);
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

function bucketHour(d: Date) {
  const t = d.getTime();
  const hour = Math.floor(t / 3600000) * 3600000;
  return new Date(hour);
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
          const img = pickImageUrl(it);
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
