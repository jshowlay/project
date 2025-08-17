import { NextRequest, NextResponse } from 'next/server';
import { tiktokSource } from '../../../../lib/sources/tiktok';
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

    console.log('🔄 Starting TikTok data collection...');

    // Check if TikTok integration is available
    if (!tiktokSource.isAvailable()) {
      console.log('⚠️  TikTok integration not available');
      return NextResponse.json({
        success: true,
        message: 'TikTok integration not available',
        count: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Get trending videos
    const videos = await tiktokSource.getTrendingVideos();
    
    if (videos.length === 0) {
      console.log('⚠️  No TikTok videos found');
      return NextResponse.json({
        success: true,
        message: 'No TikTok videos found',
        count: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🎵 Found ${videos.length} TikTok videos`);

    // Insert videos into database
    const insertedVideos = await db.upsertTrends(videos);

    console.log(`✅ Successfully inserted ${insertedVideos.length} TikTok videos`);

    return NextResponse.json({
      success: true,
      message: 'TikTok data collection completed',
      count: insertedVideos.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ TikTok data collection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get TikTok trends from database
    const trends = await db.getTrends({ source: 'tiktok' });
    
    return NextResponse.json({
      success: true,
      trends,
      count: trends.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to get TikTok trends:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
