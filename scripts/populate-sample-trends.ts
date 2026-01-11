#!/usr/bin/env tsx

import 'dotenv/config';
import { prisma } from '../src/server/db';

// Sample Google Trends data
const sampleTrends = [
  {
    source: 'google_trends',
    topic: 'artificial intelligence',
    score: 85,
    delta24h: 12.5,
    region: 'US',
    tags: ['ai', 'technology', 'trending'],
    url: 'https://trends.google.com/trends/explore?q=artificial+intelligence&geo=US',
  },
  {
    source: 'google_trends',
    topic: 'chatgpt',
    score: 95,
    delta24h: 15.7,
    region: 'US',
    tags: ['ai', 'chatbot', 'openai'],
    url: 'https://trends.google.com/trends/explore?q=chatgpt&geo=US',
  },
  {
    source: 'google_trends',
    topic: 'machine learning',
    score: 72,
    delta24h: 8.3,
    region: 'US',
    tags: ['ml', 'ai', 'technology'],
    url: 'https://trends.google.com/trends/explore?q=machine+learning&geo=US',
  },
  {
    source: 'google_trends',
    topic: 'blockchain',
    score: 45,
    delta24h: -5.2,
    region: 'US',
    tags: ['crypto', 'technology', 'web3'],
    url: 'https://trends.google.com/trends/explore?q=blockchain&geo=US',
  },
  {
    source: 'google_trends',
    topic: 'metaverse',
    score: 38,
    delta24h: -12.1,
    region: 'US',
    tags: ['vr', 'ar', 'virtual-reality'],
    url: 'https://trends.google.com/trends/explore?q=metaverse&geo=US',
  },
  {
    source: 'reddit',
    topic: 'AI agents are getting smarter',
    score: 78,
    delta24h: 22.3,
    region: 'US',
    tags: ['ai', 'reddit', 'technology'],
    url: 'https://reddit.com/r/technology',
  },
  {
    source: 'youtube',
    topic: 'Latest AI Developments 2024',
    score: 88,
    delta24h: 18.5,
    region: 'US',
    tags: ['ai', 'youtube', 'tech'],
    url: 'https://youtube.com/watch?v=example',
  },
  {
    source: 'reddit',
    topic: 'New JavaScript framework released',
    score: 65,
    delta24h: 14.2,
    region: 'US',
    tags: ['javascript', 'programming', 'reddit'],
    url: 'https://reddit.com/r/programming',
  },
];

async function populateSampleTrends() {
  console.log('🔄 Populating sample trends...\n');

  let created = 0;
  let updated = 0;

  for (const trend of sampleTrends) {
    try {
      const observedAt = new Date();
      const observedBucket = new Date(Math.floor(observedAt.getTime() / 3600000) * 3600000);

      const result = await prisma.trendRecord.upsert({
        where: {
          source_topic_observedBucket: {
            source: trend.source,
            topic: trend.topic,
            observedBucket,
          },
        },
        create: {
          source: trend.source,
          topic: trend.topic,
          score: trend.score,
          delta24h: trend.delta24h,
          url: trend.url || null,
          region: trend.region || null,
          tags: trend.tags || [],
          observedAt,
          observedBucket,
          language: 'en',
        },
        update: {
          score: trend.score,
          delta24h: trend.delta24h,
          url: trend.url || null,
          tags: trend.tags || [],
          observedAt,
        },
      });

      if (result.createdAt.getTime() === result.updatedAt?.getTime()) {
        created++;
      } else {
        updated++;
      }

      console.log(`✅ ${trend.source}: ${trend.topic.substring(0, 50)}`);
    } catch (error) {
      console.error(`❌ Error inserting ${trend.topic}:`, error instanceof Error ? error.message : String(error));
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Created: ${created}`);
  console.log(`   - Updated: ${updated}`);
  console.log(`   - Total: ${sampleTrends.length}`);

  // Verify data
  const count = await prisma.trendRecord.count({
    where: {
      observedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  console.log(`\n✅ Total recent trends in database: ${count}`);
}

if (require.main === module) {
  populateSampleTrends()
    .then(() => {
      console.log('\n🎉 Sample trends populated successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error populating trends:', error);
      process.exit(1);
    });
}

export default populateSampleTrends;
