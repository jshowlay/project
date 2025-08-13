import { NextResponse } from 'next/server';
import { startStream, isStreaming } from '@/integrations/x_stream';
export const runtime = 'nodejs';
export async function POST(){ const r = await startStream(); return NextResponse.json({ ok:true, running:true, started:r.started, already:isStreaming() && !r.started }); }
