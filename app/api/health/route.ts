import { NextResponse } from 'next/server';
import { prisma, redis } from '../../../src/server/db';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis().ping();
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    console.error('Health check failed:', e);
    return NextResponse.json({ 
      ok: false, 
      error: e?.message ?? 'unknown',
      message: 'Database or Redis connection failed. Check your environment configuration.'
    }, { status: 500 });
  }
}
