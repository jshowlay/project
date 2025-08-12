/* scripts/migrate-sqlite-to-postgres.ts */
import { PrismaClient as PgClient } from '@prisma/client';
import { PrismaClient as SqliteClient } from '../prisma/generated/sqlite';

const pg = new PgClient();
const sqlite = new SqliteClient();

function bucketHour(d: Date) {
  const t = d.getTime();
  const hour = Math.floor(t / 3600000) * 3600000;
  return new Date(hour);
}

function toTagArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed.map(String) : [val]; }
    catch { return [val]; }
  }
  // SQLite Json type may look like object/array
  if (typeof val === 'object') {
    if (Array.isArray(val)) return val.map(String);
    // unsupported object -> flatten keys maybe, but safest is empty
    return [];
  }
  return [];
}

async function main() {
  console.log('Starting data copy: SQLite -> Postgres');
  const total = await sqlite.trendRecord.count();
  const BATCH = 1000;
  let offset = 0;
  let copied = 0;

  while (offset < total) {
    const rows = await sqlite.trendRecord.findMany({
      orderBy: { observedAt: 'asc' },
      take: BATCH,
      skip: offset,
    });
    if (rows.length === 0) break;

    for (const r of rows) {
      const observedAt = r.observedAt ?? new Date();
      const observedBucket = bucketHour(new Date(observedAt));
      const tags = toTagArray((r as any).tags);

      await pg.trendRecord.upsert({
        where: {
          source_topic_observedBucket: {
            source: r.source,
            topic: r.topic,
            observedBucket
          }
        },
        create: {
          source: r.source,
          topic: r.topic,
          score: r.score,
          delta24h: r.delta24h ?? null,
          url: r.url ?? null,
          region: r.region ?? null,
          tags,
          raw: r.raw as any,
          observedAt,
          observedBucket,
          language: r.language ?? null,
        },
        update: {
          score: r.score,
          delta24h: r.delta24h ?? null,
          url: r.url ?? null,
          tags,
          observedAt
        }
      });

      copied++;
      if (copied % 500 === 0) console.log(`Copied ${copied}/${total}…`);
    }

    offset += rows.length;
  }

  console.log(`Done. Copied ${copied} rows.`);
}

main()
  .then(async () => { await sqlite.$disconnect(); await pg.$disconnect(); })
  .catch(async (e) => { console.error(e); await sqlite.$disconnect(); await pg.$disconnect(); process.exit(1); });
