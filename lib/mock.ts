import { TrendData, TrendSignals } from '@/types/trend';

const MOCK_SOURCES = ['twitter', 'reddit', 'instagram', 'youtube', 'tiktok', 'newsapi'];
const MOCK_REGIONS = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP'];
const MOCK_TAGS = ['ai', 'crypto', 'tech', 'gaming', 'sports', 'entertainment', 'politics', 'business'];

function generateMockSignals(): TrendSignals {
  return {
    velocity: Math.floor(Math.random() * 100),
    acceleration: Math.floor(Math.random() * 200) - 100,
    convergence: Math.floor(Math.random() * 100),
    searchIntent: Math.floor(Math.random() * 100),
    creatorIndex: Math.floor(Math.random() * 100),
    engagementEfficiency: Math.floor(Math.random() * 100),
    geoSpread: Math.floor(Math.random() * 100)
  };
}

function generateMockTrend(id: string): TrendData {
  const source = MOCK_SOURCES[Math.floor(Math.random() * MOCK_SOURCES.length)];
  const region = MOCK_REGIONS[Math.floor(Math.random() * MOCK_REGIONS.length)];
  const tags = MOCK_TAGS.slice(0, Math.floor(Math.random() * 4) + 1);
  
  const signals = generateMockSignals();
  const score = Math.floor(signals.velocity * 0.7 + Math.abs(signals.acceleration) * 0.3);
  
  const titles = [
    'AI Breakthrough in Quantum Computing',
    'New Cryptocurrency Surges 500%',
    'Viral TikTok Challenge Goes Global',
    'Tech Giant Announces Revolutionary Product',
    'Sports Team Makes Historic Comeback',
    'Political Debate Sparks Social Media Storm',
    'Gaming Industry Records Highest Revenue',
    'Environmental Initiative Gains Momentum',
    'Celebrity Endorsement Drives Sales',
    'Scientific Discovery Changes Everything'
  ];

  const title = titles[Math.floor(Math.random() * titles.length)];
  const lastSeenAt = new Date(Date.now() - Math.random() * 3600000).toISOString();

  return {
    id,
    title,
    source,
    region,
    score: Math.max(score, 10),
    velocity: signals.velocity,
    acceleration: signals.acceleration,
    imageUrl: Math.random() > 0.5 ? `https://picsum.photos/400/300?random=${id}` : undefined,
    url: `https://example.com/trend/${id}`,
    lastSeenAt,
    signals,
    tags
  };
}

export function generateMockTrends(count: number = 20): TrendData[] {
  const trends: TrendData[] = [];
  
  for (let i = 0; i < count; i++) {
    const id = `mock-${Date.now()}-${i}`;
    trends.push(generateMockTrend(id));
  }
  
  return trends.sort((a, b) => b.score - a.score);
}

export function generateMockTrendsWithFilters(filters: {
  query?: string;
  sources?: string[];
  region?: string;
  sinceMins?: number;
  minScore?: number;
  limit?: number;
}): TrendData[] {
  const {
    query = '',
    sources = [],
    region = '',
    sinceMins = 60,
    minScore = 0,
    limit = 50
  } = filters;

  let trends = generateMockTrends(limit * 2); // Generate more to filter from

  // Apply filters
  if (query) {
    trends = trends.filter(trend => 
      trend.title.toLowerCase().includes(query.toLowerCase()) ||
      trend.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }

  if (sources.length > 0) {
    trends = trends.filter(trend => sources.includes(trend.source));
  }

  if (region) {
    trends = trends.filter(trend => 
      trend.region.toLowerCase().includes(region.toLowerCase())
    );
  }

  if (minScore > 0) {
    trends = trends.filter(trend => trend.score >= minScore);
  }

  // Time filter (simulate)
  const cutoffTime = new Date(Date.now() - sinceMins * 60000);
  trends = trends.filter(trend => new Date(trend.lastSeenAt) >= cutoffTime);

  return trends.slice(0, limit);
}

export function getMockAvailableSources(): string[] {
  return [...MOCK_SOURCES];
}

export function getMockTrendsCount(): number {
  return Math.floor(Math.random() * 100) + 50;
}
