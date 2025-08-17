import { z } from 'zod';
import { TrendData } from '../database';

// Google Trends API response schemas
const GoogleTrendsItemSchema = z.object({
  title: z.object({
    query: z.string(),
    exploreLink: z.string().optional(),
  }),
  articles: z.array(z.object({
    title: z.string(),
    timeAgo: z.string(),
    source: z.string(),
    image: z.object({
      newsUrl: z.string().optional(),
      source: z.string().optional(),
    }).optional(),
    url: z.string(),
    snippet: z.string(),
  })).optional(),
  traffic: z.string().optional(),
  picture: z.string().optional(),
  shareUrl: z.string().optional(),
});

const GoogleTrendsResponseSchema = z.object({
  default: z.object({
    trendingSearchesDays: z.array(z.object({
      trendingSearches: z.array(GoogleTrendsItemSchema),
    })),
  }),
});

export type GoogleTrendsItem = z.infer<typeof GoogleTrendsItemSchema>;

export class GoogleTrendsSource {
  private regions: string[];
  private categories: string[];

  constructor() {
    this.regions = (process.env.GOOGLE_TRENDS_REGIONS || 'US').split(',');
    this.categories = (process.env.GOOGLE_TRENDS_CATEGORIES || 'all').split(',');
  }

  // Get trending searches for a specific region
  async getTrendingSearches(region: string = 'US'): Promise<TrendData[]> {
    try {
      const url = new URL('https://trends.google.com/trends/api/dailytrends');
      url.searchParams.set('hl', 'en-US');
      url.searchParams.set('tz', '-120');
      url.searchParams.set('geo', region);
      url.searchParams.set('ns', '15');

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrenderAI/1.0 (Trend Aggregation Bot)',
        },
      });

      if (!response.ok) {
        throw new Error(`Google Trends API error: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      // Google Trends API returns JSON with a prefix, we need to remove it
      const jsonText = text.replace(/^\)\]\}'/, '');
      const data = JSON.parse(jsonText);
      
      const validatedData = GoogleTrendsResponseSchema.parse(data);

      const trends: TrendData[] = [];
      
      for (const day of validatedData.default.trendingSearchesDays) {
        for (const item of day.trendingSearches) {
          if (item.articles && item.articles.length > 0) {
            // Create trend data from the first article
            const article = item.articles[0];
            trends.push(this.transformTrendItem(item, article, region));
          }
        }
      }

      return trends;
    } catch (error) {
      console.error(`Error fetching Google Trends for region ${region}:`, error);
      return [];
    }
  }

  // Get trending searches from all configured regions
  async getAllTrendingSearches(): Promise<TrendData[]> {
    const allTrends: TrendData[] = [];
    
    for (const region of this.regions) {
      try {
        console.log(`Fetching Google Trends for region: ${region}`);
        const trends = await this.getTrendingSearches(region);
        allTrends.push(...trends);
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to fetch trends for region ${region}:`, error);
      }
    }

    return allTrends;
  }

  // Get real-time trending searches
  async getRealTimeTrends(region: string = 'US'): Promise<TrendData[]> {
    try {
      const url = new URL('https://trends.google.com/trends/api/realtimetrends');
      url.searchParams.set('hl', 'en-US');
      url.searchParams.set('tz', '-120');
      url.searchParams.set('geo', region);
      url.searchParams.set('cat', 'all');
      url.searchParams.set('fi', '0');
      url.searchParams.set('fs', '0');
      url.searchParams.set('ri', '300');
      url.searchParams.set('rs', '20');
      url.searchParams.set('sort', '0');

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrenderAI/1.0 (Trend Aggregation Bot)',
        },
      });

      if (!response.ok) {
        throw new Error(`Google Trends API error: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const jsonText = text.replace(/^\)\]\}'/, '');
      const data = JSON.parse(jsonText);

      // Transform real-time trends data
      const trends: TrendData[] = [];
      if (data.trendingSearchesDays && data.trendingSearchesDays.length > 0) {
        for (const day of data.trendingSearchesDays) {
          if (day.trendingSearches) {
            for (const item of day.trendingSearches) {
              if (item.articles && item.articles.length > 0) {
                const article = item.articles[0];
                trends.push(this.transformTrendItem(item, article, region));
              }
            }
          }
        }
      }

      return trends;
    } catch (error) {
      console.error(`Error fetching Google real-time trends for region ${region}:`, error);
      return [];
    }
  }

  // Get trending searches by category
  async getTrendsByCategory(category: string, region: string = 'US'): Promise<TrendData[]> {
    try {
      const url = new URL('https://trends.google.com/trends/api/dailytrends');
      url.searchParams.set('hl', 'en-US');
      url.searchParams.set('tz', '-120');
      url.searchParams.set('geo', region);
      url.searchParams.set('cat', category);
      url.searchParams.set('ns', '15');

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrenderAI/1.0 (Trend Aggregation Bot)',
        },
      });

      if (!response.ok) {
        throw new Error(`Google Trends API error: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const jsonText = text.replace(/^\)\]\}'/, '');
      const data = JSON.parse(jsonText);
      
      const validatedData = GoogleTrendsResponseSchema.parse(data);

      const trends: TrendData[] = [];
      
      for (const day of validatedData.default.trendingSearchesDays) {
        for (const item of day.trendingSearches) {
          if (item.articles && item.articles.length > 0) {
            const article = item.articles[0];
            trends.push(this.transformTrendItem(item, article, region, category));
          }
        }
      }

      return trends;
    } catch (error) {
      console.error(`Error fetching Google Trends for category ${category} in region ${region}:`, error);
      return [];
    }
  }

  // Transform Google Trends item to TrendData format
  private transformTrendItem(
    item: GoogleTrendsItem, 
    article: any, 
    region: string, 
    category: string = 'all'
  ): TrendData {
    const publishedAt = new Date();
    const traffic = item.traffic || '0';
    const trafficNumber = parseInt(traffic.replace(/[^\d]/g, '')) || 0;
    
    // Calculate score based on traffic and recency
    const baseScore = Math.min(100, trafficNumber * 10);
    const score = Math.max(baseScore, 1);

    return {
      source: 'google_trends',
      title: item.title.query,
      description: article.snippet || `Trending search: ${item.title.query}`,
      url: article.url,
      published_at: publishedAt,
      region: region.toLowerCase(),
      category: this.getCategoryFromGoogleCategory(category),
      score: score,
      created_at: publishedAt,
      updated_at: new Date(),
      metadata: {
        query: item.title.query,
        traffic: item.traffic,
        trafficNumber,
        articleTitle: article.title,
        articleSource: article.source,
        articleTimeAgo: article.timeAgo,
        exploreLink: item.title.exploreLink,
        shareUrl: item.shareUrl,
        picture: item.picture,
        googleCategory: category,
      },
    };
  }

  // Get category from Google Trends category
  private getCategoryFromGoogleCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'all': 'trending',
      'news': 'news',
      'entertainment': 'entertainment',
      'technology': 'technology',
      'sports': 'sports',
      'business': 'business',
      'health': 'health',
      'science': 'science',
      'politics': 'politics',
      'education': 'education',
      'gaming': 'gaming',
      'fashion': 'lifestyle',
      'food': 'lifestyle',
      'travel': 'lifestyle',
    };
    return categoryMap[category] || 'trending';
  }

  // Get trending searches by multiple categories
  async getTrendsByMultipleCategories(): Promise<TrendData[]> {
    const allTrends: TrendData[] = [];
    
    for (const region of this.regions.slice(0, 3)) { // Limit to top 3 regions
      for (const category of this.categories) {
        try {
          console.log(`Fetching Google Trends for region: ${region}, category: ${category}`);
          const trends = await this.getTrendsByCategory(category, region);
          allTrends.push(...trends);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Failed to fetch trends for region ${region}, category ${category}:`, error);
        }
      }
    }

    return allTrends;
  }

  // Get trending searches with high traffic
  async getHighTrafficTrends(region: string = 'US', minTraffic: number = 1000): Promise<TrendData[]> {
    const allTrends = await this.getTrendingSearches(region);
    
    return allTrends.filter(trend => {
      const trafficNumber = trend.metadata?.trafficNumber || 0;
      return trafficNumber >= minTraffic;
    });
  }

  // Get trending searches by time period
  async getTrendsByTimePeriod(region: string = 'US', days: number = 1): Promise<TrendData[]> {
    // This would require multiple API calls for different time periods
    // For now, we'll return the daily trends
    return this.getTrendingSearches(region);
  }
}

export const googleTrendsSource = new GoogleTrendsSource();
