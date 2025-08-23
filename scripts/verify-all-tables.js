const { Pool } = require('pg');
require('dotenv').config();

async function verifyAllTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Verifying all database tables...\n');
    
    // Check all required tables
    const requiredTables = [
      'trend_record',
      'mv_trends_hourly', 
      'saved_trends',
      'alert_rules',
      'alert_events',
      'AlertDelivery',
      'IngestCursor',
      'RawEvent',
      'IngestDeadLetter'
    ];
    
    const results = await Promise.all(
      requiredTables.map(async (tableName) => {
        // Check both tables and materialized views
        const [tableResult, viewResult] = await Promise.all([
          pool.query(`
            SELECT 
              table_name,
              (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public' AND table_name = $1
          `, [tableName]),
          pool.query(`
            SELECT 
              matviewname as table_name,
              (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = mv.matviewname) as column_count
            FROM pg_matviews mv
            WHERE schemaname = 'public' AND matviewname = $1
          `, [tableName])
        ]);
        
        const result = tableResult.rows.length > 0 ? tableResult : viewResult;
        
        return {
          table: tableName,
          exists: result.rows.length > 0,
          columns: result.rows.length > 0 ? result.rows[0].column_count : 0
        };
      })
    );
    
    // Display results
    console.log('📊 Table Status:');
    console.log('─'.repeat(60));
    
    let allGood = true;
    results.forEach(({ table, exists, columns }) => {
      const status = exists ? '✅' : '❌';
      const info = exists ? `(${columns} columns)` : 'MISSING';
      console.log(`${status} ${table.padEnd(25)} ${info}`);
      if (!exists) allGood = false;
    });
    
    console.log('\n' + '─'.repeat(60));
    
    if (allGood) {
      console.log('🎉 All tables exist and are properly configured!');
      
      // Check data counts
      console.log('\n📈 Data Counts:');
      console.log('─'.repeat(40));
      
      const dataCounts = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM trend_record'),
        pool.query('SELECT COUNT(*) as count FROM saved_trends'),
        pool.query('SELECT COUNT(*) as count FROM alert_rules'),
        pool.query('SELECT COUNT(*) as count FROM "RawEvent"')
      ]);
      
      console.log(`📊 Trend Records: ${dataCounts[0].rows[0].count}`);
      console.log(`💾 Saved Trends: ${dataCounts[1].rows[0].count}`);
      console.log(`🔔 Alert Rules: ${dataCounts[2].rows[0].count}`);
      console.log(`📥 Raw Events: ${dataCounts[3].rows[0].count}`);
      
    } else {
      console.log('⚠️  Some tables are missing. Run setup scripts to create them.');
      console.log('\nSuggested actions:');
      console.log('1. node scripts/setup-all-tables.js (for trend tables)');
      console.log('2. node scripts/setup-alerts-tables.js (for alerts tables)');
      console.log('3. node scripts/setup-ingestion-tables.js (for ingestion tables)');
    }
    
  } catch (error) {
    console.error('❌ Error verifying tables:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  verifyAllTables()
    .then(() => {
      console.log('\n✨ Verification complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyAllTables };
