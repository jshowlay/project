import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// EWMA calculation parameters
const ALPHA = 0.35;

interface TrendAnalytics {
  trendId: string;
  currentScore: number;
  previousEwma: number;
  newEwma: number;
  trendScore: number;
  updatedAt: Date;
}

interface CronResponse {
  success: boolean;
  message: string;
  timestamp: string;
  duration: string;
  metrics: {
    totalTrends: number;
    processedTrends: number;
    failedTrends: number;
    averageEwmaChange: number;
  };
  error?: string;
}

/**
 * Authenticate cron requests using token from query params or headers
 */
function authenticateCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('❌ CRON_SECRET environment variable not set');
    return false;
  }

  // Check query parameter
  const queryToken = request.nextUrl.searchParams.get('token');
  if (queryToken === cronSecret) {
    return true;
  }

  // Check header
  const headerToken = request.headers.get('x-cron-token');
  if (headerToken === cronSecret) {
    return true;
  }

  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  return false;
}

/**
 * Calculate Exponential Weighted Moving Average
 */
function calculateEWMA(currentValue: number, previousEWMA: number): number {
  return ALPHA * currentValue + (1 - ALPHA) * previousEWMA;
}

/**
 * Calculate trend score based on EWMA and other factors
 */
function calculateTrendScore(ewma: number, engagement: number, recency: number): number {
  // Base score from EWMA
  let score = ewma * 0.6;
  
  // Engagement bonus (0-30% of base score)
  const engagementBonus = Math.min(engagement / 1000, 0.3) * score;
  
  // Recency bonus (0-10% of base score, decays over time)
  const recencyBonus = Math.max(0, (1 - recency / 7)) * 0.1 * score;
  
  return Math.round(score + engagementBonus + recencyBonus);
}

/**
 * Main trend computation handler
 */
async function computeTrendAnalytics(): Promise<CronResponse> {
  const startTime = Date.now();
  const metrics = {
    totalTrends: 0,
    processedTrends: 0,
    failedTrends: 0,
    averageEwmaChange: 0
  };

  try {
    console.log('🔄 Starting trend analytics computation...');

    // Get all trends that need EWMA calculation
    const trends = await db.query(`
      SELECT 
        id,
        score,
        COALESCE(ewma, score) as current_ewma,
        COALESCE(metadata->>'engagement', '0')::int as engagement,
        EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 as days_since_creation
      FROM trends 
      WHERE score > 0
      ORDER BY created_at DESC
    `);

    metrics.totalTrends = Array.isArray(trends) ? trends.length : 0;
    console.log(`📊 Found ${metrics.totalTrends} trends to process`);

    if (metrics.totalTrends === 0) {
      return {
        success: true,
        message: 'No trends found for processing',
        timestamp: new Date().toISOString(),
        duration: `${Date.now() - startTime}ms`,
        metrics
      };
    }

    const analytics: TrendAnalytics[] = [];
    let totalEwmaChange = 0;

    // Process each trend
    const trendsArray = Array.isArray(trends) ? trends : [];
    for (const trend of trendsArray) {
      try {
        const currentScore = trend.score;
        const previousEwma = trend.current_ewma;
        const newEwma = calculateEWMA(currentScore, previousEwma);
        const engagement = trend.engagement || 0;
        const recency = trend.days_since_creation || 0;
        const trendScore = calculateTrendScore(newEwma, engagement, recency);

        analytics.push({
          trendId: trend.id,
          currentScore,
          previousEwma,
          newEwma,
          trendScore,
          updatedAt: new Date()
        });

        totalEwmaChange += Math.abs(newEwma - previousEwma);
        metrics.processedTrends++;

      } catch (error) {
        console.error(`❌ Failed to process trend ${trend.id}:`, error);
        metrics.failedTrends++;
      }
    }

    // Batch update the database
    if (analytics.length > 0) {
      const updatePromises = analytics.map(async (analytic) => {
        await db.query(`
          UPDATE trends 
          SET 
            ewma = $1,
            trend_score = $2,
            updated_at = $3,
            metadata = COALESCE(metadata, '{}'::jsonb) || 
              jsonb_build_object('last_ewma_calculation', $4, 'ewma_alpha', $5)
          WHERE id = $6
        `, [
          analytic.newEwma,
          analytic.trendScore,
          analytic.updatedAt,
          new Date().toISOString(),
          ALPHA,
          analytic.trendId
        ]);
      });

      await Promise.all(updatePromises);
      console.log(`✅ Updated ${analytics.length} trends with new EWMA values`);
    }

    metrics.averageEwmaChange = metrics.processedTrends > 0 
      ? totalEwmaChange / metrics.processedTrends 
      : 0;

    const duration = Date.now() - startTime;
    console.log(`✅ Trend analytics computation completed in ${duration}ms`);
    console.log(`📊 Processed: ${metrics.processedTrends}, Failed: ${metrics.failedTrends}, Avg EWMA Change: ${metrics.averageEwmaChange.toFixed(2)}`);

    return {
      success: true,
      message: 'Trend analytics computation completed successfully',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      metrics
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Trend analytics computation failed:', error);
    
    return {
      success: false,
      message: 'Trend analytics computation failed',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      metrics,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * GET handler - returns current analytics status
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    if (!authenticateCronRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current analytics summary
    const summary = await db.query(`
      SELECT 
        COUNT(*) as total_trends,
        COUNT(CASE WHEN ewma IS NOT NULL THEN 1 END) as trends_with_ewma,
        AVG(COALESCE(ewma, 0)) as average_ewma,
        AVG(COALESCE(trend_score, 0)) as average_trend_score,
        MAX(updated_at) as last_update
      FROM trends
    `);

    const stats = summary.rows[0] || {
      total_trends: 0,
      trends_with_ewma: 0,
      average_ewma: 0,
      average_trend_score: 0,
      last_update: null
    };
    
    return NextResponse.json({
      success: true,
      message: 'Trend analytics status retrieved',
      timestamp: new Date().toISOString(),
      stats: {
        totalTrends: parseInt(stats.total_trends),
        trendsWithEwma: parseInt(stats.trends_with_ewma),
        averageEwma: parseFloat(stats.average_ewma || 0),
        averageTrendScore: parseFloat(stats.average_trend_score || 0),
        lastUpdate: stats.last_update
      }
    });

  } catch (error) {
    console.error('❌ Failed to get analytics status:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST handler - triggers trend analytics computation
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    if (!authenticateCronRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Execute trend analytics computation
    const result = await computeTrendAnalytics();
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });

  } catch (error) {
    console.error('❌ Cron endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
