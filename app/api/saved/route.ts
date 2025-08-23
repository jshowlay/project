import { NextRequest, NextResponse } from 'next/server';
import { savedTrendsDB } from '../../../lib/saved-trends';
import { getUserId } from '../../../lib/auth';
import { z } from 'zod';

// Validation schema for saving a trend
const SaveTrendSchema = z.object({
  trend_id: z.string().min(1),
  trend_source: z.string().min(1),
  trend_topic: z.string().min(1),
  trend_title: z.string().optional(),
  trend_url: z.string().url().optional(),
  trend_image_url: z.string().url().optional(),
  trend_score: z.number().default(0),
  trend_velocity: z.number().default(0),
  trend_acceleration: z.number().default(0),
  trend_region: z.string().default('US'),
  trend_tags: z.array(z.string()).default([]),
  trend_observed_at: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get user ID
    const userId = await getUserId(request);
    
    // Parse request body
    const body = await request.json();
    const validatedData = SaveTrendSchema.parse(body);
    
    // Prepare data for database
    const saveData = {
      user_id: userId,
      trend_id: validatedData.trend_id,
      trend_source: validatedData.trend_source,
      trend_topic: validatedData.trend_topic,
      trend_title: validatedData.trend_title,
      trend_url: validatedData.trend_url,
      trend_image_url: validatedData.trend_image_url,
      trend_score: validatedData.trend_score,
      trend_velocity: validatedData.trend_velocity,
      trend_acceleration: validatedData.trend_acceleration,
      trend_region: validatedData.trend_region,
      trend_tags: validatedData.trend_tags,
      trend_observed_at: validatedData.trend_observed_at 
        ? new Date(validatedData.trend_observed_at) 
        : new Date(),
    };

    // Save the trend
    const savedTrend = await savedTrendsDB.saveTrend(saveData);

    return NextResponse.json({
      success: true,
      data: savedTrend,
      message: 'Trend saved successfully'
    });

  } catch (error) {
    console.error('Error saving trend:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

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

export async function GET(request: NextRequest) {
  try {
    // Get user ID
    const userId = await getUserId(request);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({
        success: false,
        error: 'Invalid pagination parameters'
      }, { status: 400 });
    }

    // Get saved trends with details
    const result = await savedTrendsDB.getSavedTrendsWithDetails(userId, page, limit);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error getting saved trends:', error);
    
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
