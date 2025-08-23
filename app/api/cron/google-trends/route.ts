import { NextRequest, NextResponse } from 'next/server';
import { googleTrendsSource } from '../../../../lib/sources/google-trends';
import { db } from '../../../../lib/database';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.VERCEL_CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting Google Trends data collection...');

    // Get trending searches from all configured regions
    const trends = await googleTrendsSource.getAllTrendingSearches();
    
    if (trends.length === 0) {
      console.log('⚠️  No Google Trends found');
      return NextResponse.json({
        success: true,
        message: 'No Google Trends found',
        count: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📊 Found ${trends.length} Google Trends`);

    // Insert trends into database
    const insertedTrends = await db.upsertTrends(trends);

    console.log(`✅ Successfully inserted ${insertedTrends.length} Google Trends`);

    return NextResponse.json({
      success: true,
      message: 'Google Trends data collection completed',
      count: insertedTrends.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Google Trends data collection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get Google Trends from database
    const trends = await db.getTrends({ source: 'google_trends' });
    
    return NextResponse.json({
      success: true,
      trends,
      count: trends.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to get Google Trends:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}


