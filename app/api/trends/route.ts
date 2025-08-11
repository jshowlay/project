import { NextRequest, NextResponse } from 'next/server';
import { prisma, redis } from '../../../src/server/db';
import { Prisma } from '@prisma/client';
import { parseQuery } from '../../../src/search/query';

function normalizeTagsArray(items: any[]) {
  return items.map((it: any) => {
    let tags = it?.tags;
    if (Array.isArray(tags)) {
      // ok
    } else if (tags == null) {
      tags = [];
    } else if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        tags = Array.isArray(parsed) ? parsed : [tags];
      } catch {
        tags = [tags];
      }
    } else {
      // unknown shape -> drop to empty array
      tags = [];
    }
    return { ...it, tags };
  });
}

function parseDate(v: string | null) {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Read raw query + classic params for backwards compatibility
  const qRaw = (searchParams.get('q') || '').trim();
  const sourceParam = searchParams.get('source') || undefined;
  const regionParam = searchParams.get('region') || undefined;
  const sinceParam = parseDate(searchParams.get('since'));
  const untilParam = parseDate(searchParams.get('until') || searchParams.get('before'));
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);
  const offset = (page - 1) * limit;

  // Parse operators inside q
  const parsed = parseQuery(qRaw);

  // Merge classic params (explicit params win if both present)
  const sources = (sourceParam ? [sourceParam] : parsed.sources).map(s => s.toLowerCase());
  const region = regionParam ?? parsed.region;
  const since = sinceParam ?? parsed.since;
  const until = untilParam ?? parsed.until;
  const text = parsed.text;
  const minScore = parsed.minScore;
  const maxScore = parsed.maxScore;
  const minDelta24h = parsed.minDelta24h;
  const maxDelta24h = parsed.maxDelta24h;
  const tags = parsed.tags;
  const sort = parsed.sort;

  // Default/no-filter cache
  if (!qRaw && !sourceParam && !region && !since && !until && page === 1) {
    const cached = await redis().get('trends:latest');
    if (cached) return NextResponse.json({ items: JSON.parse(cached), page: 1, total: 100 });
  }

  // Build WHERE conditions for SQLite
  const where: any = {};

  // Text conditions: search in topic OR tags
  const hasText = Boolean(text);
  if (hasText) {
    where.OR = [
      { topic: { contains: text } },
      { tags: { contains: text } }
    ];
  }

  // Tag filters: search in tags field
  if (tags.length > 0) {
    const tagConditions = tags.map(tag => ({ tags: { contains: tag } }));
    if (where.OR) {
      // If we already have OR conditions, we need to restructure
      where.AND = [
        { OR: where.OR },
        { OR: tagConditions }
      ];
      delete where.OR;
    } else {
      where.OR = tagConditions;
    }
  }

  // Source filters
  if (sources.length > 0) {
    where.source = { in: sources };
  }

  // Other filters
  if (region) where.region = region;
  if (since) where.observedAt = { gte: since };
  if (until) where.observedAt = { ...where.observedAt, lte: until };
  if (minScore != null) where.score = { ...where.score, gte: minScore };
  if (maxScore != null) where.score = { ...where.score, lte: maxScore };
  if (minDelta24h != null) where.delta24h = { ...where.delta24h, gte: minDelta24h };
  if (maxDelta24h != null) where.delta24h = { ...where.delta24h, lte: maxDelta24h };

  // Determine order by
  const orderBy = 
    sort === 'score' ? [{ score: 'desc' as const }, { observedAt: 'desc' as const }] :
    sort === 'recency' ? [{ observedAt: 'desc' as const }] :
    [{ observedAt: 'desc' as const }];

  // Primary query
  const [items, total] = await Promise.all([
    prisma.trendRecord.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.trendRecord.count({ where }),
  ]);

  // Normalize tags to arrays
  const normalizedItems = normalizeTagsArray(items);

  return NextResponse.json({ items: normalizedItems, page, total });
}
