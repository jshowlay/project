import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// Utility functions
const clampInt = (value: any, min: number, max: number): number => {
  const num = parseInt(value);
  return isNaN(num) ? min : Math.max(min, Math.min(max, num));
};

const round = (value: number, decimals: number = 2): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// Mock data for fallback
const mockTrends = () => [
  {
    id: 'mock-1',
    title: 'AI and Machine Learning',
    description: 'Artificial intelligence and machine learning technologies',
    source: 'twitter',
    momentum: 85.2,
    volume: 1250,
    sentiment: 0.72,
    growth_rate: 12.5,
    engagement_rate: 8.3,
    reach: 45000,
    mentions: 890,
    hashtags: ['#AI', '#MachineLearning', '#Tech'],
    related_topics: ['Deep Learning', 'Neural Networks', 'Data Science'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-2',
    title: 'Sustainable Energy',
    description: 'Renewable energy and sustainability initiatives',
    source: 'reddit',
    momentum: 78.9,
    volume: 980,
    sentiment: 0.68,
    growth_rate: 9.2,
    engagement_rate: 6.7,
    reach: 32000,
    mentions: 650,
    hashtags: ['#Sustainability', '#RenewableEnergy', '#Climate'],
    related_topics: ['Solar Power', 'Wind Energy', 'Green Tech'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Main query function
const queryTrends = async (params: {
  minutes?: number;
  baseline_hours?: number;
  sources?: string[];
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: string;
  debug?: boolean;
}) => {
  const {
    minutes = 30,
    baseline_hours = 24,
    sources = [],
    limit = 50,
    offset = 0,
    sort_by = 'momentum',
    sort_order = 'desc',
    debug = false
  } = params;

  const sourceFilter = sources.length > 0 ? `AND source IN (${sources.map(s => `'${s}'`).join(',')})` : '';
  
  const query = sql`
    WITH current_period AS (
      SELECT 
        topic_id,
        source,
        COUNT(*) as current_mentions,
        AVG(sentiment_score) as current_sentiment,
        COUNT(DISTINCT user_id) as current_users,
        COUNT(DISTINCT DATE_TRUNC('hour', created_at)) as current_hours
      FROM social_mentions 
      WHERE created_at >= NOW() - INTERVAL '${minutes} minutes'
      ${sourceFilter}
      GROUP BY topic_id, source
    ),
    baseline_period AS (
      SELECT 
        topic_id,
        source,
        COUNT(*) as baseline_mentions,
        AVG(sentiment_score) as baseline_sentiment,
        COUNT(DISTINCT user_id) as baseline_users,
        COUNT(DISTINCT DATE_TRUNC('hour', created_at)) as baseline_hours
      FROM social_mentions 
      WHERE created_at >= NOW() - INTERVAL '${baseline_hours} hours'
        AND created_at < NOW() - INTERVAL '${minutes} minutes'
      ${sourceFilter}
      GROUP BY topic_id, source
    ),
    topic_metrics AS (
      SELECT 
        t.id,
        t.title,
        t.description,
        t.created_at,
        t.updated_at,
        COALESCE(cp.source, bp.source) as source,
        COALESCE(cp.current_mentions, 0) as current_mentions,
        COALESCE(bp.baseline_mentions, 0) as baseline_mentions,
        COALESCE(cp.current_sentiment, 0) as current_sentiment,
        COALESCE(bp.baseline_sentiment, 0) as baseline_sentiment,
        COALESCE(cp.current_users, 0) as current_users,
        COALESCE(bp.baseline_users, 0) as baseline_users,
        COALESCE(cp.current_hours, 1) as current_hours,
        COALESCE(bp.baseline_hours, 1) as baseline_hours
      FROM topics t
      LEFT JOIN current_period cp ON t.id = cp.topic_id
      LEFT JOIN baseline_period bp ON t.id = bp.topic_id
      WHERE cp.topic_id IS NOT NULL OR bp.topic_id IS NOT NULL
    ),
    calculated_metrics AS (
      SELECT 
        *,
        -- Momentum calculation (weighted by time periods)
        CASE 
          WHEN baseline_mentions > 0 THEN 
            ROUND(
              ((current_mentions::float / current_hours) / (baseline_mentions::float / baseline_hours)) * 100, 
              2
            )
          ELSE current_mentions * 10
        END as momentum,
        
        -- Volume (total mentions in current period)
        current_mentions as volume,
        
        -- Sentiment (weighted average)
        CASE 
          WHEN baseline_mentions > 0 THEN 
            ROUND(
              (current_sentiment * current_mentions + baseline_sentiment * baseline_mentions) / 
              (current_mentions + baseline_mentions), 
              3
            )
          ELSE current_sentiment
        END as sentiment,
        
        -- Growth rate (percentage change)
        CASE 
          WHEN baseline_mentions > 0 THEN 
            ROUND(
              ((current_mentions - baseline_mentions)::float / baseline_mentions) * 100, 
              2
            )
          ELSE 100
        END as growth_rate,
        
        -- Engagement rate (users per mention)
        CASE 
          WHEN current_mentions > 0 THEN 
            ROUND((current_users::float / current_mentions) * 100, 2)
          ELSE 0
        END as engagement_rate,
        
        -- Reach (estimated based on users and mentions)
        current_users * 50 as reach,
        
        -- Total mentions
        current_mentions as mentions
      FROM topic_metrics
    )
    SELECT 
      id,
      title,
      description,
      source,
      momentum,
      volume,
      sentiment,
      growth_rate,
      engagement_rate,
      reach,
      mentions,
      created_at,
      updated_at
    FROM calculated_metrics
    ORDER BY ${sort_by} ${sort_order === 'desc' ? 'DESC' : 'ASC'}
    LIMIT ${limit} OFFSET ${offset}
  `;

  if (debug) {
    logger.info('Trends query:', { query: query.sql, params });
  }

  return await db.execute(query);
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate parameters
    const minutes = clampInt(searchParams.get('minutes'), 5, 1440); // 5 min to 24 hours
    const baseline_hours = clampInt(searchParams.get('baseline_hours'), 1, 168); // 1 hour to 1 week
    const sources = searchParams.get('sources')?.split(',').filter(Boolean) || [];
    const limit = clampInt(searchParams.get('limit'), 1, 100);
    const offset = clampInt(searchParams.get('offset'), 0, 1000);
    const sort_by = searchParams.get('sort_by') || 'momentum';
    const sort_order = searchParams.get('sort_order') || 'desc';
    const debug = searchParams.get('debug') === 'true';

    // Validate sort_by parameter
    const validSortFields = ['momentum', 'volume', 'sentiment', 'growth_rate', 'engagement_rate', 'reach', 'mentions', 'created_at'];
    const finalSortBy = validSortFields.includes(sort_by) ? sort_by : 'momentum';
    const finalSortOrder = ['asc', 'desc'].includes(sort_order) ? sort_order : 'desc';

    logger.info('Trends API called', {
      minutes,
      baseline_hours,
      sources,
      limit,
      offset,
      sort_by: finalSortBy,
      sort_order: finalSortOrder,
      debug
    });

    // Execute query
    const result = await queryTrends({
      minutes,
      baseline_hours,
      sources,
      limit,
      offset,
      sort_by: finalSortBy,
      sort_order: finalSortOrder,
      debug
    });

    // Transform results
    const trends = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      source: row.source,
      momentum: round(row.momentum || 0),
      volume: parseInt(row.volume) || 0,
      sentiment: round(row.sentiment || 0, 3),
      growth_rate: round(row.growth_rate || 0),
      engagement_rate: round(row.engagement_rate || 0),
      reach: parseInt(row.reach) || 0,
      mentions: parseInt(row.mentions) || 0,
      hashtags: [], // Would need separate query for hashtags
      related_topics: [], // Would need separate query for related topics
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    const response = {
      success: true,
      data: {
        trends,
        metadata: {
          total: trends.length,
          limit,
          offset,
          minutes,
          baseline_hours,
          sources,
          sort_by: finalSortBy,
          sort_order: finalSortOrder,
          timestamp: new Date().toISOString()
        }
      }
    };

    if (debug) {
      response.data.metadata.debug = {
        query_params: { minutes, baseline_hours, sources, limit, offset, sort_by: finalSortBy, sort_order: finalSortOrder },
        raw_count: result.rows.length
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Error in trends API:', error);
    
    // Return mock data as fallback
    const mockData = mockTrends();
    
    return NextResponse.json({
      success: false,
      error: 'Database query failed, returning mock data',
      data: {
        trends: mockData,
        metadata: {
          total: mockData.length,
          limit: 50,
          offset: 0,
          minutes: 30,
          baseline_hours: 24,
          sources: [],
          sort_by: 'momentum',
          sort_order: 'desc',
          timestamp: new Date().toISOString(),
          fallback: true
        }
      }
    }, { status: 200 }); // Return 200 with fallback data instead of error
  }
}
