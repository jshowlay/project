import { NextRequest, NextResponse } from 'next/server';
import { refreshSearchMV } from '@/server/search_mv';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await refreshSearchMV();
  return NextResponse.json(result);
}
