import { NextRequest, NextResponse } from 'next/server';
import { fetchHashtagItems } from '@/integrations/instagram';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const tag = (new URL(req.url)).searchParams.get('tag') || 'ai';
  try {
    const items = await fetchHashtagItems(tag);
    return NextResponse.json({ ok: true, count: items.length, items });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'fail' }, { status: 500 });
  }
}
