import { NextRequest, NextResponse } from 'next/server';
import { fetchMockGoogleTrends, getTrendingTopics, getRelatedQueries } from '../../../scripts/test-google-trends';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const geo = searchParams.get('geo') || 'US';
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'trending'; // 'trending', 'query', 'related'

    console.log(`Google Trends API: type=${type}, query="${query}", geo=${geo}, limit=${limit}`);

    let trends;

    switch (type) {
      case 'query':
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Query parameter "q" is required for type "query"'
          }, { status: 400 });
        }
        trends = await fetchMockGoogleTrends(query, geo);
        break;

      case 'related':
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Query parameter "q" is required for type "related"'
          }, { status: 400 });
        }
        trends = await getRelatedQueries(query, geo);
        break;

      case 'trending':
      default:
        trends = await getTrendingTopics(geo, limit);
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      query: query || null,
      geo,
      limit,
      trends,
      count: trends.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Google Trends API error:', error);
    
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
    const { queries, geo = 'US', type = 'query' } = body;

    if (!queries || !Array.isArray(queries)) {
      return NextResponse.json({
        success: false,
        error: 'Queries array is required'
      }, { status: 400 });
    }

    console.log(`Google Trends API (POST): processing ${queries.length} queries for ${geo}`);

    const results = [];

    for (const query of queries) {
      try {
        let trends;
        
        if (type === 'related') {
          trends = await getRelatedQueries(query, geo);
        } else {
          trends = await fetchMockGoogleTrends(query, geo);
        }

        results.push({
          query,
          success: true,
          trends,
          count: trends.length
        });

        // Rate limiting - small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        results.push({
          query,
          success: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      type,
      geo,
      results,
      totalQueries: queries.length,
      successfulQueries: results.filter(r => r.success).length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Google Trends API (POST) error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

