import { activeAdapters } from '../integrations';
import { prisma, redis } from './db';
import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL ?? 'info' });

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
      const items = r.value.slice(0, 200); // cap per run
      for (const it of items) {
        try {
          await prisma.trendRecord.create({
            data: {
              source: it.source,
              topic: it.topic,
              score: it.score,
              delta24h: it.delta24h ?? null,
              url: it.url ?? null,
              region: it.region ?? null,
              tags: (it.tags ?? []).join(','),
              raw: it.raw ? JSON.stringify(it.raw) : null,
              observedAt: it.observedAt ?? new Date(),
              language: it.language ?? null
            }
          });
          inserted++;
        } catch (e:any) {
          // ignore duplicates (if any unique constraints later), log others
          console.warn(`Insert failed for topic "${it.topic}":`, e.message);
          if (process.env.NODE_ENV !== 'production') log.warn({ err: e, topic: it.topic }, 'insert failed');
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
