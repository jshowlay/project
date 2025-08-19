#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_SIZE || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Initializing database schema...');
    
    // Create trend_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trend_items (
        id SERIAL PRIMARY KEY,
        source VARCHAR(50) NOT NULL,
        external_id VARCHAR(255) NOT NULL,
        title TEXT NOT NULL,
        topic VARCHAR(255),
        url TEXT,
        score INTEGER DEFAULT 0,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(source, external_id)
      );
    `);
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trend_items_source ON trend_items(source);
      CREATE INDEX IF NOT EXISTS idx_trend_items_score ON trend_items(score DESC);
      CREATE INDEX IF NOT EXISTS idx_trend_items_created_at ON trend_items(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_trend_items_source_score ON trend_items(source, score DESC);
    `);
    
    // Create materialized view for trend analysis
    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_trends_hourly AS
      SELECT 
        source,
        external_id,
        title,
        topic,
        url,
        score,
        upvotes,
        downvotes,
        comments,
        views,
        created_at,
        updated_at,
        -- Calculate trend score based on recent activity vs baseline
        CASE 
          WHEN baseline.score > 0 THEN 
            ROUND(((recent.score - baseline.score) / baseline.score::float) * 100)
          ELSE recent.score
        END as trend_score,
        -- Calculate velocity (change in score over time)
        CASE 
          WHEN baseline.score > 0 AND recent.score > baseline.score THEN
            ROUND((recent.score - baseline.score) / EXTRACT(EPOCH FROM (NOW() - recent.updated_at))::float * 3600)
          ELSE 0
        END as velocity,
        -- Calculate acceleration (change in velocity)
        CASE 
          WHEN baseline.score > 0 AND recent.score > baseline.score THEN
            ROUND((recent.score - baseline.score) / EXTRACT(EPOCH FROM (NOW() - recent.updated_at))::float * 3600 * 3600)
          ELSE 0
        END as acceleration
      FROM (
        -- Recent data (last 60 minutes)
        SELECT 
          source,
          external_id,
          title,
          topic,
          url,
          score,
          upvotes,
          downvotes,
          comments,
          views,
          created_at,
          updated_at
        FROM trend_items 
        WHERE updated_at >= NOW() - INTERVAL '60 minutes'
      ) recent
      LEFT JOIN (
        -- Baseline data (prior 24 hours, excluding last 60 minutes)
        SELECT 
          source,
          external_id,
          AVG(score) as score,
          AVG(upvotes) as upvotes,
          AVG(downvotes) as downvotes,
          AVG(comments) as comments,
          AVG(views) as views
        FROM trend_items 
        WHERE updated_at >= NOW() - INTERVAL '24 hours' 
          AND updated_at < NOW() - INTERVAL '60 minutes'
        GROUP BY source, external_id
      ) baseline ON recent.source = baseline.source AND recent.external_id = baseline.external_id
      ORDER BY trend_score DESC, velocity DESC;
    `);
    
    // Create indexes on materialized view
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mv_trends_hourly_trend_score ON mv_trends_hourly(trend_score DESC);
      CREATE INDEX IF NOT EXISTS idx_mv_trends_hourly_velocity ON mv_trends_hourly(velocity DESC);
      CREATE INDEX IF NOT EXISTS idx_mv_trends_hourly_source ON mv_trends_hourly(source);
      CREATE INDEX IF NOT EXISTS idx_mv_trends_hourly_updated_at ON mv_trends_hourly(updated_at DESC);
    `);
    
    // Create function to refresh materialized view
    await client.query(`
      CREATE OR REPLACE FUNCTION refresh_trends_mv()
      RETURNS void AS $$
      BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trends_hourly;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Database schema initialized successfully!');
    
    // Test the setup
    const result = await client.query('SELECT COUNT(*) as count FROM trend_items');
    console.log(`📊 Current trend_items count: ${result.rows[0].count}`);
    
    const mvResult = await client.query('SELECT COUNT(*) as count FROM mv_trends_hourly');
    console.log(`📈 Current materialized view count: ${mvResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('🎉 Database initialization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase };
