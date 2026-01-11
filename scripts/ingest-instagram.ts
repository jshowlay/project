#!/usr/bin/env tsx

import 'dotenv/config';
import { ingestAll } from '../src/server/ingest';
import { logger } from '../lib/logger';

async function ingestInstagramData() {
  console.log('📸 Starting Instagram data ingestion...\n');
  const startTime = Date.now();

  try {
    // Check if Instagram is configured
    const hasToken = process.env.IG_LONG_LIVED_TOKEN;
    const hasUserId = process.env.IG_USER_ID;
    const hasAppId = process.env.IG_APP_ID;
    const hasAppSecret = process.env.IG_APP_SECRET;

    if (!hasToken || !hasUserId || !hasAppId || !hasAppSecret) {
      console.log('❌ Instagram is not fully configured.');
      console.log('\nRequired environment variables:');
      console.log('  - IG_APP_ID');
      console.log('  - IG_APP_SECRET');
      console.log('  - IG_USER_ID');
      console.log('  - IG_LONG_LIVED_TOKEN');
      console.log('\nOptional:');
      console.log('  - IG_DEFAULT_HASHTAGS (default: ai,tech,startups,bitcoin)');
      console.log('\nSee README_INSTAGRAM.md for setup instructions.');
      process.exit(1);
    }

    console.log('✅ Instagram configuration found');
    console.log(`   User ID: ${hasUserId}`);
    console.log(`   Hashtags: ${process.env.IG_DEFAULT_HASHTAGS || 'ai,tech,startups,bitcoin'}`);
    console.log('\n🔄 Running ingestion...\n');

    // Run the full ingestion which includes Instagram
    const result = await ingestAll();
    const duration = Date.now() - startTime;

    console.log('\n📊 Ingestion Results:');
    console.log(`   ✅ Items inserted: ${result.inserted}`);
    console.log(`   📡 Sources processed: ${result.sources.length}`);
    console.log(`   ⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`\n   Sources: ${result.sources.join(', ')}`);

    if (result.sources.includes('instagram')) {
      console.log('\n🎉 Instagram data successfully ingested!');
      
      // Check how many Instagram items were inserted
      const { prisma } = await import('../src/server/db');
      const instagramCount = await prisma.trendRecord.count({
        where: {
          source: 'instagram',
          observedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });
      
      console.log(`   📸 Instagram trends in database: ${instagramCount}`);
    } else {
      console.log('\n⚠️  Instagram was not processed. This might mean:');
      console.log('   - The access token has expired');
      console.log('   - API rate limits were hit');
      console.log('   - There was an error fetching data');
      console.log('\n💡 To refresh your token, see README_INSTAGRAM.md');
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('\n❌ Error during Instagram ingestion:', error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && error.message.includes('expired')) {
      console.log('\n💡 Your Instagram access token has expired.');
      console.log('   You need to refresh it. See README_INSTAGRAM.md for instructions.');
    }
    
    logger.error({
      msg: 'Failed to ingest Instagram data',
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    throw error;
  }
}

if (require.main === module) {
  ingestInstagramData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default ingestInstagramData;
