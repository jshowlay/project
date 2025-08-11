import { NextResponse } from 'next/server';
import { prisma, redis } from '../../../src/server/db';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis().ping();
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown' }, { status: 500 });
  }
}
