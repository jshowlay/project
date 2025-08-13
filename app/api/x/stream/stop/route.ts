import { NextResponse } from 'next/server';
import { stopStream, isStreaming } from '@/integrations/x_stream';
export const runtime = 'nodejs';
export async function POST(){ const r = await stopStream(); return NextResponse.json({ ok:true, running:false, stopped:r.stopped }); }
