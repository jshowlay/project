import { NextRequest, NextResponse } from 'next/server';
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

    console.log('🚀 Starting master data collection...');
    const startTime = Date.now();

    const results = {
      youtube: { success: false, count: 0, error: null },
      reddit: { success: false, count: 0, error: null },
      nyt: { success: false, count: 0, error: null },
      googleTrends: { success: false, count: 0, error: null },
      twitter: { success: false, count: 0, error: null },
      tiktok: { success: false, count: 0, error: null },
    };

    // Collect data from all sources in parallel
    const promises = [
      collectYouTubeData(results),
      collectRedditData(results),
      collectNYTData(results),
      collectGoogleTrendsData(results),
      collectTwitterData(results),
      collectTikTokData(results),
    ];

    await Promise.allSettled(promises);

    // Clean old trends (older than 30 days)
    const cleanedCount = await db.cleanOldTrends(30);
    console.log(`🧹 Cleaned ${cleanedCount} old trends`);

    const endTime = Date.now();
    const duration = endTime - startTime;

    const totalCount = Object.values(results).reduce((sum, result) => sum + result.count, 0);
    const successCount = Object.values(results).filter(result => result.success).length;

    console.log(`✅ Master data collection completed in ${duration}ms`);
    console.log(`📊 Total trends collected: ${totalCount}`);
    console.log(`✅ Successful sources: ${successCount}/6`);

    return NextResponse.json({
      success: true,
      message: 'Master data collection completed',
      duration: `${duration}ms`,
      totalCount,
      successCount,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Master data collection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get overall statistics
    const stats = await db.getTrendStats();
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to get overall stats:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Helper functions for individual data collection
async function collectYouTubeData(results: any) {
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/cron/youtube`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    results.youtube = {
      success: data.success,
      count: data.count || 0,
      error: data.error || null,
    };
  } catch (error) {
    results.youtube = {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function collectRedditData(results: any) {
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/cron/reddit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    results.reddit = {
      success: data.success,
      count: data.count || 0,
      error: data.error || null,
    };
  } catch (error) {
    results.reddit = {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function collectNYTData(results: any) {
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/cron/nyt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    results.nyt = {
      success: data.success,
      count: data.count || 0,
      error: data.error || null,
    };
  } catch (error) {
    results.nyt = {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function collectGoogleTrendsData(results: any) {
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/cron/google-trends`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    results.googleTrends = {
      success: data.success,
      count: data.count || 0,
      error: data.error || null,
    };
  } catch (error) {
    results.googleTrends = {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function collectTwitterData(results: any) {
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/cron/twitter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    results.twitter = {
      success: data.success,
      count: data.count || 0,
      error: data.error || null,
    };
  } catch (error) {
    results.twitter = {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function collectTikTokData(results: any) {
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/cron/tiktok`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    results.tiktok = {
      success: data.success,
      count: data.count || 0,
      error: data.error || null,
    };
  } catch (error) {
    results.tiktok = {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
