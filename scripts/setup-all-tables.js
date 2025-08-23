require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupAllTables() {
  const client = await pool.connect();
  try {
    console.log('Setting up all required tables and views...');

    // Create trend_record table
    console.log('Creating trend_record table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS trend_record (
        id TEXT PRIMARY KEY,
        source VARCHAR(50) NOT NULL,
        external_id VARCHAR(255) NOT NULL,
        topic TEXT,
        title TEXT,
        url TEXT,
        score INTEGER DEFAULT 0,
        trend_score INTEGER DEFAULT 0,
        velocity INTEGER DEFAULT 0,
        acceleration INTEGER DEFAULT 0,
        convergence INTEGER DEFAULT 0,
        search_intent INTEGER DEFAULT 0,
        creator_index INTEGER DEFAULT 0,
        engagement_efficiency INTEGER DEFAULT 0,
        geo_spread INTEGER DEFAULT 0,
        region VARCHAR(10) DEFAULT 'US',
        image_url TEXT,
        signals JSONB,
        tags JSONB,
        observed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(external_id, source)
      );
    `);

    // Create indexes for trend_record
    console.log('Creating indexes for trend_record...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trend_record_observed_at ON trend_record(observed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_trend_record_source ON trend_record(source);
      CREATE INDEX IF NOT EXISTS idx_trend_record_region ON trend_record(region);
      CREATE INDEX IF NOT EXISTS idx_trend_record_score ON trend_record(trend_score DESC NULLS LAST);
      CREATE INDEX IF NOT EXISTS idx_trend_record_velocity ON trend_record(velocity DESC NULLS LAST);
      CREATE INDEX IF NOT EXISTS idx_trend_record_acceleration ON trend_record(acceleration DESC NULLS LAST);
      CREATE INDEX IF NOT EXISTS idx_trend_record_source_time ON trend_record(source, observed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_trend_record_region_time ON trend_record(region, observed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_trend_record_score_time ON trend_record(trend_score DESC NULLS LAST, observed_at DESC);
    `);

    // Create the materialized view
    console.log('Creating mv_trends_hourly materialized view...');
    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_trends_hourly AS
      SELECT 
          date_trunc('hour', observed_at) as hour,
          source,
          COALESCE(region, 'US') as region,
          COUNT(*) as trend_count,
          AVG(COALESCE(trend_score, score)) as avg_score,
          AVG(COALESCE(velocity, 0)) as avg_velocity,
          AVG(COALESCE(acceleration, 0)) as avg_acceleration,
          MAX(COALESCE(trend_score, score)) as max_score,
          MIN(COALESCE(trend_score, score)) as min_score
      FROM trend_record
      WHERE observed_at >= NOW() - INTERVAL '24 hours'
      GROUP BY date_trunc('hour', observed_at), source, region
      ORDER BY hour DESC, avg_score DESC;
    `);

    // Create indexes for materialized view
    console.log('Creating indexes for materialized view...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mv_trends_hourly_hour ON mv_trends_hourly(hour DESC);
      CREATE INDEX IF NOT EXISTS idx_mv_trends_hourly_source ON mv_trends_hourly(source);
      CREATE INDEX IF NOT EXISTS idx_mv_trends_hourly_region ON mv_trends_hourly(region);
    `);

    console.log('✅ All tables and views created successfully!');

    // Check if we have data in trend_record
    const trendRecordCount = await client.query('SELECT COUNT(*) FROM trend_record');
    console.log(`Trend records in database: ${trendRecordCount.rows[0].count}`);

    if (parseInt(trendRecordCount.rows[0].count) === 0) {
      console.log('No trend records found. Creating sample data from ingestion...');
      
      // Get some data from our ingestion system
      const rawEvents = await client.query(`
        SELECT 
          id,
          source,
          "externalId",
          "rawData",
          "createdAt"
        FROM "RawEvent" 
        WHERE "eventType" = 'video' 
        AND processed = false
        ORDER BY "createdAt" DESC 
        LIMIT 50
      `);

      if (rawEvents.rows.length > 0) {
        console.log(`Found ${rawEvents.rows.length} raw events to process...`);
        
        // Insert sample trend records
        for (const event of rawEvents.rows) {
          const rawData = event.rawData;
          const score = Math.floor(Math.random() * 100) + 1; // Random score for demo
          const velocity = Math.floor(Math.random() * 50) + 1; // Random velocity
          
          await client.query(`
            INSERT INTO trend_record (
              id, source, external_id, topic, title, url, score, trend_score, 
              velocity, acceleration, observed_at, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            ) ON CONFLICT (external_id, source) DO UPDATE SET
              score = EXCLUDED.score,
              trend_score = EXCLUDED.trend_score,
              velocity = EXCLUDED.velocity,
              acceleration = EXCLUDED.acceleration,
              observed_at = EXCLUDED.observed_at,
              updated_at = EXCLUDED.updated_at
          `, [
            event.id,
            event.source,
            event.externalId,
            rawData.title || 'Unknown Topic',
            rawData.title || 'Unknown Title',
            rawData.url || '',
            score,
            score,
            velocity,
            Math.floor(Math.random() * 20) - 10, // Random acceleration
            event.createdAt,
            event.createdAt,
            event.createdAt
          ]);
        }
        
        console.log('✅ Sample trend records created from ingestion data!');
      } else {
        console.log('No raw events found. Creating mock data...');
        
        // Create some mock data
        const mockTopics = [
          'AI Technology', 'Cryptocurrency', 'Climate Change', 'Space Exploration',
          'Electric Vehicles', 'Gaming', 'Remote Work', 'Health Tech', 'Fintech', 'EdTech'
        ];
        
        for (let i = 0; i < 20; i++) {
          const topic = mockTopics[i % mockTopics.length];
          const score = Math.floor(Math.random() * 100) + 1;
          const velocity = Math.floor(Math.random() * 50) + 1;
          const now = new Date();
          const observedAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000); // Random time in last 24h
          
          await client.query(`
            INSERT INTO trend_record (
              id, source, external_id, topic, title, url, score, trend_score, 
              velocity, acceleration, observed_at, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            ) ON CONFLICT (external_id, source) DO NOTHING
          `, [
            `mock_${i}`,
            'youtube',
            `mock_id_${i}`,
            topic,
            `${topic} - Trending Now`,
            `https://example.com/${topic.toLowerCase().replace(' ', '-')}`,
            score,
            score,
            velocity,
            Math.floor(Math.random() * 20) - 10,
            observedAt,
            observedAt,
            observedAt
          ]);
        }
        
        console.log('✅ Mock trend records created!');
      }
    }

    // Refresh the materialized view
    console.log('Refreshing materialized view...');
    await client.query('REFRESH MATERIALIZED VIEW mv_trends_hourly');

    // Test the view
    const mvCount = await client.query('SELECT COUNT(*) FROM mv_trends_hourly');
    console.log(`Materialized view records: ${mvCount.rows[0].count}`);

    // Test the trends API query
    const trendsTest = await client.query(`
      SELECT 
        source,
        external_id,
        title,
        topic,
        url,
        score,
        velocity,
        observed_at as last_seen_at
      FROM trend_record
      WHERE observed_at >= NOW() - INTERVAL '24 hours'
      ORDER BY observed_at DESC
      LIMIT 10
    `);

    console.log(`✅ Trends API test query returned ${trendsTest.rows.length} records`);
    
    if (trendsTest.rows.length > 0) {
      console.log('Sample trend:');
      console.log(JSON.stringify(trendsTest.rows[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error setting up tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await setupAllTables();
    console.log('🎉 All tables setup completed successfully!');
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
