import { prisma } from '@/server/db';

export async function refreshSearchMV() {
  try {
    await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY tr_trends_mv`);
    return { ok: true };
  } catch (e:any) {
    // fallback without CONCURRENTLY if first time or missing index
    try {
      await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW tr_trends_mv`);
      return { ok: true, fallback: true };
    } catch (err:any) {
      return { ok: false, error: err?.message ?? 'refresh failed' };
    }
  }
}
