import { NextRequest, NextResponse } from 'next/server';
import { redditSource } from '../../../../lib/sources/reddit';
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

    console.log('🔄 Starting Reddit data collection...');

    // Get posts from all configured RSS feeds
    const posts = await redditSource.getAllFeedPosts();
    
    if (posts.length === 0) {
      console.log('⚠️  No Reddit posts found');
      return NextResponse.json({
        success: true,
        message: 'No Reddit posts found',
        count: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📱 Found ${posts.length} Reddit posts`);

    // Insert posts into database
    const insertedPosts = await db.upsertTrends(posts);

    console.log(`✅ Successfully inserted ${insertedPosts.length} Reddit posts`);

    return NextResponse.json({
      success: true,
      message: 'Reddit data collection completed',
      count: insertedPosts.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Reddit data collection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get Reddit trends from database
    const trends = await db.getTrends({ source: 'reddit' });
    
    return NextResponse.json({
      success: true,
      trends,
      count: trends.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to get Reddit trends:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
