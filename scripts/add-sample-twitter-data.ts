import 'dotenv/config';
import { pool } from '../src/lib/db';

async function addSampleTwitterData() {
  try {
    console.log('Adding sample Twitter data...');
    
    // Add sample author
    await pool.query(`
      INSERT INTO twitter_authors (id, username, name, created_at, profile_image_url, verified, followers_count, following_count, tweet_count, listed_count, raw)
      VALUES (123456789, 'trenderai', 'TrenderAI', '2023-01-01T00:00:00Z', 'https://example.com/avatar.jpg', true, 10000, 500, 1000, 100, '{"id": "123456789", "username": "trenderai"}')
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Add sample tweets
    const sampleTweets = [
      {
        id: '1111111111111111111',
        author_id: '123456789',
        text: '🚀 Exciting news! Our AI trend analysis platform just hit 10k users! The future of content creation is here. #AI #Trends #ContentCreation',
        lang: 'en',
        like_count: 150,
        retweet_count: 45,
        reply_count: 12,
        quote_count: 8,
        bookmark_count: 25,
        impression_count: 5000,
        conversation_id: '1111111111111111111',
        in_reply_to_user_id: null,
        possibly_sensitive: false,
        source: 'Twitter for iPhone',
        created_at: '2025-08-16T10:00:00Z',
        keywords: ['@trenderai'],
        raw: { id: '1111111111111111111', text: 'Sample tweet 1' }
      },
      {
        id: '2222222222222222222',
        author_id: '123456789',
        text: '🔥 Breaking: New trend detected in the AI space! Large language models are evolving faster than ever. What do you think the next breakthrough will be? #AI #LLM #Innovation',
        lang: 'en',
        like_count: 89,
        retweet_count: 23,
        reply_count: 7,
        quote_count: 4,
        bookmark_count: 15,
        impression_count: 3200,
        conversation_id: '2222222222222222222',
        in_reply_to_user_id: null,
        possibly_sensitive: false,
        source: 'Twitter Web App',
        created_at: '2025-08-16T09:30:00Z',
        keywords: ['@trenderai'],
        raw: { id: '2222222222222222222', text: 'Sample tweet 2' }
      },
      {
        id: '3333333333333333333',
        author_id: '123456789',
        text: '📊 Our latest analysis shows that crypto trends are shifting towards DeFi protocols. Bitcoin dominance is decreasing while altcoins are gaining momentum. #Crypto #DeFi #Bitcoin',
        lang: 'en',
        like_count: 67,
        retweet_count: 18,
        reply_count: 5,
        quote_count: 3,
        bookmark_count: 12,
        impression_count: 2800,
        conversation_id: '3333333333333333333',
        in_reply_to_user_id: null,
        possibly_sensitive: false,
        source: 'Twitter for Android',
        created_at: '2025-08-16T08:45:00Z',
        keywords: ['@trenderai'],
        raw: { id: '3333333333333333333', text: 'Sample tweet 3' }
      }
    ];
    
    for (const tweet of sampleTweets) {
      await pool.query(`
        INSERT INTO twitter_tweets (
          id, author_id, text, lang, like_count, retweet_count, reply_count, quote_count,
          bookmark_count, impression_count, conversation_id, in_reply_to_user_id,
          possibly_sensitive, source, created_at, keywords, raw
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING
      `, [
        parseInt(tweet.id),
        parseInt(tweet.author_id),
        tweet.text,
        tweet.lang,
        tweet.like_count,
        tweet.retweet_count,
        tweet.reply_count,
        tweet.quote_count,
        tweet.bookmark_count,
        tweet.impression_count,
        parseInt(tweet.conversation_id),
        tweet.in_reply_to_user_id ? parseInt(tweet.in_reply_to_user_id) : null,
        tweet.possibly_sensitive,
        tweet.source,
        tweet.created_at,
        tweet.keywords,
        JSON.stringify(tweet.raw)
      ]);
      
      // Add to normalized_content
      const url = `https://twitter.com/trenderai/status/${tweet.id}`;
      const metrics = {
        like_count: tweet.like_count,
        retweet_count: tweet.retweet_count,
        reply_count: tweet.reply_count,
        quote_count: tweet.quote_count,
        bookmark_count: tweet.bookmark_count,
        impression_count: tweet.impression_count
      };
      
      await pool.query(`
        INSERT INTO normalized_content (
          source, external_id, author_username, author_id, title, content, url,
          published_at, metrics, tags, raw
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (source, external_id) DO NOTHING
      `, [
        'twitter',
        tweet.id,
        'trenderai',
        tweet.author_id,
        null,
        tweet.text,
        url,
        tweet.created_at,
        JSON.stringify(metrics),
        ['twitter', 'trends', 'ai'],
        JSON.stringify(tweet.raw)
      ]);
    }
    
    console.log('✅ Sample Twitter data added successfully!');
    
    // Check the data
    const result = await pool.query(`
      SELECT COUNT(*) as tweet_count FROM twitter_tweets
    `);
    console.log(`Total tweets: ${result.rows[0].tweet_count}`);
    
    const normalizedResult = await pool.query(`
      SELECT COUNT(*) as normalized_count FROM normalized_content WHERE source = 'twitter'
    `);
    console.log(`Total normalized content: ${normalizedResult.rows[0].normalized_count}`);
    
  } catch (error) {
    console.error('❌ Error adding sample Twitter data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addSampleTwitterData().catch(console.error);


