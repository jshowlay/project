import { redis } from '@/server/db';
import { prisma } from '@/server/db';

type Provider = 'serpapi' | 'google_alpha';

const SERP_ENDPOINT = 'https://serpapi.com/search';

const GEO = process.env.TRENDS_DEFAULT_GEO || 'US';
const TZ  = Number(process.env.TRENDS_DEFAULT_TZ ?? 420);

function cacheKey(parts: Record<string,string|number|boolean|undefined>) {
  const base = Object.entries(parts).filter(([,v])=>v!==undefined).map(([k,v])=>`${k}:${v}`).join('|');
  return `trenderai:trends:${base}`;
}

async function fromCache<T>(key: string, ttlSec: number, fetcher: ()=>Promise<T>): Promise<T> {
  const c = await redis().get(key);
  if (c) return JSON.parse(c) as T;
  const data = await fetcher();
  await redis().setex(key, ttlSec, JSON.stringify(data));
  return data;
}

export interface TrendData {
  topic: string;
  score: number;
  delta24h?: number;
  region?: string;
  tags?: string[];
  url?: string;
  observedAt: Date;
  source: 'google_trends';
}

export interface TrendsQuery {
  q: string;
  geo?: string;
  timeframe?: string;
  provider?: Provider;
}

// --- SERPAPI ADAPTER ---
async function fetchSerpAPI(query: string, geo: string = GEO): Promise<TrendData[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) throw new Error('SERPAPI_API_KEY not configured');

  const params = new URLSearchParams({
    api_key: apiKey,
    engine: 'google_trends',
    q: query,
    geo: geo,
    data_type: 'TIMESERIES',
    date: 'today 12-m' // last 12 months
  });

  const response = await fetch(`${SERP_ENDPOINT}?${params.toString()}`);
  if (!response.ok) throw new Error(`SerpAPI error: ${response.status}`);

  const data = await response.json();
  
  if (data.error) throw new Error(`SerpAPI error: ${data.error}`);
  if (!data.interest_over_time) return [];

  const trends = data.interest_over_time;
  const results: TrendData[] = [];

  // Process timeline data to calculate scores and deltas
  if (trends.timeline_data && trends.timeline_data.length > 0) {
    const timeline = trends.timeline_data;
    const latest = timeline[timeline.length - 1];
    const previous = timeline[timeline.length - 2] || latest;
    
    const score = latest.values?.[0]?.value || 0;
    const prevScore = previous.values?.[0]?.value || 0;
    const delta24h = score > 0 ? ((score - prevScore) / prevScore) * 100 : 0;

    results.push({
      topic: query,
      score: Math.round(score),
      delta24h: Math.round(delta24h * 100) / 100,
      region: geo,
      tags: [query.toLowerCase(), 'trending', 'google'],
      url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(query)}&geo=${geo}`,
      observedAt: new Date(),
      source: 'google_trends'
    });
  }

  return results;
}

// --- GOOGLE ALPHA API ADAPTER (placeholder) ---
async function fetchGoogleAlpha(query: string, geo: string = GEO): Promise<TrendData[]> {
  const enabled = process.env.TRENDS_ALPHA_ENABLED === 'true';
  const baseUrl = process.env.TRENDS_ALPHA_BASE_URL;
  const token = process.env.TRENDS_ALPHA_TOKEN;

  if (!enabled || !baseUrl || !token) {
    throw new Error('Google Trends Alpha API not configured or enabled');
  }

  // Placeholder implementation - replace when API access is granted
  const response = await fetch(`${baseUrl}/trends`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({
      query,
      geo,
      timeframe: '12m'
    })
  });

  if (!response.ok) throw new Error(`Google Alpha API error: ${response.status}`);
  
  const data = await response.json();
  
  // Transform response to our format (adjust based on actual API response)
  return [{
    topic: query,
    score: data.score || 0,
    delta24h: data.delta24h || 0,
    region: geo,
    tags: [query.toLowerCase(), 'trending', 'google'],
    url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(query)}&geo=${geo}`,
    observedAt: new Date(),
    source: 'google_trends'
  }];
}

// --- MAIN INTEGRATION FUNCTION ---
export async function fetchGoogleTrends(opts: TrendsQuery): Promise<TrendData[]> {
  const { q, geo = GEO, timeframe = '12m', provider = 'serpapi' } = opts;
  
  // Cache key includes all parameters
  const key = cacheKey({
    provider,
    q: q.toLowerCase(),
    geo: geo.toLowerCase(),
    timeframe
  });

  // Cache for 1 hour (3600 seconds)
  return fromCache(key, 3600, async () => {
    let trends: TrendData[];

    try {
      switch (provider) {
        case 'serpapi':
          trends = await fetchSerpAPI(q, geo);
          break;
        case 'google_alpha':
          trends = await fetchGoogleAlpha(q, geo);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      // Store in database
      await Promise.all(trends.map(async (trend) => {
        await prisma.trendRecord.upsert({
          where: {
            source_topic_observedBucket: {
              source: trend.source,
              topic: trend.topic,
              observedBucket: new Date(Math.floor(trend.observedAt.getTime() / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000)
            }
          },
          update: {
            score: trend.score,
            delta24h: trend.delta24h,
            region: trend.region,
            tags: trend.tags,
            url: trend.url,
            observedAt: trend.observedAt
          },
          create: {
            source: trend.source,
            topic: trend.topic,
            score: trend.score,
            delta24h: trend.delta24h,
            region: trend.region,
            tags: trend.tags,
            url: trend.url,
            observedAt: trend.observedAt,
            observedBucket: new Date(Math.floor(trend.observedAt.getTime() / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000)
          }
        });
      }));

      return trends;
    } catch (error) {
      console.error('Google Trends fetch error:', error);
      throw error;
    }
  });
}

// --- BULK FETCH FOR INGESTION ---
export async function ingestGoogleTrends(queries: string[], geo: string = GEO): Promise<void> {
  const provider: Provider = process.env.TRENDS_ALPHA_ENABLED === 'true' ? 'google_alpha' : 'serpapi';
  
  console.log(`Ingesting ${queries.length} Google Trends queries via ${provider}`);
  
  for (const query of queries) {
    try {
      await fetchGoogleTrends({ q: query, geo, provider });
      // Rate limiting - 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to fetch trends for "${query}":`, error);
    }
  }
}

// --- TEST FUNCTION ---
export async function testGoogleTrends(query: string = 'artificial intelligence'): Promise<TrendData[]> {
  console.log(`Testing Google Trends with query: "${query}"`);
  return fetchGoogleTrends({ q: query });
}
