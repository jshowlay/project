#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const { runIngestion } = require('../lib/ingest.js');

async function main() {
  try {
    console.log('🔄 Starting manual ingestion...');
    
    const result = await runIngestion();
    
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
    
  } catch (error) {
    console.error('💥 Ingestion failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
