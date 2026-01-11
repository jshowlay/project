import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';
import TikTokIngestionWorker from '../../../../scripts/ingest/tiktok';

/**
 * POST /api/ingest/tiktok
 * Manually trigger TikTok ingestion
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error({
        msg: 'CRON_SECRET environment variable not configured',
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Check authentication
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn({
        msg: 'Unauthorized TikTok ingestion request',
        ip: request.ip,
        userAgent: request.headers.get('user-agent'),
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body for optional parameters
    let requestBody: {
      sources?: string[];
      force?: boolean;
      skipAggregation?: boolean;
    } = {};

    try {
      const bodyText = await request.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
      }
    } catch (error) {
      logger.warn({
        msg: 'Invalid JSON in TikTok ingestion request body',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    logger.info({
      msg: 'TikTok ingestion request received',
      sources: requestBody.sources,
      force: requestBody.force,
      skipAggregation: requestBody.skipAggregation,
    });

    // Check if TikTok ingestion is enabled
    if (process.env.TIKTOK_INGEST_ENABLED !== 'true') {
      logger.info({
        msg: 'TikTok ingestion is disabled',
      });
      return NextResponse.json(
        { 
          success: false,
          message: 'TikTok ingestion is disabled',
          skipped: true,
        },
        { status: 200 }
      );
    }

    // Create and run the ingestion worker
    const worker = new TikTokIngestionWorker();
    
    // Override configuration if sources are specified
    if (requestBody.sources && requestBody.sources.length > 0) {
      // This would require modifying the worker to accept custom sources
      // For now, we'll log the request but use the default configuration
      logger.info({
        msg: 'Custom sources requested but not yet implemented',
        requestedSources: requestBody.sources,
      });
    }

    const result = await worker.runIngestion();
    const duration = Date.now() - startTime;

    // Prepare response
    const response = {
      success: result.success,
      message: result.success ? 'TikTok ingestion completed successfully' : 'TikTok ingestion completed with errors',
      duration,
      stats: {
        totalProcessed: result.totalProcessed,
        totalSkipped: result.totalSkipped,
        totalFailed: result.totalFailed,
        errorCount: result.errors.length,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
      timestamp: new Date().toISOString(),
    };

    logger.info({
      msg: 'TikTok ingestion API request completed',
      success: result.success,
      duration,
      totalProcessed: result.totalProcessed,
      totalSkipped: result.totalSkipped,
      totalFailed: result.totalFailed,
      errorCount: result.errors.length,
    });

    return NextResponse.json(response, {
      status: result.success ? 200 : 207, // 207 Multi-Status for partial success
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    logger.error({
      msg: 'TikTok ingestion API request failed',
      error: errorMsg,
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: errorMsg,
        duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ingest/tiktok
 * Get TikTok ingestion status and configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    logger.info({
      msg: 'TikTok API GET request',
      authHeader: authHeader ? 'present' : 'missing',
      cronSecret: cronSecret ? 'set' : 'not set',
      expectedHeader: `Bearer ${cronSecret}`,
    });

    if (!cronSecret) {
      logger.error({
        msg: 'CRON_SECRET not configured',
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn({
        msg: 'TikTok API authentication failed',
        authHeader,
        expectedHeader: `Bearer ${cronSecret}`,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get configuration information
    const config = {
      enabled: process.env.TIKTOK_INGEST_ENABLED === 'true',
      sources: process.env.TIKTOK_SOURCES || 'trending',
      maxPostsPerSource: parseInt(process.env.TIKTOK_MAX_POSTS_PER_SOURCE || '50'),
      cronSchedule: process.env.TIKTOK_INGEST_CRON || '0 2 * * *', // Default: Daily at 2 AM UTC (Vercel Hobby compatible)
      hourlyAggregation: process.env.TIKTOK_ENABLE_HOURLY_AGGREGATION === 'true',
      cleanupEnabled: process.env.TIKTOK_CLEANUP_OLD_DATA_DAYS ? true : false,
      cleanupDays: parseInt(process.env.TIKTOK_CLEANUP_OLD_DATA_DAYS || '30'),
    };

    // Get recent ingest events (last 10)
    const { query } = await import('../../../../lib/db');
    const eventsResult = await query(
      `SELECT 
        "id", "eventType", "sourceValue", "startedAt", "completedAt", "duration",
        "itemsRequested", "itemsReceived", "itemsProcessed", "itemsSkipped", "itemsFailed",
        "success", "errorMessage"
       FROM "IngestEvent"
       WHERE "source" = 'tiktok'
       ORDER BY "startedAt" DESC
       LIMIT 10`
    );

    const recentEvents = eventsResult.rows.map(row => ({
      ...row,
      startedAt: row.startedAt?.toISOString(),
      completedAt: row.completedAt?.toISOString(),
    }));

    // Get basic statistics
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_posts,
        COUNT(DISTINCT "authorId") as unique_authors,
        COUNT(DISTINCT "sourceValue") as unique_sources,
        MAX("postedAt") as latest_post,
        MIN("postedAt") as earliest_post
       FROM "TikTokPost"`
    );

    const stats = statsResult.rows[0];

    const response = {
      config,
      stats: {
        totalPosts: parseInt(stats.total_posts) || 0,
        uniqueAuthors: parseInt(stats.unique_authors) || 0,
        uniqueSources: parseInt(stats.unique_sources) || 0,
        latestPost: stats.latest_post?.toISOString(),
        earliestPost: stats.earliest_post?.toISOString(),
      },
      recentEvents,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    logger.error({
      msg: 'Failed to get TikTok ingestion status',
      error: errorMsg,
    });

    return NextResponse.json(
      {
        error: 'Failed to get status',
        message: errorMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
