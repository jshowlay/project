import { NextRequest, NextResponse } from 'next/server';
import { listRules, addRules, deleteAllRules, replaceRulesFromEnv } from '@/integrations/x_stream';
export const runtime = 'nodejs';

export async function GET(){ const j = await listRules(); return NextResponse.json(j); }
export async function POST(req: NextRequest){
  const { mode, rules } = await req.json().catch(()=>({}));
  if (mode === 'replaceEnv') { const j = await replaceRulesFromEnv(); return NextResponse.json(j); }
  if (mode === 'deleteAll')  { const j = await deleteAllRules();     return NextResponse.json(j); }
  if (Array.isArray(rules) && rules.length) {
    const j = await addRules(rules.map(String));
    return NextResponse.json(j);
  }
  return NextResponse.json({ ok:false, error:'Invalid payload' }, { status:400 });
}
