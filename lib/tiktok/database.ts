import { logger } from '../logger';
import { query, transaction } from '../db';
import { 
  TikTokPost, 
  IngestEvent, 
  TikTokHourly,
  SourceType 
} from './types';

export class TikTokDatabase {
  /**
   * Upsert a TikTok post with deduplication
   */
  async upsertPost(post: TikTokPost, ingestEventId?: string): Promise<boolean> {
    try {
      const result = await query(
        `INSERT INTO "TikTokPost" (
          "postId", "authorId", "authorUsername", "authorDisplayName", "authorAvatar",
          "authorVerified", "authorFollowers", "authorFollowing", "authorLikes",
          "description", "hashtags", "mentions", "musicTitle", "musicAuthor",
          "videoUrl", "videoDuration", "videoWidth", "videoHeight", "videoBitrate", "videoFormat",
          "likeCount", "commentCount", "shareCount", "viewCount", "bookmarkCount",
          "postedAt", "crawledAt", "sourceType", "sourceValue", "ingestEventId",
          "rawData", "region", "language", "isPrivate", "isDeleted"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35)
        ON CONFLICT ("postId") DO UPDATE SET
          "likeCount" = EXCLUDED."likeCount",
          "commentCount" = EXCLUDED."commentCount",
          "shareCount" = EXCLUDED."shareCount",
          "viewCount" = EXCLUDED."viewCount",
          "bookmarkCount" = EXCLUDED."bookmarkCount",
          "crawledAt" = EXCLUDED."crawledAt",
          "rawData" = EXCLUDED."rawData",
          "updatedAt" = NOW()
        RETURNING "id"`,
        [
          post.postId, post.authorId, post.authorUsername, post.authorDisplayName, post.authorAvatar,
          post.authorVerified, post.authorFollowers, post.authorFollowing, post.authorLikes,
          post.description, post.hashtags, post.mentions, post.musicTitle, post.musicAuthor,
          post.videoUrl, post.videoDuration, post.videoWidth, post.videoHeight, post.videoBitrate, post.videoFormat,
          post.likeCount, post.commentCount, post.shareCount, post.viewCount, post.bookmarkCount,
          post.postedAt, post.crawledAt, post.sourceType, post.sourceValue, ingestEventId,
          post.rawData, post.region, post.language, post.isPrivate, post.isDeleted
        ]
      );

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error({
        msg: 'Failed to upsert TikTok post',
        postId: post.postId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Upsert multiple TikTok posts in a transaction
   */
  async upsertPosts(posts: TikTokPost[], ingestEventId?: string): Promise<{
    inserted: number;
    updated: number;
    failed: number;
  }> {
    return await transaction(async (client) => {
      let inserted = 0;
      let updated = 0;
      let failed = 0;

      for (const post of posts) {
        try {
          const result = await query(
            `INSERT INTO "TikTokPost" (
              "postId", "authorId", "authorUsername", "authorDisplayName", "authorAvatar",
              "authorVerified", "authorFollowers", "authorFollowing", "authorLikes",
              "description", "hashtags", "mentions", "musicTitle", "musicAuthor",
              "videoUrl", "videoDuration", "videoWidth", "videoHeight", "videoBitrate", "videoFormat",
              "likeCount", "commentCount", "shareCount", "viewCount", "bookmarkCount",
              "postedAt", "crawledAt", "sourceType", "sourceValue", "ingestEventId",
              "rawData", "region", "language", "isPrivate", "isDeleted"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35)
            ON CONFLICT ("postId") DO UPDATE SET
              "likeCount" = EXCLUDED."likeCount",
              "commentCount" = EXCLUDED."commentCount",
              "shareCount" = EXCLUDED."shareCount",
              "viewCount" = EXCLUDED."viewCount",
              "bookmarkCount" = EXCLUDED."bookmarkCount",
              "crawledAt" = EXCLUDED."crawledAt",
              "rawData" = EXCLUDED."rawData",
              "updatedAt" = NOW()
            RETURNING "id", "postId"`,
            [
              post.postId, post.authorId, post.authorUsername, post.authorDisplayName, post.authorAvatar,
              post.authorVerified, post.authorFollowers, post.authorFollowing, post.authorLikes,
              post.description, post.hashtags, post.mentions, post.musicTitle, post.musicAuthor,
              post.videoUrl, post.videoDuration, post.videoWidth, post.videoHeight, post.videoBitrate, post.videoFormat,
              post.likeCount, post.commentCount, post.shareCount, post.viewCount, post.bookmarkCount,
              post.postedAt, post.crawledAt, post.sourceType, post.sourceValue, ingestEventId,
              post.rawData, post.region, post.language, post.isPrivate, post.isDeleted
            ],
            client
          );

          if (result.rowCount > 0) {
            // Check if this was an insert or update by looking at the row
            const existingPost = await query(
              'SELECT "createdAt" FROM "TikTokPost" WHERE "postId" = $1',
              [post.postId],
              client
            );

            if (existingPost.rows[0]?.createdAt === post.crawledAt) {
              inserted++;
            } else {
              updated++;
            }
          }
        } catch (error) {
          failed++;
          logger.error({
            msg: 'Failed to upsert TikTok post in transaction',
            postId: post.postId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return { inserted, updated, failed };
    });
  }

  /**
   * Create an ingest event
   */
  async createIngestEvent(event: Omit<IngestEvent, 'id'>): Promise<string> {
    try {
      const result = await query(
        `INSERT INTO "IngestEvent" (
          "source", "eventType", "sourceValue", "startedAt", "completedAt", "duration",
          "itemsRequested", "itemsReceived", "itemsProcessed", "itemsSkipped", "itemsFailed",
          "success", "errorMessage", "errorStack", "config"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING "id"`,
        [
          event.source, event.eventType, event.sourceValue, event.startedAt, event.completedAt, event.duration,
          event.itemsRequested, event.itemsReceived, event.itemsProcessed, event.itemsSkipped, event.itemsFailed,
          event.success, event.errorMessage, event.errorStack, event.config
        ]
      );

      return result.rows[0].id;
    } catch (error) {
      logger.error({
        msg: 'Failed to create ingest event',
        eventType: event.eventType,
        sourceValue: event.sourceValue,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update an ingest event
   */
  async updateIngestEvent(
    id: string, 
    updates: Partial<Pick<IngestEvent, 'completedAt' | 'duration' | 'itemsProcessed' | 'itemsSkipped' | 'itemsFailed' | 'success' | 'errorMessage' | 'errorStack'>>
  ): Promise<void> {
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `"${key}" = $${index + 2}`)
        .join(', ');

      const values = Object.values(updates);
      
      await query(
        `UPDATE "IngestEvent" SET ${setClause} WHERE "id" = $1`,
        [id, ...values]
      );
    } catch (error) {
      logger.error({
        msg: 'Failed to update ingest event',
        eventId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate hourly aggregations for a specific date and hour
   */
  async generateHourlyAggregation(date: Date, hour: number): Promise<void> {
    try {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(hour + 1, 0, 0, 0);

      // Get aggregated data for the hour
      const result = await query(
        `SELECT 
          COUNT(*) as total_posts,
          SUM("likeCount") as total_likes,
          SUM("commentCount") as total_comments,
          SUM("shareCount") as total_shares,
          SUM("viewCount") as total_views,
          SUM("bookmarkCount") as total_bookmarks,
          COUNT(CASE WHEN "sourceType" = 'trending' THEN 1 END) as trending_posts,
          COUNT(CASE WHEN "sourceType" = 'hashtag' THEN 1 END) as hashtag_posts,
          COUNT(CASE WHEN "sourceType" = 'user' THEN 1 END) as user_posts,
          AVG("likeCount") as avg_likes,
          AVG("commentCount") as avg_comments,
          AVG("shareCount") as avg_shares,
          AVG("viewCount") as avg_views,
          AVG(CASE WHEN "viewCount" > 0 THEN ("likeCount" + "commentCount" + "shareCount")::float / "viewCount" ELSE 0 END) as engagement_rate
        FROM "TikTokPost"
        WHERE "postedAt" >= $1 AND "postedAt" < $2`,
        [startTime, endTime]
      );

      const stats = result.rows[0];

      // Get top hashtags
      const hashtagResult = await query(
        `SELECT 
          unnest("hashtags") as hashtag,
          COUNT(*) as count
        FROM "TikTokPost"
        WHERE "postedAt" >= $1 AND "postedAt" < $2
        GROUP BY hashtag
        ORDER BY count DESC
        LIMIT 10`,
        [startTime, endTime]
      );

      // Get top authors
      const authorResult = await query(
        `SELECT 
          "authorUsername",
          COUNT(*) as posts,
          SUM("likeCount") as likes
        FROM "TikTokPost"
        WHERE "postedAt" >= $1 AND "postedAt" < $2
        GROUP BY "authorUsername"
        ORDER BY likes DESC
        LIMIT 10`,
        [startTime, endTime]
      );

      // Upsert the hourly aggregation
      await query(
        `INSERT INTO "TikTokHourly" (
          "date", "hour", "totalPosts", "totalLikes", "totalComments", "totalShares", "totalViews", "totalBookmarks",
          "trendingPosts", "hashtagPosts", "userPosts", "topHashtags", "topAuthors",
          "avgLikes", "avgComments", "avgShares", "avgViews", "engagementRate"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT ("date", "hour") DO UPDATE SET
          "totalPosts" = EXCLUDED."totalPosts",
          "totalLikes" = EXCLUDED."totalLikes",
          "totalComments" = EXCLUDED."totalComments",
          "totalShares" = EXCLUDED."totalShares",
          "totalViews" = EXCLUDED."totalViews",
          "totalBookmarks" = EXCLUDED."totalBookmarks",
          "trendingPosts" = EXCLUDED."trendingPosts",
          "hashtagPosts" = EXCLUDED."hashtagPosts",
          "userPosts" = EXCLUDED."userPosts",
          "topHashtags" = EXCLUDED."topHashtags",
          "topAuthors" = EXCLUDED."topAuthors",
          "avgLikes" = EXCLUDED."avgLikes",
          "avgComments" = EXCLUDED."avgComments",
          "avgShares" = EXCLUDED."avgShares",
          "avgViews" = EXCLUDED."avgViews",
          "engagementRate" = EXCLUDED."engagementRate",
          "updatedAt" = NOW()`,
        [
          date, hour,
          parseInt(stats.total_posts) || 0,
          parseInt(stats.total_likes) || 0,
          parseInt(stats.total_comments) || 0,
          parseInt(stats.total_shares) || 0,
          parseInt(stats.total_views) || 0,
          parseInt(stats.total_bookmarks) || 0,
          parseInt(stats.trending_posts) || 0,
          parseInt(stats.hashtag_posts) || 0,
          parseInt(stats.user_posts) || 0,
          JSON.stringify(hashtagResult.rows),
          JSON.stringify(authorResult.rows),
          parseFloat(stats.avg_likes) || 0,
          parseFloat(stats.avg_comments) || 0,
          parseFloat(stats.avg_shares) || 0,
          parseFloat(stats.avg_views) || 0,
          parseFloat(stats.engagement_rate) || 0,
        ]
      );

      logger.info({
        msg: 'Hourly aggregation generated',
        date: date.toISOString(),
        hour,
        totalPosts: stats.total_posts,
      });

    } catch (error) {
      logger.error({
        msg: 'Failed to generate hourly aggregation',
        date: date.toISOString(),
        hour,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Clean up old data
   */
  async cleanupOldData(daysToKeep: number): Promise<{
    postsDeleted: number;
    eventsDeleted: number;
    hourlyDeleted: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Delete old posts
      const postsResult = await query(
        'DELETE FROM "TikTokPost" WHERE "createdAt" < $1',
        [cutoffDate]
      );

      // Delete old ingest events
      const eventsResult = await query(
        'DELETE FROM "IngestEvent" WHERE "createdAt" < $1',
        [cutoffDate]
      );

      // Delete old hourly aggregations
      const hourlyResult = await query(
        'DELETE FROM "TikTokHourly" WHERE "date" < $1',
        [cutoffDate]
      );

      const result = {
        postsDeleted: postsResult.rowCount,
        eventsDeleted: eventsResult.rowCount,
        hourlyDeleted: hourlyResult.rowCount,
      };

      logger.info({
        msg: 'Old TikTok data cleaned up',
        cutoffDate: cutoffDate.toISOString(),
        ...result,
      });

      return result;
    } catch (error) {
      logger.error({
        msg: 'Failed to cleanup old TikTok data',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get recent posts for a source
   */
  async getRecentPosts(
    sourceType: SourceType,
    sourceValue: string,
    limit: number = 50
  ): Promise<TikTokPost[]> {
    try {
      const result = await query(
        `SELECT * FROM "TikTokPost"
         WHERE "sourceType" = $1 AND "sourceValue" = $2
         ORDER BY "postedAt" DESC
         LIMIT $3`,
        [sourceType, sourceValue, limit]
      );

      return result.rows.map(row => ({
        ...row,
        postedAt: new Date(row.postedAt),
        crawledAt: new Date(row.crawledAt),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
    } catch (error) {
      logger.error({
        msg: 'Failed to get recent TikTok posts',
        sourceType,
        sourceValue,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get hourly statistics for a date range
   */
  async getHourlyStats(
    startDate: Date,
    endDate: Date
  ): Promise<TikTokHourly[]> {
    try {
      const result = await query(
        `SELECT * FROM "TikTokHourly"
         WHERE "date" >= $1 AND "date" <= $2
         ORDER BY "date", "hour"`,
        [startDate, endDate]
      );

      return result.rows.map(row => ({
        ...row,
        date: new Date(row.date),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
    } catch (error) {
      logger.error({
        msg: 'Failed to get hourly TikTok stats',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

/**
 * Create a TikTok database instance
 */
export function createTikTokDatabase(): TikTokDatabase {
  return new TikTokDatabase();
}
