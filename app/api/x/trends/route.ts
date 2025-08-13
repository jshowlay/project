import { NextRequest, NextResponse } from 'next/server';
import { trendsByWOEID } from '@/integrations/x';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const w = Number((new URL(req.url)).searchParams.get('woeid') || '23424977');
  try {
    const items = await trendsByWOEID(w);
    return NextResponse.json({ ok:true, count: items.length, items });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? 'fail' }, { status: 500 });
  }
}
