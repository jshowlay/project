import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

interface TrendSignal {
  velocity: number;
  acceleration: number;
  convergence: number;
  searchIntent: number;
  creatorIndex: number;
  engagementEfficiency: number;
  geoSpread: number;
}

interface TrendData {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  publishedAt: string;
  score: number;
  trendScore: number;
  signals: TrendSignal;
  sparkline: number[];
  classification: 'emerging' | 'breaking' | 'cooling' | 'spiky' | 'converging';
  saved: boolean;
  alerted: boolean;
}

interface TrendsResponse {
  trends: TrendData[];
  kpis: {
    topMovers: number;
    breakouts: number;
    converging: number;
    highIntent: number;
  };
  lastUpdated: string;
}

// Generate realistic sparkline data
function generateSparkline(baseValue: number, volatility: number = 0.3): number[] {
  const points = 60;
  const sparkline: number[] = [];
  let currentValue = baseValue;
  
  for (let i = 0; i < points; i++) {
    // Add some randomness and trend
    const change = (Math.random() - 0.5) * volatility * baseValue;
    const trend = Math.sin(i / 10) * baseValue * 0.1; // Subtle trend
    currentValue = Math.max(0, Math.round(currentValue + change + trend));
    sparkline.push(currentValue);
  }
  
  return sparkline;
}

// Convert database record to rich trend data
function toRichTrendData(record: any): TrendData {
  const tags = Array.isArray(record.tags) ? record.tags : [];
  const category = tags.find(t => ['lifestyle', 'technology', 'fashion', 'health', 'gaming'].includes(t)) || 'general';
  
  // Generate mock signals based on score and delta24h
  const baseScore = record.score || 50;
  const delta = record.delta24h || 0;
  const signals: TrendSignal = {
    velocity: Math.min(100, Math.max(0, baseScore + delta * 0.5)),
    acceleration: Math.min(100, Math.max(0, delta * 2)),
    convergence: Math.min(100, Math.max(0, baseScore - Math.abs(delta) * 0.3)),
    searchIntent: Math.min(100, Math.max(0, baseScore + delta * 0.2)),
    creatorIndex: Math.min(100, Math.max(0, baseScore - 10)),
    engagementEfficiency: Math.min(100, Math.max(0, baseScore + 5)),
    geoSpread: Math.min(100, Math.max(0, baseScore - 15))
  };

  // Determine classification based on signals
  let classification: TrendData['classification'] = 'emerging';
  if (signals.velocity > 85 && signals.acceleration > 80) classification = 'breaking';
  else if (signals.convergence > 80) classification = 'converging';
  else if (Math.abs(signals.acceleration) > 70) classification = 'spiky';
  else if (signals.velocity < 60) classification = 'cooling';

  return {
    id: record.id,
    title: record.topic,
    description: `${record.topic} trend from ${record.source}`,
    url: record.url || `https://example.com/${record.source}/${record.topic}`,
    source: record.source,
    category,
    publishedAt: record.observedAt,
    score: baseScore,
    trendScore: record.trend_score || baseScore,
    signals,
    sparkline: generateSparkline(baseScore, 0.3),
    classification,
    saved: false,
    alerted: false
  };
}

// Convert database record to legacy item format
function toLegacyItem(record: any) {
  return {
    id: record.id,
    source: record.source,
    topic: record.topic,
    score: record.trend_score || record.score,
    delta24h: record.delta24h,
    url: record.url,
    region: record.region || 'US',
    tags: Array.isArray(record.tags) ? record.tags : [],
    observedAt: record.observedAt,
    imageUrl: record.imageUrl,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const hasLegacyParams = ['q', 'source', 'page', 'limit'].some(k => searchParams.has(k));

    if (hasLegacyParams) {
      // Legacy homepage shape: { items, total }
      const q = (searchParams.get('q') || '').trim();
      const src = (searchParams.get('source') || '').trim();
      const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
      const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);

      // Build database query
      const where: any = {};
      if (src) where.source = src;
      if (q) {
        where.OR = [
          { topic: { contains: q, mode: 'insensitive' } },
          { tags: { hasSome: [q] } }
        ];
      }

      // Get total count
      const total = await prisma.trendRecord.count({ where });

      // Get paginated results
      const records = await prisma.trendRecord.findMany({
        where,
        orderBy: { observedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const items = records.map(toLegacyItem);

      return NextResponse.json({ items, total, page, limit });
    }

    // Rich trends dashboard shape - get recent trends
    const records = await prisma.trendRecord.findMany({
      orderBy: { observedAt: 'desc' },
      take: 50,
    });

    const trends = records.map(toRichTrendData);
    
    const kpis = {
      topMovers: trends.filter(t => t.signals.velocity > 80).length,
      breakouts: trends.filter(t => t.classification === 'breaking').length,
      converging: trends.filter(t => t.classification === 'converging').length,
      highIntent: trends.filter(t => t.signals.searchIntent > 80).length
    };

    const response: TrendsResponse = {
      trends,
      kpis,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json({
      error: 'Failed to fetch trends data',
      items: [],
      total: 0
    }, { status: 500 });
  }
}
