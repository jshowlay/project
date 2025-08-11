import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();

  // Get top tags (distinct with counts)
  const rows = await prisma.$queryRaw<Array<{ tag: string; cnt: bigint }>>`
    SELECT t.tag, COUNT(*)::bigint AS cnt
    FROM (
      SELECT UNNEST("tags") AS tag
      FROM "TrendRecord"
    ) t
    WHERE (${q === ''} OR LOWER(t.tag) LIKE ${'%' + q + '%'})
    GROUP BY t.tag
    ORDER BY cnt DESC
    LIMIT 50
  `;

  return NextResponse.json({
    tags: rows.map(r => ({ tag: r.tag, count: Number(r.cnt) }))
  });
}
