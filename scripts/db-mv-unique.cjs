#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_SIZE || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
});

async function createUniqueIndex() {
  const client = await pool.connect();

  try {
    console.log('🔄 Creating unique index for materialized view...');

    // Ensure unique index for CONCURRENTLY refresh
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_mv_trends_hourly 
      ON mv_trends_hourly (external_id, source)
    `);

    console.log('✅ Unique index created successfully!');

    // Test the index
    const result = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'mv_trends_hourly' 
      AND indexname = 'ux_mv_trends_hourly'
    `);

    if (result.rows.length > 0) {
      console.log('📊 Index details:', result.rows[0]);
    }

    return { success: true };

  } catch (error) {
    console.error('❌ Failed to create unique index:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  createUniqueIndex()
    .then(() => {
      console.log('🎉 Unique index creation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Unique index creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createUniqueIndex };
