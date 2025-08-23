#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Neon friendly
  });

  try {
    console.log('🔄 Running saved trends migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/20250820_add_saved_trends/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    const client = await pool.connect();
    await client.query(migrationSQL);
    client.release();
    
    console.log('✅ Saved trends migration completed successfully!');
    console.log('📋 Created table: saved_trends');
    console.log('📋 Created indexes and constraints');
    console.log('📋 Created triggers for updated_at');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
