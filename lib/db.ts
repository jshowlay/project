import { neon } from '@neondatabase/serverless';
import { TrendData } from '../types/trend';

const sql = neon(process.env.DATABASE_URL!);

export interface DatabaseTrend {
  id: string;
  title: string;
  source: string;
  region: string;
  score: number;
  velocity: number;
  accel: number;
  image_url?: string;
  url?: string;
  last_seen_at: string;
  signals: any;
  tags?: string[];
}

export async function getLiveTrends(filters: {
  query?: string;
  sources?: string[];
  region?: string;
  sinceMins?: number;
  minScore?: number;
  limit?: number;
}): Promise<TrendData[]> {
  try {
    const {
      query = '',
      sources = [],
      region = '',
      sinceMins = 60,
      minScore = 0,
      limit = 50
    } = filters;

    let whereConditions = [];
    let params: any[] = [];
    let paramIndex = 1;

    // Time filter
    whereConditions.push(`last_seen_at >= NOW() - INTERVAL '${sinceMins} minutes'`);
    
    // Score filter
    if (minScore > 0) {
      whereConditions.push(`score >= $${paramIndex++}`);
      params.push(minScore);
    }

    // Region filter
    if (region) {
      whereConditions.push(`region ILIKE $${paramIndex++}`);
      params.push(`%${region}%`);
    }

    // Sources filter
    if (sources.length > 0) {
      whereConditions.push(`source = ANY($${paramIndex++})`);
      params.push(sources);
    }

    // Query filter
    if (query) {
      whereConditions.push(`(title ILIKE $${paramIndex++} OR tags::text ILIKE $${paramIndex})`);
      params.push(`%${query}%`);
      params.push(`%${query}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const queryText = `
      SELECT 
        id, title, source, region, score, velocity, accel,
        image_url, url, last_seen_at, signals, tags
      FROM v_trends_live
      ${whereClause}
      ORDER BY score DESC, last_seen_at DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const results = await sql.unsafe(queryText, params);
    
    // Handle different result formats
    const trendsArray = Array.isArray(results) ? results : results.rows || [];
    
    return trendsArray.map(row => ({
      id: row.id,
      title: row.title,
      source: row.source,
      region: row.region,
      score: row.score,
      velocity: row.velocity,
      acceleration: row.accel,
      imageUrl: row.image_url,
      url: row.url,
      lastSeenAt: row.last_seen_at,
      signals: row.signals || {
        velocity: row.velocity,
        acceleration: row.accel,
        convergence: 0,
        searchIntent: 0,
        creatorIndex: 0,
        engagementEfficiency: 0,
        geoSpread: 0
      },
      tags: row.tags || []
    }));

  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Failed to fetch live trends from database');
  }
}

export async function refreshMaterializedView(): Promise<void> {
  try {
    await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trends_hourly`;
  } catch (error) {
    console.error('Failed to refresh materialized view:', error);
    throw new Error('Failed to refresh materialized view');
  }
}

export async function getAvailableSources(): Promise<string[]> {
  try {
    const results = await sql`
      SELECT DISTINCT source 
      FROM v_trends_live 
      WHERE last_seen_at >= NOW() - INTERVAL '24 hours'
      ORDER BY source
    `;
    const sourcesArray = Array.isArray(results) ? results : results.rows || [];
    return sourcesArray.map(row => row.source);
  } catch (error) {
    console.error('Failed to get available sources:', error);
    return [];
  }
}

export async function getTrendsCount(): Promise<number> {
  try {
    const result = await sql`
      SELECT COUNT(*) as count 
      FROM v_trends_live 
      WHERE last_seen_at >= NOW() - INTERVAL '1 hour'
    `;
    const countArray = Array.isArray(result) ? result : result.rows || [];
    return countArray[0]?.count || 0;
  } catch (error) {
    console.error('Failed to get trends count:', error);
    return 0;
  }
}
