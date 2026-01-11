import { Adapter, FetchOptions } from './types';
import { TrendItem } from '../types/trends';
import { query } from '../lib/db';

export const twitterAdapter: Adapter = {
  SOURCE_ID: 'twitter',
  
  async fetchTrends(opts?: FetchOptions): Promise<TrendItem[]> {
    const limit = opts?.limit || 50;
    
    const result = await query(`
      SELECT 
        external_id as id,
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
      ORDER BY 
        (metrics->>'like_count')::int DESC NULLS LAST,
        (metrics->>'retweet_count')::int DESC NULLS LAST,
        published_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map((row: any) => ({
      id: row.id,
      source: 'twitter' as const,
      topic: row.content || 'Twitter Post',
      score: calculateTwitterScore(row.metrics),
      delta24h: null, // Could be calculated from historical data
      url: row.url,
      region: null,
      tags: row.tags || [],
      raw: row.raw,
      observedAt: new Date(row.published_at),
      language: 'en',
      imageUrl: null // Could extract from media entities in raw data
    }));
  }
};

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


