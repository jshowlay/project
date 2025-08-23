import { NextRequest, NextResponse } from 'next/server';
import { savedTrendsDB } from '../../../../lib/saved-trends';
import { getUserId } from '../../../../lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { trendId: string } }
) {
  try {
    // Get user ID
    const userId = await getUserId(request);
    
    // Get trend source from query params
    const { searchParams } = new URL(request.url);
    const trendSource = searchParams.get('source');
    
    if (!trendSource) {
      return NextResponse.json({
        success: false,
        error: 'Trend source is required'
      }, { status: 400 });
    }

    // Remove the saved trend
    const removed = await savedTrendsDB.removeSavedTrend(
      userId, 
      params.trendId, 
      trendSource
    );

    if (!removed) {
      return NextResponse.json({
        success: false,
        error: 'Saved trend not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Trend removed from saved list'
    });

  } catch (error) {
    console.error('Error removing saved trend:', error);
    
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { trendId: string } }
) {
  try {
    // Get user ID
    const userId = await getUserId(request);
    
    // Get trend source from query params
    const { searchParams } = new URL(request.url);
    const trendSource = searchParams.get('source');
    
    if (!trendSource) {
      return NextResponse.json({
        success: false,
        error: 'Trend source is required'
      }, { status: 400 });
    }

    // Check if trend is saved
    const isSaved = await savedTrendsDB.isTrendSaved(
      userId, 
      params.trendId, 
      trendSource
    );

    return NextResponse.json({
      success: true,
      data: {
        isSaved,
        trendId: params.trendId,
        trendSource
      }
    });

  } catch (error) {
    console.error('Error checking saved trend:', error);
    
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
