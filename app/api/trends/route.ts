import { NextRequest, NextResponse } from 'next/server';
import { prisma, redis } from '@/server/db';
import { Prisma } from '@prisma/client';
import { parseQuery } from '@/search/query';
import { z } from 'zod';
// Optional Sentry capture on server
let Sentry: any = null;
try { Sentry = require('@sentry/nextjs'); } catch {}

// Robust fallback helpers
function nonEmptyText(s?: string | null) {
  if (!s) return '';
  // remove weird chars, normalize spaces
  let t = s.replace(/[^\p{L}\p{N}\s"':\-]/gu, ' ').replace(/\s+/g, ' ').trim();

  // strip leading boolean operators or dangles: AND, OR, NOT, -, |
  // e.g., "OR \"ai agents\"" -> "\"ai agents\""
  while (/^(AND|OR|NOT|\-|\|\|?|\&\&?)\b/i.test(t)) {
    t = t.replace(/^(AND|OR|NOT|\-|\|\|?|\&\&?)\b\s*/i, '').trim();
  }

  // also strip trailing operators (e.g., "ai OR")
  t = t.replace(/\b(AND|OR|NOT|\-|\|\|?|\&\&?)\s*$/i, '').trim();

  return t;
}

async function tryQuery<T>(q: Promise<T>, onError: (e:any)=>Promise<T>|T): Promise<T> {
  try { return await q; } catch (e) { return await onError(e); }
}

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
    const cleanText = nonEmptyText(text);
    const hasText = cleanText.length > 0;
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

    if (hasText) {
      // we'll push FTS condition per-table below (TSV name differs on MV vs table)
      // still include tags contains text
      whereParts.push(Prisma.sql`EXISTS (SELECT 1 FROM unnest("tags") t WHERE t ILIKE ${'%' + cleanText + '%'})`);
    }
    if (tags.length > 0) {
      const tagConds = tags.map(t => Prisma.sql`EXISTS (SELECT 1 FROM unnest("tags") tg WHERE tg ILIKE ${t})`);
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

    // ORDER BY
    const orderBySql = sort === 'score' ? Prisma.sql`"score" DESC, "observedAt" DESC` : 
                      sort === 'recency' ? Prisma.sql`"observedAt" DESC` : 
                      // rank (with text) else recency
                      hasText ? Prisma.sql`rank DESC, "score" DESC, "observedAt" DESC` : 
                      Prisma.sql`"observedAt" DESC`;

    const useMV = hasText && process.env.USE_SEARCH_MV === 'true';

    let items: any[] = [];
    if (useMV) {
      // Query MV for ranked FTS with fallback to base table
      items = await tryQuery(
        prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT id, source, topic, score, delta24h, url, region, tags, observedAt, language,
            ts_rank_cd(tsv, websearch_to_tsquery('english', ${cleanText})) AS rank
          FROM tr_trends_mv
          WHERE tsv @@ websearch_to_tsquery('english', ${cleanText})
            AND ${whereCommon}
          ORDER BY ${orderBySql}
          LIMIT ${limit} OFFSET ${offset}
        `),
        async (e) => {
          // Fallback to base table FTS if MV missing or tsquery fails
          return await prisma.$queryRaw<any[]>(Prisma.sql`
            SELECT *,
              ts_rank_cd(to_tsvector('english', "topic"), websearch_to_tsquery('english', ${cleanText})) AS rank
            FROM "TrendRecord"
            WHERE ${whereCommon}
              AND (to_tsvector('english',"topic") @@ websearch_to_tsquery('english', ${cleanText})
                   OR EXISTS (SELECT 1 FROM unnest("tags") t WHERE t ILIKE ${'%' + cleanText + '%'}))
            ORDER BY ${orderBySql}
            LIMIT ${limit} OFFSET ${offset}
          `);
        }
      );
    } else if (hasText) {
      // FTS on base table with fallback to ILIKE
      items = await tryQuery(
        prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT *, ts_rank_cd(to_tsvector('english', "topic"), websearch_to_tsquery('english', ${cleanText})) AS rank
          FROM "TrendRecord"
          WHERE ${whereCommon}
            AND (to_tsvector('english',"topic") @@ websearch_to_tsquery('english', ${cleanText}) OR EXISTS (SELECT 1 FROM unnest("tags") t WHERE t ILIKE ${'%' + cleanText + '%'}))
          ORDER BY ${orderBySql}
          LIMIT ${limit} OFFSET ${offset}
        `),
        async () => {
          // Last-ditch fallback: ILIKE only
          return await prisma.$queryRaw<any[]>(Prisma.sql`
            SELECT * FROM "TrendRecord"
            WHERE ${whereCommon}
              AND ("topic" ILIKE ${'%' + cleanText + '%'}
                   OR EXISTS (SELECT 1 FROM unnest("tags") t WHERE t ILIKE ${'%' + cleanText + '%'}))
            ORDER BY "observedAt" DESC
            LIMIT ${limit} OFFSET ${offset}
          `);
        }
      );
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
        WHERE "topic" ILIKE ${'%' + cleanText + '%'}
          AND ${whereCommon}
        ORDER BY "observedAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
    }

    // Safe COUNT with fallback
    let totalCount = 0;
    try {
      const [{ count }] = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count FROM "TrendRecord"
        WHERE ${whereCommon}
          ${hasText ? Prisma.sql`AND (to_tsvector('english',"topic") @@ websearch_to_tsquery('english', ${cleanText})
             OR EXISTS (SELECT 1 FROM unnest("tags") t WHERE t ILIKE ${'%' + cleanText + '%'}))` : Prisma.empty}
      `);
      totalCount = Number(count);
    } catch {
      // safe fallback: approximate with current page + one extra check
      totalCount = items.length + (items.length === limit ? limit : 0);
    }

    // Normalize tags to arrays and validate response
    const safe = items.map(item => ({
      ...item,
      tags: normalizeTags(item.tags),
      observedAt: item.observedAt?.toISOString?.() ?? item.observedAt
    }));

    const debug = new URL(req.url).searchParams.get('debug') === '1';
    if (debug) {
      return NextResponse.json({
        items: safe,
        page,
        total: Number(totalCount ?? 0),
        debug: {
          text,
          cleanText,
          usedMV: hasText && process.env.USE_SEARCH_MV === 'true',
          countApprox: !totalCount
        }
      });
    }

    return NextResponse.json({
      items: safe,
      page,
      total: Number(totalCount ?? 0)
    });
  } catch (e:any) {
    if (Sentry?.captureException) Sentry.captureException(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
