import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/database';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (optional security check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.VERCEL_CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting database migration...');

    // Initialize database schema
    await db.initialize();

    console.log('✅ Database migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database schema initialized successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Database migration failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get database statistics
    const stats = await db.getTrendStats();
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to get database stats:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
