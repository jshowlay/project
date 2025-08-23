import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/user';
import { 
  isTrendSaved, 
  unsaveTrend, 
  getSavedTrendById,
  initializeDatabase 
} from '@/lib/db';
import { CheckSavedResponse, ApiResponse } from '@/types/trends';

// Initialize database on first request
let dbInitialized = false;
async function ensureDatabaseInitialized() {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new Error('Database initialization failed');
    }
  }
}

// GET /api/saved/[id] - Check if specific trend is saved
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<CheckSavedResponse>> {
  try {
    await ensureDatabaseInitialized();
    
    const userId = getUserIdFromRequest(request);
    const trendId = params.id;
    
    if (!trendId) {
      return NextResponse.json({
        success: false,
        error: 'Trend ID is required'
      }, { status: 400 });
    }
    
    const isSaved = await isTrendSaved(userId, trendId);
    
    return NextResponse.json({
      success: true,
      data: {
        isSaved,
        trendId
      }
    });
    
  } catch (error) {
    console.error('Error in GET /api/saved/[id]:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check saved status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/saved/[id] - Remove saved trend
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    await ensureDatabaseInitialized();
    
    const userId = getUserIdFromRequest(request);
    const trendId = params.id;
    
    if (!trendId) {
      return NextResponse.json({
        success: false,
        error: 'Trend ID is required'
      }, { status: 400 });
    }
    
    // Check if trend is actually saved before attempting to delete
    const isCurrentlySaved = await isTrendSaved(userId, trendId);
    
    if (!isCurrentlySaved) {
      return NextResponse.json({
        success: false,
        error: 'Trend is not saved',
        message: 'Cannot unsave a trend that is not saved'
      }, { status: 404 });
    }
    
    const wasDeleted = await unsaveTrend(userId, trendId);
    
    if (!wasDeleted) {
      return NextResponse.json({
        success: false,
        error: 'Failed to unsave trend',
        message: 'Trend could not be unsaved'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Trend unsaved successfully',
      data: {
        trendId,
        unsaved: true
      }
    });
    
  } catch (error) {
    console.error('Error in DELETE /api/saved/[id]:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to unsave trend',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
