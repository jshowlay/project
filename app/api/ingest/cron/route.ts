import { NextRequest, NextResponse } from 'next/server';
import { getIngestSupervisor } from '../../../../lib/ingest/supervisor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cron job endpoint for scheduled ingestion
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { sources, dryRun = false } = body;

    // Get supervisor
    const supervisor = getIngestSupervisor();
    
    if (dryRun) {
      // Return health check only
      const health = await supervisor.getHealth();
      return NextResponse.json({
        success: true,
        dryRun: true,
        health,
        duration: Date.now() - startTime,
      });
    }

    // Run ingestion
    const result = await supervisor.runIngestion(sources);

    return NextResponse.json({
      success: result.success,
      metrics: result.metrics,
      results: result.results,
      health: result.health,
      duration: Date.now() - startTime,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const supervisor = getIngestSupervisor();
    const health = await supervisor.getHealth();
    
    return NextResponse.json({
      success: true,
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
