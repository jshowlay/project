import { logger } from '../logger';
import { createApifyClient } from '../apifyClient';
import { 
  TikTokVideo, 
  TikTokPost, 
  TikTokSource, 
  SourceType,
  TikTokConfig,
  IngestResult 
} from './types';

export class TikTokDataFetcher {
  private apifyClient: ReturnType<typeof createApifyClient>;
  private config: TikTokConfig;

  constructor(config: TikTokConfig) {
    this.config = config;
    this.apifyClient = createApifyClient();
  }

  /**
   * Fetch TikTok data for a specific source
   */
  async fetchFromSource(source: TikTokSource): Promise<IngestResult> {
    const startTime = Date.now();
    let postsProcessed = 0;
    let postsSkipped = 0;
    let postsFailed = 0;
    let error: string | undefined;

    try {
      logger.info({
        msg: 'Starting TikTok data fetch',
        sourceType: source.type,
        sourceValue: source.value,
        maxPosts: source.maxPosts,
      });

      // Build Apify input based on source type
      const input = this.buildApifyInput(source);
      
      // Start the actor run
      const run = await this.apifyClient.startActorRun(
        this.config.apifyActorId,
        input
      );

      logger.info({
        msg: 'Apify actor run started',
        runId: run.id,
        sourceType: source.type,
        sourceValue: source.value,
      });

      // Wait for completion
      const completedRun = await this.apifyClient.waitForRunCompletion(run.id);
      
      if (completedRun.status !== 'SUCCEEDED') {
        throw new Error(`Actor run failed with status: ${completedRun.status}`);
      }

      // Get the dataset ID from the run
      const datasetId = await this.getDatasetIdFromRun(completedRun.id);
      
      if (!datasetId) {
        throw new Error('No dataset found for completed run');
      }

      // Fetch the data
      const videos = await this.apifyClient.getDatasetItems(datasetId, {
        limit: source.maxPosts,
        clean: true,
      });

      logger.info({
        msg: 'TikTok videos fetched from Apify',
        count: videos.length,
        sourceType: source.type,
        sourceValue: source.value,
      });

      // Process and normalize the data
      const posts = await this.processVideos(videos, source);
      
      postsProcessed = posts.length;
      postsSkipped = videos.length - posts.length;

      logger.info({
        msg: 'TikTok data processing completed',
        videosReceived: videos.length,
        postsProcessed,
        postsSkipped,
        sourceType: source.type,
        sourceValue: source.value,
      });

    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      postsFailed = 1; // Count as one failed operation
      
      logger.error({
        msg: 'TikTok data fetch failed',
        sourceType: source.type,
        sourceValue: source.value,
        error,
      });
    }

    const duration = Date.now() - startTime;

    return {
      success: !error,
      postsProcessed,
      postsSkipped,
      postsFailed,
      error,
      duration,
    };
  }

  /**
   * Build Apify input configuration based on source type
   */
  private buildApifyInput(source: TikTokSource): Record<string, any> {
    const baseInput = {
      maxRequestRetries: this.config.maxRetries,
      maxConcurrency: this.config.maxConcurrentRequests,
      maxItems: source.maxPosts,
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL'],
      },
      extendOutputFunction: async function pageFunction(context: any) {
        // Add additional metadata
        return {
          ...context.item,
          crawledAt: new Date().toISOString(),
          sourceType: source.type,
          sourceValue: source.value,
        };
      },
    };

    switch (source.type) {
      case 'trending':
        return {
          ...baseInput,
          searchTerms: ['trending'],
          searchType: 'trending',
        };

      case 'hashtag':
        return {
          ...baseInput,
          searchTerms: [source.value],
          searchType: 'hashtag',
        };

      case 'user':
        return {
          ...baseInput,
          searchTerms: [source.value],
          searchType: 'user',
        };

      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  /**
   * Get dataset ID from a completed run
   */
  private async getDatasetIdFromRun(runId: string): Promise<string | null> {
    try {
      // The dataset ID is typically the same as the run ID
      const datasetInfo = await this.apifyClient.getDatasetInfo(runId);
      return datasetInfo.id;
    } catch (error) {
      logger.error({
        msg: 'Failed to get dataset ID from run',
        runId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Process and normalize TikTok videos into posts
   */
  private async processVideos(videos: TikTokVideo[], source: TikTokSource): Promise<TikTokPost[]> {
    const posts: TikTokPost[] = [];
    const now = new Date();

    for (const video of videos) {
      try {
        // Check if post is within our time window
        if (video.createTime) {
          const postDate = new Date(video.createTime * 1000);
          const hoursSincePost = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursSincePost < this.config.minPostAgeHours || 
              hoursSincePost > this.config.maxPostAgeHours) {
            continue;
          }
        }

        const post = this.normalizeVideo(video, source);
        posts.push(post);

      } catch (error) {
        logger.warn({
          msg: 'Failed to process TikTok video',
          postId: video.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return posts;
  }

  /**
   * Normalize a TikTok video into our post format
   */
  private normalizeVideo(video: TikTokVideo, source: TikTokSource): TikTokPost {
    const postDate = video.createTime ? new Date(video.createTime * 1000) : new Date();
    
    return {
      postId: video.id,
      authorId: video.author.id,
      authorUsername: video.author.uniqueId,
      authorDisplayName: video.author.nickname || undefined,
      authorAvatar: video.author.avatarLarger || video.author.avatarMedium || video.author.avatarThumb || undefined,
      authorVerified: video.author.verified || false,
      authorFollowers: video.author.followerCount || undefined,
      authorFollowing: video.author.followingCount || undefined,
      authorLikes: video.author.heartCount || undefined,
      
      description: video.desc || undefined,
      hashtags: video.hashtags?.map(h => h.name) || [],
      mentions: video.mentions?.map(m => m.uniqueId) || [],
      musicTitle: video.music?.title || undefined,
      musicAuthor: video.music?.author || undefined,
      
      videoUrl: video.video?.playAddr || video.video?.downloadAddr || undefined,
      videoDuration: video.video?.duration || undefined,
      videoWidth: video.video?.width || undefined,
      videoHeight: video.video?.height || undefined,
      videoBitrate: video.video?.bitrate || undefined,
      videoFormat: video.video?.format || undefined,
      
      likeCount: video.stats?.diggCount || 0,
      commentCount: video.stats?.commentCount || 0,
      shareCount: video.stats?.shareCount || 0,
      viewCount: video.stats?.playCount || 0,
      bookmarkCount: video.stats?.collectCount || 0,
      
      postedAt: postDate,
      crawledAt: new Date(),
      
      sourceType: source.type,
      sourceValue: source.value,
      
      rawData: this.config.enableRawDataStorage ? video : undefined,
      
      isPrivate: video.isPrivate || false,
      isDeleted: video.isDeleted || false,
    };
  }

  /**
   * Validate the Apify configuration
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      const isValid = await this.apifyClient.validateToken();
      
      if (!isValid) {
        logger.error({
          msg: 'Apify token validation failed',
        });
        return false;
      }

      logger.info({
        msg: 'TikTok configuration validated successfully',
      });

      return true;
    } catch (error) {
      logger.error({
        msg: 'TikTok configuration validation failed',
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

/**
 * Create a TikTok data fetcher with configuration from environment
 */
export function createTikTokFetcher(): TikTokDataFetcher {
  const config: TikTokConfig = {
    apifyToken: process.env.TIKTOK_APIFY_TOKEN!,
    apifyActorId: process.env.TIKTOK_APIFY_ACTOR_ID || 'apify/actor-tiktok-scraper',
    apifyUserId: process.env.TIKTOK_APIFY_USER_ID,
    
    sources: parseSourcesFromEnv(),
    
    maxPostsPerSource: parseInt(process.env.TIKTOK_MAX_POSTS_PER_SOURCE || '50'),
    minPostAgeHours: parseInt(process.env.TIKTOK_MIN_POST_AGE_HOURS || '1'),
    maxPostAgeHours: parseInt(process.env.TIKTOK_MAX_POST_AGE_HOURS || '24'),
    rateLimitDelayMs: parseInt(process.env.TIKTOK_RATE_LIMIT_DELAY_MS || '1000'),
    maxRetries: parseInt(process.env.TIKTOK_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.TIKTOK_RETRY_DELAY_MS || '5000'),
    
    enableHourlyAggregation: process.env.TIKTOK_ENABLE_HOURLY_AGGREGATION === 'true',
    cleanupOldDataDays: parseInt(process.env.TIKTOK_CLEANUP_OLD_DATA_DAYS || '30'),
    enableDeadLetterQueue: process.env.TIKTOK_ENABLE_DEAD_LETTER_QUEUE === 'true',
    
    apiTimeoutMs: parseInt(process.env.TIKTOK_API_TIMEOUT_MS || '30000'),
    maxConcurrentRequests: parseInt(process.env.TIKTOK_API_MAX_CONCURRENT_REQUESTS || '3'),
    enableRawDataStorage: process.env.TIKTOK_ENABLE_RAW_DATA_STORAGE === 'true',
    enableDebugLogging: process.env.TIKTOK_ENABLE_DEBUG_LOGGING === 'true',
  };

  return new TikTokDataFetcher(config);
}

/**
 * Parse sources from environment variable
 */
function parseSourcesFromEnv(): TikTokSource[] {
  const sourcesStr = process.env.TIKTOK_SOURCES || 'trending';
  const sources: TikTokSource[] = [];

  for (const sourceStr of sourcesStr.split(',')) {
    const trimmed = sourceStr.trim();
    
    if (trimmed === 'trending') {
      sources.push({
        type: 'trending',
        value: 'trending',
        maxPosts: parseInt(process.env.TIKTOK_MAX_POSTS_PER_SOURCE || '50'),
        enabled: true,
      });
    } else if (trimmed.startsWith('hashtag:')) {
      const hashtag = trimmed.substring(8);
      sources.push({
        type: 'hashtag',
        value: hashtag,
        maxPosts: parseInt(process.env.TIKTOK_MAX_POSTS_PER_SOURCE || '50'),
        enabled: true,
      });
    } else if (trimmed.startsWith('user:')) {
      const username = trimmed.substring(5);
      sources.push({
        type: 'user',
        value: username,
        maxPosts: parseInt(process.env.TIKTOK_MAX_POSTS_PER_SOURCE || '50'),
        enabled: true,
      });
    } else {
      logger.warn({
        msg: 'Invalid TikTok source format',
        source: trimmed,
      });
    }
  }

  return sources;
}
