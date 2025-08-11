import { prisma } from '@/server/db';

export async function refreshSearchMV() {
  try {
    // SQLite doesn't support materialized views, so we'll just return success
    // In a real PostgreSQL setup, this would refresh the materialized view
    return { ok: true, note: 'SQLite - no MV refresh needed' };
  } catch (err:any) {
    return { ok: false, error: err?.message ?? 'refresh failed' };
  }
}
