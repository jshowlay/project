#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_SIZE || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
});

async function refreshMaterializedView() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Refreshing materialized view...');
    const startTime = Date.now();
    
    // Refresh the materialized view
    await client.query('SELECT refresh_trends_mv()');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Get updated counts
    const result = await client.query('SELECT COUNT(*) as count FROM mv_trends_hourly');
    const count = result.rows[0].count;
    
    console.log(`✅ Materialized view refreshed successfully!`);
    console.log(`📊 Total records: ${count}`);
    console.log(`⏱️  Refresh duration: ${duration}ms`);
    
    return { success: true, count, duration };
    
  } catch (error) {
    console.error('❌ Error refreshing materialized view:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  refreshMaterializedView()
    .then((result) => {
      console.log('🎉 Materialized view refresh complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Materialized view refresh failed:', error);
      process.exit(1);
    });
}

module.exports = { refreshMaterializedView };
