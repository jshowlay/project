import { NextRequest, NextResponse } from 'next/server';
import { getLiveTrends, getAvailableSources, getTrendsCount } from '../../../lib/db';
import { generateMockTrendsWithFilters, getMockAvailableSources, getMockTrendsCount } from '../../../lib/mock';
import { LiveTrendsResponse } from '../../../types/trend';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    
    // Parse query parameters
    const query = searchParams.get('q') || '';
    const sources = searchParams.get('sources')?.split(',').filter(Boolean) || [];
    const region = searchParams.get('region') || '';
    const sinceMins = parseInt(searchParams.get('sinceMins') || '60', 10);
    const minScore = parseInt(searchParams.get('minScore') || '0', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const useMock = searchParams.get('mock') === 'true';

    const filters = {
      query,
      sources,
      region,
      sinceMins,
      minScore,
      limit
    };

    let trends;
    let availableSources;
    let totalCount;

    if (useMock) {
      // Use mock data
      trends = generateMockTrendsWithFilters(filters);
      availableSources = getMockAvailableSources();
      totalCount = getMockTrendsCount();
    } else {
      try {
        // Try to get real data from database
        trends = await getLiveTrends(filters);
        availableSources = await getAvailableSources();
        totalCount = await getTrendsCount();
      } catch (error) {
        console.error('Database query failed, falling back to mock data:', error);
        // Fallback to mock data
        trends = generateMockTrendsWithFilters(filters);
        availableSources = getMockAvailableSources();
        totalCount = getMockTrendsCount();
      }
    }

    const response: LiveTrendsResponse = {
      trends,
      total: totalCount,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in trends API:', error);
    
    // Final fallback to mock data
    const mockTrends = generateMockTrendsWithFilters({
      query: '',
      sources: [],
      region: '',
      sinceMins: 60,
      minScore: 0,
      limit: 20
    });

    const response: LiveTrendsResponse = {
      trends: mockTrends,
      total: getMockTrendsCount(),
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 200 });
  }
}
