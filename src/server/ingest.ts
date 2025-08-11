import { activeAdapters } from '../integrations';
import { prisma, redis } from './db';
import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL ?? 'info' });

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
              tags: Array.isArray(it.tags) ? it.tags.join(',') : '',
              raw: it.raw ? JSON.stringify(it.raw) : null,
              observedAt,
              observedBucket,
              language: it.language ?? null
            },
            update: {
              // Keep latest score/delta/url/tags/observedAt if we re-see this within the same hour
              score: it.score,
              delta24h: it.delta24h ?? null,
              url: it.url ?? null,
              tags: Array.isArray(it.tags) ? it.tags.join(',') : '',
              observedAt
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
