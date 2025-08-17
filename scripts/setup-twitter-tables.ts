import 'dotenv/config';
import { pool } from '../src/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function setupTwitterTables() {
  try {
    console.log('Setting up Twitter database tables...');
    
    const schemaPath = join(__dirname, '../ingestion/twitter/schema.sql');
    const sql = readFileSync(schemaPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Twitter tables created successfully!');
    
    // Check if tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('twitter_authors', 'twitter_tweets', 'normalized_content', 'ingestion_cursors')
      ORDER BY table_name
    `);
    
    console.log('Created tables:', result.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Error setting up Twitter tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

setupTwitterTables().catch(console.error);


