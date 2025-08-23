#!/usr/bin/env tsx

import { logger } from '../../lib/logger';
import { createTikTokFetcher } from '../../lib/tiktok/fetch';
import { createTikTokDatabase } from '../../lib/tiktok/database';
import { TikTokSource, IngestResult } from '../../lib/tiktok/types';

/**
 * Main TikTok ingestion worker
 */
export class TikTokIngestionWorker {
  private fetcher: ReturnType<typeof createTikTokFetcher>;
  private database: ReturnType<typeof createTikTokDatabase>;

  constructor() {
    this.fetcher = createTikTokFetcher();
    this.database = createTikTokDatabase();
  }

  /**
   * Run the complete ingestion process for all configured sources
   */
  async runIngestion(): Promise<{
    success: boolean;
    totalProcessed: number;
    totalSkipped: number;
    totalFailed: number;
    errors: string[];
    duration: number;
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    let totalProcessed = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    try {
      logger.info({
        msg: 'Starting TikTok ingestion process',
        sources: this.fetcher['config'].sources.map(s => `${s.type}:${s.value}`),
      });

      // Validate configuration
      const isValid = await this.fetcher.validateConfiguration();
      if (!isValid) {
        throw new Error('TikTok configuration validation failed');
      }

      // Process each source
      for (const source of this.fetcher['config'].sources) {
        if (!source.enabled) {
          logger.info({
            msg: 'Skipping disabled source',
            sourceType: source.type,
            sourceValue: source.value,
          });
          continue;
        }

        try {
          const result = await this.processSource(source);
          
          totalProcessed += result.postsProcessed;
          totalSkipped += result.postsSkipped;
          totalFailed += result.postsFailed;

          if (result.error) {
            errors.push(`${source.type}:${source.value} - ${result.error}`);
          }

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`${source.type}:${source.value} - ${errorMsg}`);
          totalFailed += 1;
          
          logger.error({
            msg: 'Failed to process TikTok source',
            sourceType: source.type,
            sourceValue: source.value,
            error: errorMsg,
          });
        }

        // Rate limiting between sources
        if (this.fetcher['config'].rateLimitDelayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, this.fetcher['config'].rateLimitDelayMs));
        }
      }

      // Generate hourly aggregations if enabled
      if (this.fetcher['config'].enableHourlyAggregation) {
        try {
          await this.generateHourlyAggregations();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Hourly aggregation - ${errorMsg}`);
          
          logger.error({
            msg: 'Failed to generate hourly aggregations',
            error: errorMsg,
          });
        }
      }

      // Cleanup old data if enabled
      if (this.fetcher['config'].cleanupOldDataDays > 0) {
        try {
          await this.cleanupOldData();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Data cleanup - ${errorMsg}`);
          
          logger.error({
            msg: 'Failed to cleanup old data',
            error: errorMsg,
          });
        }
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`General error - ${errorMsg}`);
      
      logger.error({
        msg: 'TikTok ingestion process failed',
        error: errorMsg,
      });
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    logger.info({
      msg: 'TikTok ingestion process completed',
      success,
      totalProcessed,
      totalSkipped,
      totalFailed,
      errorCount: errors.length,
      duration,
    });

    return {
      success,
      totalProcessed,
      totalSkipped,
      totalFailed,
      errors,
      duration,
    };
  }

  /**
   * Process a single TikTok source
   */
  private async processSource(source: TikTokSource): Promise<IngestResult> {
    const startTime = Date.now();
    
    // Create ingest event
    const eventId = await this.database.createIngestEvent({
      source: 'tiktok',
      eventType: source.type,
      sourceValue: source.value,
      startedAt: new Date(),
      itemsRequested: source.maxPosts,
      success: false,
    });

    try {
      // Fetch data from Apify
      const fetchResult = await this.fetcher.fetchFromSource(source);
      
      if (!fetchResult.success) {
        throw new Error(fetchResult.error || 'Unknown fetch error');
      }

      // Store the posts in the database
      const posts = await this.fetcher['processVideos'](fetchResult.posts || [], source);
      const dbResult = await this.database.upsertPosts(posts, eventId);

      const duration = Date.now() - startTime;

      // Update ingest event with results
      await this.database.updateIngestEvent(eventId, {
        completedAt: new Date(),
        duration,
        itemsReceived: fetchResult.postsProcessed + fetchResult.postsSkipped,
        itemsProcessed: dbResult.inserted + dbResult.updated,
        itemsSkipped: fetchResult.postsSkipped + dbResult.failed,
        itemsFailed: fetchResult.postsFailed,
        success: true,
      });

      logger.info({
        msg: 'TikTok source processed successfully',
        sourceType: source.type,
        sourceValue: source.value,
        postsInserted: dbResult.inserted,
        postsUpdated: dbResult.updated,
        postsFailed: dbResult.failed,
        duration,
      });

      return {
        success: true,
        postsProcessed: dbResult.inserted + dbResult.updated,
        postsSkipped: fetchResult.postsSkipped + dbResult.failed,
        postsFailed: fetchResult.postsFailed,
        duration,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Update ingest event with error
      await this.database.updateIngestEvent(eventId, {
        completedAt: new Date(),
        duration,
        success: false,
        errorMessage: errorMsg,
        errorStack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        postsProcessed: 0,
        postsSkipped: 0,
        postsFailed: 1,
        error: errorMsg,
        duration,
      };
    }
  }

  /**
   * Generate hourly aggregations for the current hour
   */
  private async generateHourlyAggregations(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    logger.info({
      msg: 'Generating hourly aggregations',
      date: currentDate.toISOString(),
      hour: currentHour,
    });

    await this.database.generateHourlyAggregation(currentDate, currentHour);
  }

  /**
   * Clean up old data based on configuration
   */
  private async cleanupOldData(): Promise<void> {
    const daysToKeep = this.fetcher['config'].cleanupOldDataDays;
    
    logger.info({
      msg: 'Cleaning up old TikTok data',
      daysToKeep,
    });

    const result = await this.database.cleanupOldData(daysToKeep);
    
    logger.info({
      msg: 'TikTok data cleanup completed',
      ...result,
    });
  }
}

/**
 * Main entry point for the TikTok ingestion worker
 */
async function main() {
  const worker = new TikTokIngestionWorker();
  
  try {
    const result = await worker.runIngestion();
    
    if (!result.success) {
      logger.error({
        msg: 'TikTok ingestion completed with errors',
        errors: result.errors,
      });
      process.exit(1);
    }
    
    logger.info({
      msg: 'TikTok ingestion completed successfully',
      totalProcessed: result.totalProcessed,
      totalSkipped: result.totalSkipped,
      totalFailed: result.totalFailed,
      duration: result.duration,
    });
    
    process.exit(0);
    
  } catch (error) {
    logger.error({
      msg: 'TikTok ingestion worker failed',
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logger.error({
      msg: 'Unhandled error in TikTok ingestion worker',
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}

export default TikTokIngestionWorker;
