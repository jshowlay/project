import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim().toUpperCase();

  const rows = await prisma.$queryRaw<Array<{ region: string }>>`
    SELECT DISTINCT "region" FROM "TrendRecord"
    WHERE "region" IS NOT NULL
      AND (${q === ''} OR UPPER("region") LIKE ${q + '%'})
    ORDER BY "region"
    LIMIT 50
  `;
  return NextResponse.json({ regions: rows.map(r => r.region) });
}
