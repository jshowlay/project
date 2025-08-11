import { NextRequest, NextResponse } from 'next/server';
import { prisma, redis } from '@/server/db';
import { Prisma } from '@prisma/client';
import { parseQuery } from '@/search/query';
import { z } from 'zod';
// Optional Sentry capture on server
let Sentry: any = null;
try { Sentry = require('@sentry/nextjs'); } catch {}

const TrendOut = z.object({
  id: z.string().optional(),
  source: z.string(),
  topic: z.string(),
  score: z.number(),
  delta24h: z.number().nullable().optional(),
  url: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  observedAt: z.coerce.date(),
  language: z.string().nullable().optional(),
  // rank is volatile/optional
  rank: z.number().optional()
});
type TrendDTO = z.infer<typeof TrendOut>;

function normalizeTags(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : [val]; }
    catch { return [val]; }
  }
  return [];
}

function sanitizeItems(raw: any[]): TrendDTO[] {
  return raw.map((it) => {
    const safe = {
      ...it,
      tags: normalizeTags((it as any)?.tags),
      url: it?.url ?? null
    };
    return TrendOut.parse(safe);
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const qRaw = (searchParams.get('q') || '').trim();
    const sourceParam = searchParams.get('source') || undefined;
    const regionParam = searchParams.get('region') || undefined;
    const sinceParam = searchParams.get('since');
    const untilParam = searchParams.get('until') || searchParams.get('before');
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);
    const page = Math.max(Number(searchParams.get('page') ?? 1), 1);
    const offset = (page - 1) * limit;

    const parsed = parseQuery(qRaw);

    const sources = (sourceParam ? [sourceParam] : parsed.sources).map(s => s.toLowerCase());
    const region = regionParam ?? parsed.region;
    const since = sinceParam ? new Date(sinceParam) : parsed.since;
    const until = untilParam ? new Date(untilParam) : parsed.until;
    const text = parsed.text;
    const minScore = parsed.minScore;
    const maxScore = parsed.maxScore;
    const minDelta24h = parsed.minDelta24h;
    const maxDelta24h = parsed.maxDelta24h;
    const tags = parsed.tags;
    const sort = parsed.sort;

    if (!qRaw && !sourceParam && !region && !since && !until && page === 1) {
      const cached = await redis().get('trends:latest');
      if (cached) return NextResponse.json({ items: JSON.parse(cached), page: 1, total: 100 });
    }

    // Build WHERE parts (common)
    const whereParts: Prisma.Sql[] = [];
    const hasText = Boolean(text);

    if (hasText) {
      // we'll push FTS condition per-table below (TSV name differs on MV vs table)
      // still include tags contains text
      whereParts.push(Prisma.sql`"tags" LIKE ${'%' + text + '%'}`);
    }
    if (tags.length > 0) {
      const tagConds = tags.map(t => Prisma.sql`"tags" LIKE ${'%' + t + '%'}`);
      whereParts.push(Prisma.sql`(${Prisma.join(tagConds, ' OR ')})`);
    }
    if (sources.length > 0) whereParts.push(Prisma.sql`(${Prisma.join(sources.map(s => Prisma.sql`"source" = ${s}`), ' OR ')})`);
    if (region) whereParts.push(Prisma.sql`"region" = ${region}`);
    if (since) whereParts.push(Prisma.sql`"observedAt" >= ${since}`);
    if (until) whereParts.push(Prisma.sql`"observedAt" <= ${until}`);
    if (minScore != null) whereParts.push(Prisma.sql`"score" >= ${minScore}`);
    if (maxScore != null) whereParts.push(Prisma.sql`"score" <= ${maxScore}`);
    if (minDelta24h != null) whereParts.push(Prisma.sql`"delta24h" >= ${minDelta24h}`);
    if (maxDelta24h != null) whereParts.push(Prisma.sql`"delta24h" <= ${maxDelta24h}`);

    const whereCommon = whereParts.length ? Prisma.sql`${Prisma.join(whereParts, ' AND ')}` : Prisma.sql`TRUE`;

    // COUNT (always from base table to be exact)
    const [{ count }] = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      SELECT COUNT(*) AS count FROM "TrendRecord" WHERE ${whereCommon}
      ${hasText ? Prisma.sql`AND ("topic" LIKE ${'%' + text + '%'} OR "tags" LIKE ${'%' + text + '%'})` : Prisma.empty}
    `);

    // ORDER BY
    const orderBySql =
      sort === 'score' ? Prisma.sql`"score" DESC, "observedAt" DESC` :
      sort === 'recency' ? Prisma.sql`"observedAt" DESC` :
      // rank (with text) else recency
      hasText
        ? Prisma.sql`"score" DESC, "observedAt" DESC`
        : Prisma.sql`"observedAt" DESC`;

    const useMV = hasText && process.env.USE_SEARCH_MV === 'true';

    let items: any[] = [];
    if (useMV) {
      // For SQLite, we'll use the base table since no MV support
      items = await prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT id, source, topic, score, delta24h, url, region, tags, observedAt, language
        FROM "TrendRecord"
        WHERE "topic" LIKE ${'%' + text + '%'}
          AND ${whereCommon}
        ORDER BY ${orderBySql}
        LIMIT ${limit} OFFSET ${offset}
      `);
    } else if (hasText) {
      // FTS on base table
      items = await prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT *,
          CASE WHEN "topic" LIKE ${'%' + text + '%'} THEN 1 ELSE 0 END AS rank
        FROM "TrendRecord"
        WHERE ${whereCommon}
          AND ("topic" LIKE ${'%' + text + '%'} OR "tags" LIKE ${'%' + text + '%'})
        ORDER BY ${orderBySql}
        LIMIT ${limit} OFFSET ${offset}
      `);
    } else {
      // No text: simple filtered query
      items = await prisma.trendRecord.findMany({
        where: {
          ...(sources.length ? { source: { in: sources } } : {}),
          ...(region ? { region } : {}),
          ...(since || until ? { observedAt: { gte: since ?? undefined, lte: until ?? undefined } } : {}),
          ...(minScore != null || maxScore != null ? { score: { gte: minScore ?? undefined, lte: maxScore ?? undefined } } : {})
        },
        orderBy: [{ observedAt: 'desc' }],
        take: limit,
        skip: offset
      }) as any[];
    }

    // Fuzzy fallback if text and nothing found
    if (hasText && items.length === 0) {
      items = await prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM "TrendRecord"
        WHERE "topic" LIKE ${'%' + text + '%'}
          AND ${whereCommon}
        ORDER BY "observedAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
    }

    const safe = sanitizeItems(items);
    return NextResponse.json({ items: safe, page, total: Number(count) });
  } catch (e:any) {
    if (Sentry?.captureException) Sentry.captureException(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
