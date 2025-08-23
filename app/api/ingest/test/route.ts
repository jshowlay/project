import { NextRequest, NextResponse } from 'next/server';
import { getIngestSupervisor } from '../../../../lib/ingest/supervisor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, action = 'test' } = body;

    if (!source) {
      return NextResponse.json(
        { error: 'Source parameter is required' },
        { status: 400 }
      );
    }

    const supervisor = getIngestSupervisor();

    switch (action) {
      case 'test':
        const testResult = await supervisor.testConnector(source);
        return NextResponse.json({
          success: testResult.success,
          result: testResult.result,
          error: testResult.error,
        });

      case 'health':
        const connector = await supervisor.getConnector(source);
        if (!connector) {
          return NextResponse.json(
            { error: `Connector for ${source} not found` },
            { status: 404 }
          );
        }
        const health = await connector.getHealth();
        return NextResponse.json({
          success: true,
          health,
        });

      case 'ingest':
        const result = await supervisor.runIngestion([source]);
        return NextResponse.json({
          success: result.success,
          results: result.results,
          metrics: result.metrics,
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supervisor = getIngestSupervisor();
    const health = await supervisor.getHealth();
    
    return NextResponse.json({
      success: true,
      availableSources: health.supervisor.availableSources,
      connectorCount: health.supervisor.connectorCount,
      health,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
