import { NextRequest, NextResponse } from 'next/server';
import { testGoogleTrends, fetchGoogleTrends } from '@/integrations/googleTrends';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'artificial intelligence';
    const geo = searchParams.get('geo') || 'US';
    const provider = searchParams.get('provider') as 'serpapi' | 'google_alpha' | undefined;

    console.log(`Testing Google Trends: query="${query}", geo="${geo}", provider="${provider}"`);

    const trends = await fetchGoogleTrends({ 
      q: query, 
      geo, 
      provider: provider || 'serpapi' 
    });

    return NextResponse.json({
      success: true,
      query,
      geo,
      provider: provider || 'serpapi',
      trends,
      count: trends.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Google Trends test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queries = ['artificial intelligence'], geo = 'US' } = body;

    if (!Array.isArray(queries)) {
      return NextResponse.json({
        success: false,
        error: 'queries must be an array'
      }, { status: 400 });
    }

    console.log(`Bulk testing Google Trends: ${queries.length} queries, geo="${geo}"`);

    const results = [];
    for (const query of queries.slice(0, 5)) { // Limit to 5 queries for testing
      try {
        const trends = await testGoogleTrends(query);
        results.push({ query, trends, success: true });
      } catch (error: any) {
        results.push({ query, error: error.message, success: false });
      }
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Google Trends bulk test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
