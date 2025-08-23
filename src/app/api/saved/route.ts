import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserIdFromRequest, setUserIdCookie } from '@/lib/user';
import { 
  getSavedTrends, 
  saveTrend, 
  initializeDatabase,
  type SaveTrendRequest as DBSaveTrendRequest 
} from '@/lib/db';
import { SavedTrendsResponse, SaveTrendResponse, SaveTrendRequest } from '@/types/trends';

// Validation schemas
const SaveTrendSchema = z.object({
  trend_id: z.string().min(1, 'Trend ID is required'),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  score: z.number().min(0).max(100, 'Score must be between 0 and 100'),
  spark_data: z.array(z.number()).min(1, 'Spark data is required')
});

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

// GET /api/saved - List all saved trends for current user
export async function GET(request: NextRequest): Promise<NextResponse<SavedTrendsResponse>> {
  try {
    await ensureDatabaseInitialized();
    
    const userId = getUserIdFromRequest(request);
    
    // Set cookie if user doesn't have one
    if (!request.headers.get('cookie')?.includes('trenderai_user_id')) {
      const response = NextResponse.json({
        success: true,
        data: {
          trends: [],
          total: 0,
          userId
        }
      });
      
      response.cookies.set('trenderai_user_id', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60, // 1 year
        path: '/'
      });
      
      return response;
    }
    
    const savedTrends = await getSavedTrends(userId);
    
    const trendsWithMetadata = savedTrends.map(trend => ({
      ...trend,
      isSaved: true,
      savedAtFormatted: new Date(trend.saved_at).toLocaleDateString()
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        trends: trendsWithMetadata,
        total: trendsWithMetadata.length,
        userId
      }
    });
    
  } catch (error) {
    console.error('Error in GET /api/saved:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch saved trends',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/saved - Save a trend for current user
export async function POST(request: NextRequest): Promise<NextResponse<SaveTrendResponse>> {
  try {
    await ensureDatabaseInitialized();
    
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    
    // Validate request body
    const validatedData = SaveTrendSchema.parse(body);
    
    // Convert to database format
    const dbRequest: DBSaveTrendRequest = {
      trend_id: validatedData.trend_id,
      title: validatedData.title,
      score: validatedData.score,
      spark_data: validatedData.spark_data
    };
    
    // Save trend to database
    const savedTrend = await saveTrend(userId, dbRequest);
    
    // Set cookie if user doesn't have one
    const response = NextResponse.json({
      success: true,
      data: {
        trend: {
          ...savedTrend,
          isSaved: true,
          savedAtFormatted: new Date(savedTrend.saved_at).toLocaleDateString()
        },
        isSaved: true
      }
    });
    
    if (!request.headers.get('cookie')?.includes('trenderai_user_id')) {
      response.cookies.set('trenderai_user_id', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60, // 1 year
        path: '/'
      });
    }
    
    return response;
    
  } catch (error) {
    console.error('Error in POST /api/saved:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to save trend',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
