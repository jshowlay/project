import { z } from 'zod';
import { TrendData } from '../database';

// YouTube API response schemas
const YouTubeVideoSchema = z.object({
  id: z.string(),
  snippet: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.string(),
    thumbnails: z.record(z.any()).optional(),
    channelTitle: z.string(),
    categoryId: z.string(),
  }),
  statistics: z.object({
    viewCount: z.string().optional(),
    likeCount: z.string().optional(),
    commentCount: z.string().optional(),
  }).optional(),
});

const YouTubeResponseSchema = z.object({
  items: z.array(YouTubeVideoSchema),
  nextPageToken: z.string().optional(),
});

export type YouTubeVideo = z.infer<typeof YouTubeVideoSchema>;

export class YouTubeSource {
  private apiKey: string;
  private regions: string[];

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    this.regions = (process.env.YOUTUBE_REGIONS || 'US').split(',');
    
    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is required');
    }
  }

  // Get most popular videos by region
  async getPopularVideos(region: string = 'US', maxResults: number = 50): Promise<TrendData[]> {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.searchParams.set('part', 'snippet,statistics');
      url.searchParams.set('chart', 'mostPopular');
      url.searchParams.set('regionCode', region);
      url.searchParams.set('maxResults', maxResults.toString());
      url.searchParams.set('key', this.apiKey);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validatedData = YouTubeResponseSchema.parse(data);

      return validatedData.items.map(video => this.transformVideo(video, region));
    } catch (error) {
      console.error(`Error fetching YouTube popular videos for region ${region}:`, error);
      return [];
    }
  }

  // Get trending videos by category
  async getTrendingVideos(region: string = 'US', categoryId: string = '0', maxResults: number = 50): Promise<TrendData[]> {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.searchParams.set('part', 'snippet,statistics');
      url.searchParams.set('chart', 'mostPopular');
      url.searchParams.set('regionCode', region);
      url.searchParams.set('videoCategoryId', categoryId);
      url.searchParams.set('maxResults', maxResults.toString());
      url.searchParams.set('key', this.apiKey);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validatedData = YouTubeResponseSchema.parse(data);

      return validatedData.items.map(video => this.transformVideo(video, region));
    } catch (error) {
      console.error(`Error fetching YouTube trending videos for region ${region}, category ${categoryId}:`, error);
      return [];
    }
  }

  // Get videos by search query
  async searchVideos(query: string, region: string = 'US', maxResults: number = 50): Promise<TrendData[]> {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('q', query);
      url.searchParams.set('type', 'video');
      url.searchParams.set('order', 'relevance');
      url.searchParams.set('regionCode', region);
      url.searchParams.set('maxResults', maxResults.toString());
      url.searchParams.set('key', this.apiKey);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validatedData = YouTubeResponseSchema.parse(data);

      return validatedData.items.map(video => this.transformVideo(video, region));
    } catch (error) {
      console.error(`Error searching YouTube videos for query "${query}" in region ${region}:`, error);
      return [];
    }
  }

  // Transform YouTube video to TrendData format
  private transformVideo(video: YouTubeVideo, region: string): TrendData {
    const viewCount = video.statistics?.viewCount ? parseInt(video.statistics.viewCount) : 0;
    const likeCount = video.statistics?.likeCount ? parseInt(video.statistics.likeCount) : 0;
    const commentCount = video.statistics?.commentCount ? parseInt(video.statistics.commentCount) : 0;

    // Calculate score based on engagement metrics
    const score = Math.floor((viewCount / 1000) + (likeCount * 10) + (commentCount * 50));

    return {
      source: 'youtube',
      title: video.snippet.title,
      description: video.snippet.description,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      published_at: new Date(video.snippet.publishedAt),
      region: region.toLowerCase(),
      category: this.getCategoryName(video.snippet.categoryId),
      score: Math.max(score, 1), // Ensure minimum score of 1
      created_at: new Date(video.snippet.publishedAt),
      updated_at: new Date(),
      metadata: {
        videoId: video.id,
        channelTitle: video.snippet.channelTitle,
        viewCount,
        likeCount,
        commentCount,
        thumbnails: video.snippet.thumbnails,
        categoryId: video.snippet.categoryId,
      },
    };
  }

  // Get category name from category ID
  private getCategoryName(categoryId: string): string {
    const categories: Record<string, string> = {
      '1': 'Film & Animation',
      '2': 'Autos & Vehicles',
      '10': 'Music',
      '15': 'Pets & Animals',
      '17': 'Sports',
      '19': 'Travel & Events',
      '20': 'Gaming',
      '22': 'People & Blogs',
      '23': 'Comedy',
      '24': 'Entertainment',
      '25': 'News & Politics',
      '26': 'Howto & Style',
      '27': 'Education',
      '28': 'Science & Technology',
      '29': 'Nonprofits & Activism',
    };
    return categories[categoryId] || 'Other';
  }

  // Get all popular videos from all configured regions
  async getAllPopularVideos(): Promise<TrendData[]> {
    const allVideos: TrendData[] = [];
    
    for (const region of this.regions) {
      try {
        console.log(`Fetching YouTube popular videos for region: ${region}`);
        const videos = await this.getPopularVideos(region, 25); // Limit per region
        allVideos.push(...videos);
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to fetch videos for region ${region}:`, error);
      }
    }

    return allVideos;
  }

  // Get trending videos by multiple categories
  async getTrendingByCategories(categories: string[] = ['0', '25', '28']): Promise<TrendData[]> {
    const allVideos: TrendData[] = [];
    
    for (const region of this.regions.slice(0, 3)) { // Limit to top 3 regions
      for (const categoryId of categories) {
        try {
          console.log(`Fetching YouTube trending videos for region: ${region}, category: ${categoryId}`);
          const videos = await this.getTrendingVideos(region, categoryId, 10); // Limit per category
          allVideos.push(...videos);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to fetch videos for region ${region}, category ${categoryId}:`, error);
        }
      }
    }

    return allVideos;
  }
}

export const youtubeSource = new YouTubeSource();
