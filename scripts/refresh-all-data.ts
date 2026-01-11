#!/usr/bin/env tsx

import 'dotenv/config';
import { ingestAll } from '../src/server/ingest';
import { logger } from '../lib/logger';

async function refreshAllData() {
  console.log('🔄 Starting fresh data ingestion from all sources...\n');
  const startTime = Date.now();

  try {
    const result = await ingestAll();
    const duration = Date.now() - startTime;

    console.log('\n📊 Ingestion Results:');
    console.log(`   ✅ Items inserted: ${result.inserted}`);
    console.log(`   📡 Sources processed: ${result.sources.length}`);
    console.log(`   ⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`\n   Sources: ${result.sources.join(', ')}`);

    if (result.inserted > 0) {
      console.log('\n🎉 Successfully refreshed all data!');
      console.log(`   Your explore tab should now show ${result.inserted} fresh trends.`);
    } else {
      console.log('\n⚠️  No items were inserted. This might mean:');
      console.log('   - No data sources are configured/enabled');
      console.log('   - API keys are missing or invalid');
      console.log('   - Sources returned no data');
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('\n❌ Error during ingestion:', error instanceof Error ? error.message : String(error));
    logger.error({
      msg: 'Failed to refresh data',
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    throw error;
  }
}

if (require.main === module) {
  refreshAllData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default refreshAllData;
