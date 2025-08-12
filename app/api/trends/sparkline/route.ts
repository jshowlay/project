import { NextRequest, NextResponse } from 'next/server';
import { getTimeseriesPoints } from '@/integrations/googleTrends';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const term = (searchParams.get('term') || '').trim();
    const geo  = (searchParams.get('geo')  || process.env.TRENDS_DEFAULT_GEO || 'US').trim();
    const date = (searchParams.get('date') || 'today 12-m').trim();
    if (!term) return NextResponse.json({ ok: true, points: [] });
    const points = await getTimeseriesPoints(term, geo, date);
    return NextResponse.json({ ok: true, points });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'fail' }, { status: 500 });
  }
}
