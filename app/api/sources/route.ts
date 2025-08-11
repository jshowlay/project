import { NextResponse } from 'next/server';
import { activeAdapters } from '../../../src/integrations';

export async function GET() {
  const active = activeAdapters().map(a => a.SOURCE_ID);
  const all = ['reddit','youtube','newsapi','coingecko','alphavantage'];
  return NextResponse.json({ active, all });
}
