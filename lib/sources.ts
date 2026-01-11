import { logger, logUtils } from './logger';

// Types for normalized data
export interface TrendItem {
  source: string;
  external_id: string;
  title: string;
  topic?: string;
  url?: string;
  score: number;
  upvotes?: number;
  downvotes?: number;
  comments?: number;
  views?: number;
  // Enhanced image support
  image_url?: string;
  image_urls?: {
    high?: string;
    medium?: string;
    low?: string;
    fallback?: {
      maxres?: string;
      high?: string;
      medium?: string;
      default?: string;
    };
  };
  metadata?: {
    channel?: string;
    publishedAt?: string;
    duration?: string;
    tags?: string[];
    defaultAudioLanguage?: string;
    thumbnails?: any;
    [key: string]: any;
  };
}

// Base class for data sources
abstract class DataSource {
  protected name: string;
  protected rateLimitMs: number;

  constructor(name: string, rateLimitMs: number = 1000) {
    this.name = name;
    this.rateLimitMs = rateLimitMs;
  }

  protected async delay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.rateLimitMs));
  }

  protected logApiCall(endpoint: string, duration: number, success: boolean, error?: string) {
    logUtils.externalApi(this.name, endpoint, duration, success, error);
  }

  abstract fetchData(): Promise<TrendItem[]>;
}

// Reddit data source (no API key required)
export class RedditSource extends DataSource {
  private subreddits: string[];
  private limit: number;

  constructor() {
    super('reddit', parseInt(process.env.REDDIT_RATE_LIMIT_MS || '1000'));
    this.subreddits = (process.env.REDDIT_SUBREDDITS || 'all,popular,trending').split(',');
    this.limit = parseInt(process.env.REDDIT_LIMIT || '25');
  }

  async fetchData(): Promise<TrendItem[]> {
    const items: TrendItem[] = [];
    
    for (const subreddit of this.subreddits) {
      try {
        await this.delay();
        const subredditItems = await this.fetchSubreddit(subreddit);
        items.push(...subredditItems);
      } catch (error) {
        logger.error(`Failed to fetch from r/${subreddit}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return items;
  }

  private async fetchSubreddit(subreddit: string): Promise<TrendItem[]> {
    const startTime = Date.now();
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${this.limit}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TrenderAI/1.0 (Data Collection Bot)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      this.logApiCall(`/r/${subreddit}/hot.json`, duration, true);

      return data.data.children.map((child: any) => {
        const post = child.data;
        return {
          source: 'reddit',
          external_id: post.id,
          title: post.title,
          topic: subreddit,
          url: `https://reddit.com${post.permalink}`,
          score: post.score,
          upvotes: post.ups,
          downvotes: post.downs,
          comments: post.num_comments,
          views: post.view_count || 0,
        };
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logApiCall(`/r/${subreddit}/hot.json`, duration, false, errorMessage);
      throw error;
    }
  }
}

// NYTimes data source (requires API key)
export class NYTimesSource extends DataSource {
  private apiKey: string;
  private section: string;

  constructor() {
    super('nytimes', parseInt(process.env.NYTIMES_RATE_LIMIT_MS || '1000'));
    this.apiKey = process.env.NYTIMES_API_KEY || '';
    this.section = process.env.NYTIMES_SECTION || 'mostpopular';
    
    if (!this.apiKey) {
      throw new Error('NYTimes API key is required');
    }
  }

  async fetchData(): Promise<TrendItem[]> {
    const startTime = Date.now();
    const url = `https://api.nytimes.com/svc/mostpopular/v2/viewed/1.json?api-key=${this.apiKey}`;
    
    try {
      await this.delay();
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      this.logApiCall('/mostpopular/v2/viewed/1.json', duration, true);

      return data.results.map((article: any) => ({
        source: 'nytimes',
        external_id: article.id.toString(),
        title: article.title,
        topic: article.section,
        url: article.url,
        score: article.views || 0,
        upvotes: article.views || 0,
        downvotes: 0,
        comments: 0,
        views: article.views || 0,
      }));
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logApiCall('/mostpopular/v2/viewed/1.json', duration, false, errorMessage);
      throw error;
    }
  }
}

// YouTube data source (requires API key)
export class YouTubeSource extends DataSource {
  private apiKey: string;
  private regionCode: string;
  private videoCategoryId: string;

  constructor() {
    super('youtube', parseInt(process.env.YOUTUBE_RATE_LIMIT_MS || '1000'));
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    this.regionCode = process.env.YOUTUBE_REGION_CODE || 'US';
    this.videoCategoryId = process.env.YOUTUBE_VIDEO_CATEGORY_ID || '0';
    
    if (!this.apiKey) {
      throw new Error('YouTube API key is required');
    }
  }

  async fetchData(): Promise<TrendItem[]> {
    const startTime = Date.now();
    // Request additional parts to get more detailed thumbnail information
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${this.regionCode}&videoCategoryId=${this.videoCategoryId}&maxResults=25&key=${this.apiKey}`;
    
    try {
      await this.delay();
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      this.logApiCall('/youtube/v3/videos', duration, true);

      return data.items.map((video: any) => {
        const videoId = video.id;
        const thumbnails = video.snippet.thumbnails;
        const bestThumbnailUrl = this.getBestThumbnailUrl(thumbnails, videoId);
        const allThumbnailUrls = this.getAllThumbnailUrls(thumbnails, videoId);
        
        return {
          source: 'youtube',
          external_id: videoId,
          title: video.snippet.title,
          topic: video.snippet.categoryId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          score: parseInt(video.statistics.viewCount || '0'),
          upvotes: parseInt(video.statistics.likeCount || '0'),
          downvotes: 0,
          comments: parseInt(video.statistics.commentCount || '0'),
          views: parseInt(video.statistics.viewCount || '0'),
          // Enhanced image data
          image_url: bestThumbnailUrl,
          image_urls: allThumbnailUrls,
          metadata: {
            channel: video.snippet.channelTitle,
            publishedAt: video.snippet.publishedAt,
            duration: video.contentDetails?.duration,
            tags: video.snippet.tags || [],
            defaultAudioLanguage: video.snippet.defaultAudioLanguage,
            thumbnails: thumbnails
          }
        };
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logApiCall('/youtube/v3/videos', duration, false, errorMessage);
      throw error;
    }
  }

  /**
   * Get the best available thumbnail URL from YouTube thumbnails
   * Prioritizes maxres > standard > high > medium > default
   */
  private getBestThumbnailUrl(thumbnails: any, videoId: string): string {
    const qualityOrder = ['maxres', 'standard', 'high', 'medium', 'default'];
    
    for (const quality of qualityOrder) {
      if (thumbnails[quality]?.url) {
        return thumbnails[quality].url;
      }
    }
    
    // Fallback to a default YouTube thumbnail pattern
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  /**
   * Get multiple thumbnail URLs for different use cases
   */
  private getAllThumbnailUrls(thumbnails: any, videoId: string) {
    return {
      high: thumbnails.maxres?.url || thumbnails.standard?.url || thumbnails.high?.url,
      medium: thumbnails.medium?.url || thumbnails.high?.url,
      low: thumbnails.default?.url,
      // Fallback URLs using YouTube's standard patterns
      fallback: {
        maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        default: `https://img.youtube.com/vi/${videoId}/default.jpg`
      }
    };
  }
}

// Factory function to create enabled data sources
export function createDataSources(): DataSource[] {
  const sources: DataSource[] = [];

  // Reddit is always enabled (no API key required)
  if (process.env.ENABLE_REDDIT !== 'false') {
    try {
      sources.push(new RedditSource());
      logger.info('Reddit source enabled');
    } catch (error) {
      logger.error(`Failed to initialize Reddit source: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // NYTimes (requires API key)
  if (process.env.ENABLE_NYTIMES === 'true' && process.env.NYTIMES_API_KEY) {
    try {
      sources.push(new NYTimesSource());
      logger.info('NYTimes source enabled');
    } catch (error) {
      logger.error(`Failed to initialize NYTimes source: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // YouTube (requires API key)
  if (process.env.ENABLE_YOUTUBE === 'true' && process.env.YOUTUBE_API_KEY) {
    try {
      sources.push(new YouTubeSource());
      logger.info('YouTube source enabled');
    } catch (error) {
      logger.error(`Failed to initialize YouTube source: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  logger.info(`Initialized ${sources.length} data sources`);
  return sources;
}

// Export types - TrendItem is already exported as interface above
