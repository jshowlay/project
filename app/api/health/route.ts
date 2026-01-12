import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import { logger } from '../../../lib/logger';
import { checkIngestionHealth } from '../../../lib/ingest';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    let dbHealthy = false;
    let dbError = null;
    
    try {
      await query('SELECT 1 as health_check');
      dbHealthy = true;
    } catch (error) {
      dbError = error instanceof Error ? error.message : String(error);
    }

    // Check materialized view
    let mvHealthy = false;
    let mvError = null;
    
    try {
      await query('SELECT COUNT(*) as count FROM mv_trends_hourly');
      mvHealthy = true;
    } catch (error) {
      mvError = error instanceof Error ? error.message : String(error);
    }

    // Check ingestion system
    const ingestionHealth = await checkIngestionHealth();

    // Check environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      INGEST_SECRET: !!process.env.INGEST_SECRET,
      ENABLE_REDDIT: process.env.ENABLE_REDDIT !== 'false',
      ENABLE_NYTIMES: process.env.ENABLE_NYTIMES === 'true',
      ENABLE_YOUTUBE: process.env.ENABLE_YOUTUBE === 'true',
      NYTIMES_API_KEY: !!process.env.NYTIMES_API_KEY,
      YOUTUBE_API_KEY: !!process.env.YOUTUBE_API_KEY,
    };

    const duration = Date.now() - startTime;
    
    // Determine overall health
    const overallHealthy = dbHealthy && mvHealthy && ingestionHealth.healthy;
    
    const response = {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      duration,
      checks: {
        database: {
          healthy: dbHealthy,
          error: dbError,
        },
        materializedView: {
          healthy: mvHealthy,
          error: mvError,
        },
        ingestion: {
          healthy: ingestionHealth.healthy,
          sources: ingestionHealth.sources,
          errors: ingestionHealth.errors,
        },
        environment: envCheck,
      },
    };

    logger.info({
      msg: 'Health check completed',
      overallHealthy,
      duration,
      dbHealthy,
      mvHealthy,
      ingestionHealthy: ingestionHealth.healthy,
    });

    return NextResponse.json(response, {
      status: overallHealthy ? 200 : 503,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error({
      msg: 'Health check failed',
      error: errorMessage,
      duration,
    });
    
    return NextResponse.json({
      status: 'unhealthy',
      error: errorMessage,
      timestamp: new Date().toISOString(),
      duration,
    }, { status: 503 });
  }
}
