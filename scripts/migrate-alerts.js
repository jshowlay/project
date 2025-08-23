#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function migrateAlerts() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Starting alerts database migration...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '../sql/create_alerts_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing alerts schema migration...');
    
    // Execute the migration
    await pool.query(sqlContent);
    
    console.log('✅ Alerts database migration completed successfully!');
    
    // Verify the tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('alert_rules', 'alert_events')
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check indexes
    const indexesResult = await pool.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('alert_rules', 'alert_events')
      ORDER BY tablename, indexname
    `);
    
    console.log('🔍 Created indexes:');
    indexesResult.rows.forEach(row => {
      console.log(`  - ${row.indexname} (${row.tablename})`);
    });
    
    // Check functions
    const functionsResult = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('mark_alert_event_read', 'get_unread_alert_count')
      ORDER BY routine_name
    `);
    
    console.log('⚙️  Created functions:');
    functionsResult.rows.forEach(row => {
      console.log(`  - ${row.routine_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateAlerts().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateAlerts };
