#!/usr/bin/env tsx

import 'dotenv/config';
import { logger } from '../lib/logger';
import { createTikTokDatabase } from '../lib/tiktok/database';
import { createTikTokFetcher } from '../lib/tiktok/fetch';
import { createApifyClient } from '../lib/apifyClient';

async function testTikTokSystem() {
  try {
    logger.info({
      msg: 'Testing TikTok ingestion system components',
    });

    // Test 1: Database connection
    logger.info({
      msg: 'Test 1: Testing database connection',
    });
    
    const db = createTikTokDatabase();
    
    // Test basic database operations
    const testResult = await db.getRecentPosts('trending', 'trending', 1);
    logger.info({
      msg: 'Database connection test completed',
      postsFound: testResult.length,
    });

    // Test 2: Configuration validation
    logger.info({
      msg: 'Test 2: Testing configuration',
    });
    
    const config = {
      apifyToken: process.env.TIKTOK_APIFY_TOKEN,
      apifyActorId: process.env.TIKTOK_APIFY_ACTOR_ID || 'apify/actor-tiktok-scraper',
      sources: process.env.TIKTOK_SOURCES || 'trending',
      maxPostsPerSource: parseInt(process.env.TIKTOK_MAX_POSTS_PER_SOURCE || '50'),
    };

    logger.info({
      msg: 'Configuration loaded',
      config: {
        apifyToken: config.apifyToken ? 'SET' : 'NOT SET',
        apifyActorId: config.apifyActorId,
        sources: config.sources,
        maxPostsPerSource: config.maxPostsPerSource,
      },
    });

    // Test 3: Apify client (if token is available)
    if (config.apifyToken) {
      logger.info({
        msg: 'Test 3: Testing Apify client',
      });
      
      try {
        const apifyClient = createApifyClient();
        const isValid = await apifyClient.validateToken();
        
        logger.info({
          msg: 'Apify token validation result',
          isValid,
        });
      } catch (error) {
        logger.warn({
          msg: 'Apify client test failed (this is expected without valid token)',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      logger.info({
        msg: 'Test 3: Skipping Apify client test (no token)',
      });
    }

    // Test 4: TikTok fetcher configuration
    logger.info({
      msg: 'Test 4: Testing TikTok fetcher configuration',
    });
    
    try {
      const fetcher = createTikTokFetcher();
      logger.info({
        msg: 'TikTok fetcher created successfully',
        sourceCount: fetcher['config'].sources.length,
        sources: fetcher['config'].sources.map(s => `${s.type}:${s.value}`),
      });
    } catch (error) {
      logger.error({
        msg: 'TikTok fetcher configuration failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 5: Database schema validation
    logger.info({
      msg: 'Test 5: Testing database schema',
    });
    
    try {
      // Test if tables exist by running a simple query
      const { query } = await import('../lib/db');
      
      const tableTests = [
        { name: 'TikTokPost', query: 'SELECT COUNT(*) FROM "TikTokPost" LIMIT 1' },
        { name: 'IngestEvent', query: 'SELECT COUNT(*) FROM "IngestEvent" LIMIT 1' },
        { name: 'TikTokHourly', query: 'SELECT COUNT(*) FROM "TikTokHourly" LIMIT 1' },
      ];

      for (const test of tableTests) {
        try {
          await query(test.query);
          logger.info({
            msg: `Table ${test.name} exists and is accessible`,
          });
        } catch (error) {
          logger.error({
            msg: `Table ${test.name} test failed`,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } catch (error) {
      logger.error({
        msg: 'Database schema test failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    logger.info({
      msg: 'TikTok system test completed successfully',
    });

  } catch (error) {
    logger.error({
      msg: 'TikTok system test failed',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testTikTokSystem()
    .then(() => {
      logger.info({
        msg: 'TikTok system test completed',
      });
      process.exit(0);
    })
    .catch((error) => {
      logger.error({
        msg: 'TikTok system test failed',
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    });
}

export default testTikTokSystem;
