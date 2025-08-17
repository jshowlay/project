import 'dotenv/config';
import { pool } from '../src/lib/db';
import { prisma } from '../src/server/db';

function calculateTwitterScore(metrics: any): number {
  if (!metrics) return 50;
  
  let score = 50;
  
  // Engagement-based scoring
  const likeCount = parseInt(metrics.like_count) || 0;
  const retweetCount = parseInt(metrics.retweet_count) || 0;
  const replyCount = parseInt(metrics.reply_count) || 0;
  const quoteCount = parseInt(metrics.quote_count) || 0;
  
  // Weight different engagement types
  score += Math.min(likeCount * 0.1, 20);        // Max 20 points from likes
  score += Math.min(retweetCount * 0.5, 15);     // Max 15 points from retweets
  score += Math.min(replyCount * 0.3, 10);       // Max 10 points from replies
  score += Math.min(quoteCount * 0.4, 5);        // Max 5 points from quotes
  
  return Math.min(100, Math.max(0, score));
}

async function convertTwitterToTrends() {
  try {
    console.log('Converting Twitter content to trends...');
    
    const result = await pool.query(`
      SELECT 
        external_id,
        author_username,
        author_id,
        content,
        url,
        published_at,
        metrics,
        tags,
        raw
      FROM normalized_content 
      WHERE source = 'twitter' 
        AND published_at >= NOW() - INTERVAL '7 days'
      ORDER BY published_at DESC
    `);

    console.log(`Found ${result.rows.length} Twitter posts`);

    let converted = 0;
    for (const row of result.rows) {
      try {
        const score = calculateTwitterScore(row.metrics);
        const observedAt = new Date(row.published_at);
        const observedBucket = new Date(
          Math.floor(observedAt.getTime() / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000
        );

        await prisma.trendRecord.upsert({
          where: {
            source_topic_observedBucket: {
              source: 'twitter',
              topic: row.content || 'Twitter Post',
              observedBucket
            }
          },
          update: {
            score,
            url: row.url || null,
            tags: row.tags || [],
            raw: row.raw,
            observedAt,
            language: 'en'
          },
          create: {
            source: 'twitter',
            topic: row.content || 'Twitter Post',
            score,
            url: row.url || null,
            tags: row.tags || [],
            raw: row.raw,
            observedAt,
            observedBucket,
            language: 'en'
          }
        });

        converted++;
      } catch (error) {
        console.error(`Failed to convert Twitter post ${row.external_id}:`, error);
      }
    }

    console.log(`Successfully converted ${converted} Twitter posts to trends`);
    
  } catch (error) {
    console.error('Error converting Twitter to trends:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

convertTwitterToTrends().catch(console.error);


