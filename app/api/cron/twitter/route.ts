import { NextRequest, NextResponse } from 'next/server';
import { twitterSource } from '../../../../lib/sources/twitter';
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

    console.log('🔄 Starting Twitter data collection...');

    // Get trending topics and popular tweets
    const trendingTopics = await twitterSource.getTrendingTopics();
    const popularTweets = await twitterSource.getPopularTweets(500); // Lower threshold for more tweets
    
    const allTweets = [...trendingTopics, ...popularTweets];
    
    if (allTweets.length === 0) {
      console.log('⚠️  No Twitter tweets found');
      return NextResponse.json({
        success: true,
        message: 'No Twitter tweets found',
        count: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🐦 Found ${allTweets.length} Twitter tweets`);

    // Insert tweets into database
    const insertedTweets = await db.upsertTrends(allTweets);

    console.log(`✅ Successfully inserted ${insertedTweets.length} Twitter tweets`);

    return NextResponse.json({
      success: true,
      message: 'Twitter data collection completed',
      count: insertedTweets.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Twitter data collection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get Twitter trends from database
    const trends = await db.getTrends({ source: 'twitter' });
    
    return NextResponse.json({
      success: true,
      trends,
      count: trends.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to get Twitter trends:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
