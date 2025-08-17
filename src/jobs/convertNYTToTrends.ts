import 'dotenv/config';
import { pool } from '../lib/db';
import { prisma } from '../server/db';

async function convertNYTToTrends() {
  console.log('Converting NYTimes content to trends...');
  
  // Get recent NYTimes content
  const result = await pool.query(`
    SELECT 
      id,
      title,
      abstract,
      section,
      tags,
      published_at,
      editorial,
      popularity,
      raw,
      channel
    FROM content_items 
    WHERE source = 'nytimes' 
      AND published_at >= NOW() - INTERVAL '7 days'
    ORDER BY published_at DESC
  `);

  console.log(`Found ${result.rows.length} NYTimes articles`);

  let converted = 0;
  for (const row of result.rows) {
    try {
      // Calculate score based on editorial status and recency
      let score = 50; // base score
      if (row.editorial) score += 20; // editorial content gets boost
      
      // Channel boost
      if (row.channel === 'topstories') score += 10;
      if (row.channel === 'mostpopular') score += 15;
      
      // Recency boost (newer = higher score)
      const hoursAgo = (Date.now() - new Date(row.published_at).getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 24) score += 15;
      else if (hoursAgo < 72) score += 10;
      
      // Popularity boost if available
      if (row.popularity) {
        const pop = row.popularity;
        if (pop.list === 'viewed' && pop.period <= 1) score += 10;
        if (pop.list === 'shared' && pop.period <= 1) score += 15;
        if (pop.list === 'emailed' && pop.period <= 1) score += 5;
      }
      
      // Cap score at 100
      score = Math.min(100, score);

      // Create observed bucket (daily bucket)
      const observedAt = new Date(row.published_at);
      const observedBucket = new Date(
        Math.floor(observedAt.getTime() / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000
      );

      // Upsert to TrendRecord
      await prisma.trendRecord.upsert({
        where: {
          source_topic_observedBucket: {
            source: 'nytimes',
            topic: row.title || row.abstract || 'NYTimes Article',
            observedBucket
          }
        },
        update: {
          score,
          url: row.raw?.url || null,
          tags: row.tags || [],
          raw: row.raw,
          observedAt,
          language: 'en'
        },
        create: {
          source: 'nytimes',
          topic: row.title || row.abstract || 'NYTimes Article',
          score,
          url: row.raw?.url || null,
          tags: row.tags || [],
          raw: row.raw,
          observedAt,
          observedBucket,
          language: 'en'
        }
      });

      converted++;
    } catch (error) {
      console.error(`Failed to convert article ${row.id}:`, error);
    }
  }

  console.log(`Successfully converted ${converted} articles to trends`);
  await pool.end();
}

convertNYTToTrends().catch(console.error);
