import { NextRequest, NextResponse } from 'next/server';
import { ingestAll } from '../../../src/server/ingest';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const t0 = Date.now();
  const { inserted, sources } = await ingestAll();
  return NextResponse.json({ inserted, sources, tookMs: Date.now()-t0 });
}
