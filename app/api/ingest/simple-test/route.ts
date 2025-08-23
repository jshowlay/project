import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const searchTerms = (process.env.YOUTUBE_SEARCH_TERMS || 'ai,technology,startups')
      .split(',')
      .map(term => term.trim())
      .filter(term => term.length > 0);

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'YouTube API key not configured',
      });
    }

    const results: any[] = [];
    const errors: string[] = [];

    // Test YouTube API directly
    for (const searchTerm of searchTerms.slice(0, 2)) { // Limit to 2 terms for testing
      try {
        const url = new URL('https://www.googleapis.com/youtube/v3/search');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('q', searchTerm);
        url.searchParams.set('type', 'video');
        url.searchParams.set('order', 'relevance');
        url.searchParams.set('maxResults', '5');
        url.searchParams.set('key', apiKey);

        const response = await fetch(url.toString());
        
        if (!response.ok) {
          errors.push(`YouTube API error for "${searchTerm}": ${response.status} ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const videos = data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            searchTerm,
          }));
          
          results.push(...videos);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error fetching "${searchTerm}": ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      videosFound: results.length,
      errors: errors.length > 0 ? errors : undefined,
      videos: results.slice(0, 10), // Return first 10 videos
      config: {
        apiKeyConfigured: !!apiKey,
        searchTerms,
        searchTermsCount: searchTerms.length,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
