import { NextRequest, NextResponse } from 'next/server';
import { nytSource } from '../../../../lib/sources/nyt';
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

    console.log('🔄 Starting NYT data collection...');

    // Get articles from all configured sections
    const articles = await nytSource.getAllTopStories();
    
    if (articles.length === 0) {
      console.log('⚠️  No NYT articles found');
      return NextResponse.json({
        success: true,
        message: 'No NYT articles found',
        count: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📰 Found ${articles.length} NYT articles`);

    // Insert articles into database
    const insertedArticles = await db.upsertTrends(articles);

    console.log(`✅ Successfully inserted ${insertedArticles.length} NYT articles`);

    return NextResponse.json({
      success: true,
      message: 'NYT data collection completed',
      count: insertedArticles.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ NYT data collection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get NYT trends from database
    const trends = await db.getTrends({ source: 'nyt' });
    
    return NextResponse.json({
      success: true,
      trends,
      count: trends.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to get NYT trends:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
