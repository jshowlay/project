import { NextRequest, NextResponse } from 'next/server';
import { prisma, redis } from '../../../src/server/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') ?? undefined;
  const q = searchParams.get('q') ?? undefined;
  const region = searchParams.get('region') ?? undefined;
  const since = searchParams.get('since') ? new Date(searchParams.get('since')!) : undefined;
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);

  if (!q && !source && !region && !since && page === 1) {
    const cached = await redis().get('trends:latest');
    if (cached) return NextResponse.json({ items: JSON.parse(cached), page: 1, total: 100 });
  }

  const where:any = {};
  if (source) where.source = source;
  if (region) where.region = region;
  if (since) where.observedAt = { gte: since };
  if (q) where.topic = { contains: q, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    prisma.trendRecord.findMany({
      where,
      orderBy: { observedAt: 'desc' },
      take: limit,
      skip: (page-1)*limit
    }),
    prisma.trendRecord.count({ where })
  ]);
  return NextResponse.json({ items, page, total });
}
