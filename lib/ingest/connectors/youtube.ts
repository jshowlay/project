import { z } from 'zod';
import { BaseSourceConnector, EventType, IngestResult, sanitizeString, calculateScore, parseTimestamp } from './base';

// YouTube API response schemas
const YouTubeSearchResponseSchema = z.object({
  items: z.array(z.object({
    id: z.object({
      videoId: z.string(),
    }),
    snippet: z.object({
      title: z.string(),
      description: z.string(),
      channelTitle: z.string(),
      publishedAt: z.string(),
      thumbnails: z.object({
        default: z.object({
          url: z.string(),
        }).optional(),
        medium: z.object({
          url: z.string(),
        }).optional(),
        high: z.object({
          url: z.string(),
        }).optional(),
      }),
    }),
  })),
  nextPageToken: z.string().optional(),
});

const YouTubeVideoResponseSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    statistics: z.object({
      viewCount: z.string(),
      likeCount: z.string(),
      commentCount: z.string(),
    }),
    snippet: z.object({
      title: z.string(),
      description: z.string(),
      channelTitle: z.string(),
      publishedAt: z.string(),
      tags: z.array(z.string()).optional(),
    }),
  })),
});

export class YouTubeConnector extends BaseSourceConnector {
  private apiKey: string;
  private searchTerms: string[];
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(source: string, rateLimitRps?: number, logger?: any) {
    super(source, rateLimitRps || 5, logger);
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    this.searchTerms = (process.env.YOUTUBE_SEARCH_TERMS || 'ai,technology,startups')
      .split(',')
      .map(term => term.trim())
      .filter(term => term.length > 0);
  }

  getSourceName(): string {
    return 'YouTube';
  }

  isEnabled(): boolean {
    return !!this.apiKey && this.searchTerms.length > 0;
  }

  async ingest(cursor?: string): Promise<IngestResult> {
    if (!this.isEnabled()) {
      return {
        success: false,
        eventsProcessed: 0,
        eventsStored: 0,
        errors: [{ type: 'CONFIG_ERROR', message: 'YouTube API key or search terms not configured' }],
      };
    }

    const result: IngestResult = {
      success: true,
      eventsProcessed: 0,
      eventsStored: 0,
      errors: [],
    };

    try {
      // Get the last cursor for pagination
      const lastCursor = cursor || (await this.getCursor('search')) || undefined;
      
      // Search for videos for each term
      for (const searchTerm of this.searchTerms) {
        const searchResult = await this.searchVideos(searchTerm, lastCursor);
        
        if (searchResult.success) {
          result.eventsProcessed += searchResult.eventsProcessed;
          result.eventsStored += searchResult.eventsStored;
          result.errors.push(...searchResult.errors);
          
          // Update cursor for next page
          if (searchResult.cursor) {
            await this.setCursor('search', searchResult.cursor);
            result.cursor = searchResult.cursor;
          }
        } else {
          result.errors.push(...searchResult.errors);
        }
      }

      // Get detailed statistics for stored videos
      const unprocessedEvents = await this.eventStore.getUnprocessedEvents(50);
      for (const event of unprocessedEvents) {
        if (event.eventType === EventType.VIDEO) {
          const videoStats = await this.getVideoStatistics(event.externalId);
          if (videoStats) {
            // Update the raw data with statistics
            const updatedData = {
              ...event.rawData,
              statistics: videoStats,
            };
            
            await this.eventStore.storeEvent(
              event.externalId,
              EventType.VIDEO,
              updatedData
            );
            
            await this.markEventProcessed(event.id);
            result.eventsStored++;
          }
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.success = false;
      result.errors.push({ type: 'INGEST_ERROR', message: errorMessage });
    }

    return result;
  }

  private async searchVideos(searchTerm: string, pageToken?: string): Promise<IngestResult> {
    const result: IngestResult = {
      success: true,
      eventsProcessed: 0,
      eventsStored: 0,
      errors: [],
    };

    try {
      const url = new URL(`${this.baseUrl}/search`);
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('q', searchTerm);
      url.searchParams.set('type', 'video');
      url.searchParams.set('order', 'relevance');
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('key', this.apiKey);
      
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const response = await this.httpClient.get(url.toString(), YouTubeSearchResponseSchema);
      
      for (const item of response.items) {
        try {
          const eventData = {
            id: item.id.videoId,
            title: sanitizeString(item.snippet.title, 200),
            description: sanitizeString(item.snippet.description, 500),
            author: sanitizeString(item.snippet.channelTitle, 100),
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            timestamp: parseTimestamp(item.snippet.publishedAt),
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            searchTerm,
            metadata: {
              channelTitle: item.snippet.channelTitle,
              publishedAt: item.snippet.publishedAt,
            },
          };

          await this.storeEvent(item.id.videoId, EventType.VIDEO, eventData);
          result.eventsStored++;
          result.eventsProcessed++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push({ 
            type: 'EVENT_PROCESSING_ERROR', 
            message: errorMessage,
            eventId: item.id.videoId 
          });
        }
      }

      if (response.nextPageToken) {
        result.cursor = response.nextPageToken;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.success = false;
      result.errors.push({ type: 'API_ERROR', message: errorMessage });
    }

    return result;
  }

  private async getVideoStatistics(videoId: string): Promise<any> {
    try {
      const url = new URL(`${this.baseUrl}/videos`);
      url.searchParams.set('part', 'statistics,snippet');
      url.searchParams.set('id', videoId);
      url.searchParams.set('key', this.apiKey);

      const response = await this.httpClient.get(url.toString(), YouTubeVideoResponseSchema);
      
      if (response.items.length > 0) {
        const video = response.items[0];
        const stats = video.statistics;
        
        return {
          viewCount: parseInt(stats.viewCount) || 0,
          likeCount: parseInt(stats.likeCount) || 0,
          commentCount: parseInt(stats.commentCount) || 0,
          score: calculateScore(
            parseInt(stats.likeCount) || 0,
            parseInt(stats.commentCount) || 0,
            0, // YouTube doesn't provide share count in basic API
            parseInt(stats.viewCount) || 0
          ),
        };
      }
    } catch (error) {
      this.logger.error(`Failed to get statistics for video ${videoId}:`, error);
    }

    return null;
  }

  async getHealth(): Promise<Record<string, any>> {
    const health = await super.getHealth();
    
    health.config = {
      apiKeyConfigured: !!this.apiKey,
      searchTerms: this.searchTerms,
      searchTermsCount: this.searchTerms.length,
    };

    return health;
  }
}
