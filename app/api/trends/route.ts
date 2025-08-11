import { NextRequest, NextResponse } from 'next/server';
import { prisma, redis } from '../../../src/server/db';

function parseDate(v: string | null) {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const qRaw = (searchParams.get('q') || '').trim();
  const source = searchParams.get('source') || undefined;
  const region = searchParams.get('region') || undefined;
  const since = parseDate(searchParams.get('since'));
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);
  const offset = (page - 1) * limit;

  // Cache only the default view (no filters/search)
  if (!qRaw && !source && !region && !since && page === 1) {
    const cached = await redis().get('trends:latest');
    if (cached) return NextResponse.json({ items: JSON.parse(cached), page: 1, total: 100 });
  }

  // No query: normal filtered fetch by recency
  if (!qRaw) {
    const where: any = {};
    if (source) where.source = source;
    if (region) where.region = region;
    if (since) where.observedAt = { gte: since };
    const [items, total] = await Promise.all([
      prisma.trendRecord.findMany({
        where,
        orderBy: [{ observedAt: 'desc' }],
        take: limit,
        skip: offset,
      }),
      prisma.trendRecord.count({ where }),
    ]);
    return NextResponse.json({ items, page, total });
  }

  // --- Search path for SQLite ---
  const where: any = {};
  if (source) where.source = source;
  if (region) where.region = region;
  if (since) where.observedAt = { gte: since };
  
  // Simple LIKE search for SQLite
  where.OR = [
    { topic: { contains: qRaw } },
    { tags: { contains: qRaw } }
  ];

  const [items, total] = await Promise.all([
    prisma.trendRecord.findMany({
      where,
      orderBy: [{ observedAt: 'desc' }],
      take: limit,
      skip: offset,
    }),
    prisma.trendRecord.count({ where }),
  ]);

  return NextResponse.json({ items, page, total });
}
