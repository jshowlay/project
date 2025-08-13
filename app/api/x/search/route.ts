import { NextRequest, NextResponse } from 'next/server';
import { searchRecent } from '@/integrations/x';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const q = (new URL(req.url)).searchParams.get('q') || 'ai';
  try {
    const items = await searchRecent(q, 50);
    return NextResponse.json({ ok:true, count: items.length, items });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? 'fail' }, { status: 500 });
  }
}
