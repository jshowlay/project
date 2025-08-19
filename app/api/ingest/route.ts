import { NextRequest, NextResponse } from 'next/server';
import { runIngestion, runBatchIngestion } from '../../../lib/ingest';
import { logger } from '../../../lib/logger';

export const dynamic = 'force-dynamic';

// Authenticate request using secret
function authenticateRequest(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.INGEST_SECRET;
  
  if (!expectedSecret) {
    logger.error('INGEST_SECRET not configured');
    return false;
  }
  
  if (!secret || secret !== expectedSecret) {
    logger.warn('Invalid ingest secret provided', { 
      provided: secret ? '***' : 'none',
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    });
    return false;
  }
  
  return true;
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

    logger.info('Starting ingestion via API', { batch, batchSize });

    // Run ingestion
    const result = batch 
      ? await runBatchIngestion(batchSize)
      : await runIngestion();

    const duration = Date.now() - startTime;

    // Log the API call
    logger.info('Ingestion API call completed', {
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
        success: true,
        message: 'Data ingestion completed successfully',
        data: {
          totalItems: result.totalItems,
          sourcesProcessed: result.sourcesProcessed,
          duration: result.duration,
          errors: result.errors,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Data ingestion completed with errors',
        data: {
          totalItems: result.totalItems,
          sourcesProcessed: result.sourcesProcessed,
          duration: result.duration,
          errors: result.errors,
        },
        timestamp: new Date().toISOString(),
      }, { status: 207 }); // 207 Multi-Status for partial success
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Ingestion API call failed', { error: errorMessage, duration });
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
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

    const { checkIngestionHealth } = await import('../../../lib/ingest');
    const health = await checkIngestionHealth();

    return NextResponse.json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      sources: health.sources,
      errors: health.errors,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Health check failed', { error: errorMessage });
    
    return NextResponse.json({
      status: 'unhealthy',
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
