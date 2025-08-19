#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Simple logger
const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${msg}`, data),
  warn: (msg, data = {}) => console.log(`[WARN] ${msg}`, data),
  error: (msg, data = {}) => console.log(`[ERROR] ${msg}`, data),
};

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_SIZE || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
});

// Upsert trend item
async function upsertTrendItem(item) {
  const text = `
    INSERT INTO trend_items (
      source, external_id, title, topic, url, score, upvotes, downvotes, comments, views, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    ON CONFLICT (source, external_id) 
    DO UPDATE SET 
      title = EXCLUDED.title,
      topic = EXCLUDED.topic,
      url = EXCLUDED.url,
      score = EXCLUDED.score,
      upvotes = EXCLUDED.upvotes,
      downvotes = EXCLUDED.downvotes,
      comments = EXCLUDED.comments,
      views = EXCLUDED.views,
      updated_at = NOW()
  `;
  
  const params = [
    item.source,
    item.external_id,
    item.title,
    item.topic,
    item.url,
    item.score || 0,
    item.upvotes || 0,
    item.downvotes || 0,
    item.comments || 0,
    item.views || 0
  ];
  
  await pool.query(text, params);
}

// Fetch Reddit data
async function fetchRedditData() {
  const subreddits = (process.env.REDDIT_SUBREDDITS || 'all,popular,trending').split(',');
  const limit = parseInt(process.env.REDDIT_LIMIT || '25');
  const items = [];

  for (const subreddit of subreddits) {
    try {
      logger.info(`Fetching from r/${subreddit}`);
      
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`, {
        headers: {
          'User-Agent': 'TrenderAI/1.0 (Data Collection Bot)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const subredditItems = data.data.children.map(child => {
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
      
      items.push(...subredditItems);
      logger.info(`Fetched ${subredditItems.length} items from r/${subreddit}`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      logger.error(`Failed to fetch from r/${subreddit}`, { error: error.message });
    }
  }

  return items;
}

// Refresh materialized view
async function refreshMaterializedView() {
  await pool.query('SELECT refresh_trends_mv()');
}

// Main ingestion function
async function runIngestion() {
  const startTime = Date.now();
  let totalItems = 0;
  let sourcesProcessed = 0;
  const errors = [];

  try {
    logger.info('Starting data ingestion process');

    // Fetch Reddit data (always enabled)
    try {
      const redditItems = await fetchRedditData();
      
      if (redditItems.length > 0) {
        // Insert items into database
        for (const item of redditItems) {
          await upsertTrendItem(item);
        }
        
        totalItems += redditItems.length;
        sourcesProcessed++;
        
        logger.info(`Successfully processed ${redditItems.length} items from Reddit`);
      }
    } catch (error) {
      const errorMessage = `Reddit: ${error.message}`;
      errors.push(errorMessage);
      logger.error('Failed to process Reddit', { error: errorMessage });
    }

    // Refresh materialized view if we have data
    if (totalItems > 0) {
      try {
        logger.info('Refreshing materialized view');
        await refreshMaterializedView();
        logger.info('Materialized view refreshed successfully');
      } catch (error) {
        const errorMessage = `Materialized view refresh: ${error.message}`;
        errors.push(errorMessage);
        logger.error('Failed to refresh materialized view', { error: errorMessage });
      }
    }

    const duration = Date.now() - startTime;

    const result = {
      success: errors.length === 0,
      totalItems,
      sourcesProcessed,
      errors,
      duration,
    };

    logger.info('Data ingestion completed', {
      success: result.success,
      totalItems: result.totalItems,
      sourcesProcessed: result.sourcesProcessed,
      errors: result.errors.length,
      duration: result.duration,
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error.message;

    logger.error('Data ingestion failed', { error: errorMessage, duration });

    return {
      success: false,
      totalItems,
      sourcesProcessed,
      errors: [errorMessage],
      duration,
    };
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runIngestion()
    .then((result) => {
      if (result.success) {
        console.log('✅ Ingestion completed successfully!');
        console.log(`📊 Total items processed: ${result.totalItems}`);
        console.log(`🔗 Sources processed: ${result.sourcesProcessed}`);
        console.log(`⏱️  Duration: ${result.duration}ms`);
        
        if (result.errors.length > 0) {
          console.log('⚠️  Warnings:');
          result.errors.forEach(error => console.log(`   - ${error}`));
        }
      } else {
        console.log('❌ Ingestion completed with errors:');
        result.errors.forEach(error => console.log(`   - ${error}`));
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Ingestion failed:', error);
      process.exit(1);
    });
}
