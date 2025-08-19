import { NextRequest, NextResponse } from 'next/server';
import { runIngestion, runBatchIngestion, checkIngestionHealth } from '../../../lib/ingest';
import { logger } from '../../../lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Authenticate request using secret (supports both query param and Bearer token)
function authenticateRequest(request: NextRequest): boolean {
  const { searchParams } = request.nextUrl;
  const querySecret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : undefined;
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    logger.error({ msg: 'CRON_SECRET not configured' });
    return false;
  }

  if (!querySecret && !bearerToken) {
    logger.warn({
      msg: 'No authentication provided',
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    });
    return false;
  }

  const isValid = querySecret === expectedSecret || bearerToken === expectedSecret;

  if (!isValid) {
    logger.warn({
      msg: 'Invalid authentication provided',
      providedQuery: querySecret ? '***' : 'none',
      providedBearer: bearerToken ? '***' : 'none',
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    });
  }

  return isValid;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate request
    if (!authenticateRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body for options
    let options = {};
    try {
      const body = await request.json();
      options = body || {};
    } catch (error) {
      // No body provided, use defaults
    }

    const { batch = false, batchSize = 100 } = options as { batch?: boolean; batchSize?: number };

    logger.info({
      msg: 'Starting ingestion via API',
      batch,
      batchSize,
    });

    // Run ingestion
    const result = batch 
      ? await runBatchIngestion(batchSize)
      : await runIngestion();

    const duration = Date.now() - startTime;

    // Log the API call
    logger.info({
      msg: 'Ingestion API call completed',
      success: result.success,
      totalItems: result.totalItems,
      sourcesProcessed: result.sourcesProcessed,
      errors: result.errors.length,
      duration,
      batch,
      batchSize,
    });

    // Return response
    if (result.success) {
      return NextResponse.json({
        ok: true,
        inserted: result.totalItems,
        sources: result.sourcesProcessed,
        duration: result.duration,
        errors: result.errors,
      });
    } else {
      return NextResponse.json({
        ok: false,
        inserted: result.totalItems,
        sources: result.sourcesProcessed,
        duration: result.duration,
        errors: result.errors,
      }, { status: 207 }); // 207 Multi-Status for partial success
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error({
      msg: 'Ingestion API call failed',
      error: errorMessage,
      duration,
    });
    
    return NextResponse.json({
      ok: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

// GET endpoint for health check
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    if (!authenticateRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const health = await checkIngestionHealth();

    return NextResponse.json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      sources: health.sources,
      errors: health.errors,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error({
      msg: 'Health check failed',
      error: errorMessage,
    });

    return NextResponse.json({
      status: 'unhealthy',
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
