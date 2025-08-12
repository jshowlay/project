import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const [mvExists] = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT to_regclass('public.tr_trends_mv') IS NOT NULL AS exists
    `;
    const [{ total }] = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COUNT(*)::bigint AS total FROM "TrendRecord"
    `;
    return NextResponse.json({
      ok: true,
      materializedView: !!mvExists?.exists,
      total: Number(total),
      useMV: process.env.USE_SEARCH_MV === 'true'
    });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown' }, { status: 500 });
  }
}
