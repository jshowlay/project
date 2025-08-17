import { NextRequest, NextResponse } from 'next/server';
import { youtubeSource } from '../../../../lib/sources/youtube';
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

    console.log('🔄 Starting YouTube data collection...');

    // Get popular videos from all configured regions
    const videos = await youtubeSource.getAllPopularVideos();
    
    if (videos.length === 0) {
      console.log('⚠️  No YouTube videos found');
      return NextResponse.json({
        success: true,
        message: 'No YouTube videos found',
        count: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📹 Found ${videos.length} YouTube videos`);

    // Insert videos into database
    const insertedVideos = await db.upsertTrends(videos);

    console.log(`✅ Successfully inserted ${insertedVideos.length} YouTube videos`);

    return NextResponse.json({
      success: true,
      message: 'YouTube data collection completed',
      count: insertedVideos.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ YouTube data collection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get YouTube trends from database
    const trends = await db.getTrends({ source: 'youtube' });
    
    return NextResponse.json({
      success: true,
      trends,
      count: trends.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to get YouTube trends:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
