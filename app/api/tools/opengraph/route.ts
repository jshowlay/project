import { NextRequest, NextResponse } from 'next/server';
import { getOpenGraph } from '@/server/opengraph';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const u = (new URL(req.url)).searchParams.get('u') || '';
  if (!u) return NextResponse.json({ ok:false, error:'Missing u' }, { status: 400 });
  const data = await getOpenGraph(u);
  if (!data) return NextResponse.json({ ok:false, error:'No data' }, { status: 502 });
  return NextResponse.json({ ok:true, data });
}
