import { NextRequest, NextResponse } from 'next/server';
import { getTrendingItems, getAvailableSources, getTrendStats } from '../../../lib/db';
import { logger } from '../../../lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = request.nextUrl;
    
    // Parse query parameters
    const source = searchParams.get('source');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const minTrendScore = parseInt(searchParams.get('minTrendScore') || '0', 10);
    const minVelocity = parseInt(searchParams.get('minVelocity') || '0', 10);
    const includeStats = searchParams.get('stats') === 'true';
    
    logger.info({
      msg: 'Trends API request',
      source,
      limit,
      minTrendScore,
      minVelocity,
      includeStats,
    });

    // Get trending items
    const items = await getTrendingItems({
      source: source || undefined,
      limit,
      minTrendScore,
      minVelocity,
    });

    // Get additional data if requested
    let stats = null;
    let availableSources = null;
    
    if (includeStats) {
      try {
        [stats, availableSources] = await Promise.all([
          getTrendStats(),
          getAvailableSources(),
        ]);
      } catch (error) {
        logger.warn({
          msg: 'Failed to get stats or sources',
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue without stats
      }
    }

    const duration = Date.now() - startTime;
    
    logger.info({
      msg: 'Trends API response',
      itemCount: items.length,
      duration,
      includeStats: !!stats,
    });

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        items,
        total: items.length,
        stats,
        availableSources,
      },
      meta: {
        source: source || 'all',
        limit,
        minTrendScore,
        minVelocity,
        duration,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error({
      msg: 'Trends API failed',
      error: errorMessage,
      duration,
    });
    
    // Return a more graceful error response
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trending data',
      message: 'Database connection or query failed. Please check your configuration.',
      data: {
        items: [],
        total: 0,
        stats: null,
        availableSources: [],
      },
      meta: {
        source: 'all',
        limit: 50,
        minTrendScore: 0,
        minVelocity: 0,
        duration,
      },
      timestamp: new Date().toISOString(),
    }, { status: 503 }); // Service Unavailable
  }
}
