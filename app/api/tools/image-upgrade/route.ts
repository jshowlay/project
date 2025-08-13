import { NextRequest, NextResponse } from 'next/server';
import { upgradeImageUrl } from '@/server/image_rules';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const u = (new URL(req.url)).searchParams.get('u') || '';
  if (!u) return NextResponse.json({ ok:false, error:'Missing u' }, { status: 400 });
  try {
    const out = upgradeImageUrl(u);
    return NextResponse.json({ ok:true, input:u, output:out });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: String(e?.message ?? 'fail') }, { status: 500 });
  }
}
