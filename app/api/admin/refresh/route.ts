import { NextRequest, NextResponse } from 'next/server';
import { refreshMaterializedView } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

function authenticateRequest(request: NextRequest): boolean {
  const streamSecret = process.env.STREAM_SECRET;
  if (!streamSecret) {
    console.error('STREAM_SECRET not configured');
    return false;
  }

  // Check query parameter
  const queryToken = request.nextUrl.searchParams.get('token');
  if (queryToken === streamSecret) {
    return true;
  }

  // Check header
  const headerToken = request.headers.get('x-stream-token');
  if (headerToken === streamSecret) {
    return true;
  }

  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${streamSecret}`) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    if (!authenticateRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Refresh materialized view
    await refreshMaterializedView();

    return NextResponse.json({
      success: true,
      message: 'Materialized view refreshed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error refreshing materialized view:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to refresh materialized view',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    if (!authenticateRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Refresh materialized view
    await refreshMaterializedView();

    return NextResponse.json({
      success: true,
      message: 'Materialized view refreshed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error refreshing materialized view:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to refresh materialized view',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
