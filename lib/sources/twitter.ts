import { z } from 'zod';
import { TrendData } from '../database';

// Twitter API v2 response schemas
const TwitterUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  profile_image_url: z.string().optional(),
  verified: z.boolean().optional(),
  followers_count: z.number().optional(),
  following_count: z.number().optional(),
  tweet_count: z.number().optional(),
});

const TwitterTweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  created_at: z.string(),
  author_id: z.string().optional(),
  public_metrics: z.object({
    retweet_count: z.number().optional(),
    reply_count: z.number().optional(),
    like_count: z.number().optional(),
    quote_count: z.number().optional(),
    impression_count: z.number().optional(),
  }).optional(),
  entities: z.object({
    urls: z.array(z.any()).optional(),
    hashtags: z.array(z.any()).optional(),
    mentions: z.array(z.any()).optional(),
  }).optional(),
  referenced_tweets: z.array(z.any()).optional(),
  lang: z.string().optional(),
});

const TwitterResponseSchema = z.object({
  data: z.array(TwitterTweetSchema).optional(),
  includes: z.object({
    users: z.array(TwitterUserSchema).optional(),
    tweets: z.array(TwitterTweetSchema).optional(),
  }).optional(),
  meta: z.object({
    result_count: z.number().optional(),
    next_token: z.string().optional(),
    newest_id: z.string().optional(),
    oldest_id: z.string().optional(),
  }).optional(),
});

export type TwitterTweet = z.infer<typeof TwitterTweetSchema>;
export type TwitterUser = z.infer<typeof TwitterUserSchema>;

export class TwitterSource {
  private bearerToken: string;
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string;
  private accessTokenSecret: string;

  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || '';
    this.apiKey = process.env.TWITTER_API_KEY || '';
    this.apiSecret = process.env.TWITTER_API_SECRET || '';
    this.accessToken = process.env.TWITTER_ACCESS_TOKEN || '';
    this.accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET || '';
    
    if (!this.bearerToken) {
      throw new Error('TWITTER_BEARER_TOKEN environment variable is required');
    }
  }

  // Get recent tweets by search query
  async searchTweets(query: string, maxResults: number = 100): Promise<TrendData[]> {
    try {
      const url = new URL('https://api.twitter.com/2/tweets/search/recent');
      url.searchParams.set('query', query);
      url.searchParams.set('max_results', maxResults.toString());
      url.searchParams.set('tweet.fields', 'created_at,public_metrics,entities,lang,author_id');
      url.searchParams.set('user.fields', 'name,username,profile_image_url,verified,followers_count');
      url.searchParams.set('expansions', 'author_id');
      url.searchParams.set('exclude', 'retweets');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validatedData = TwitterResponseSchema.parse(data);

      if (!validatedData.data) {
        return [];
      }

      // Create a map of users for easy lookup
      const usersMap = new Map<string, TwitterUser>();
      if (validatedData.includes?.users) {
        validatedData.includes.users.forEach(user => {
          usersMap.set(user.id, user);
        });
      }

      return validatedData.data.map(tweet => 
        this.transformTweet(tweet, usersMap.get(tweet.author_id || ''))
      );
    } catch (error) {
      console.error(`Error searching Twitter tweets for query "${query}":`, error);
      return [];
    }
  }

  // Get trending topics
  async getTrendingTopics(woeid: number = 1): Promise<TrendData[]> {
    try {
      // Note: Twitter API v2 doesn't have a direct trending topics endpoint
      // We'll use search with popular hashtags and keywords
      const trendingQueries = [
        '#breaking',
        '#news',
        '#technology',
        '#sports',
        '#entertainment',
        '#politics',
        '#business',
        '#science',
        '#health',
        '#climate',
      ];

      const allTweets: TrendData[] = [];
      
      for (const query of trendingQueries) {
        try {
          const tweets = await this.searchTweets(query, 10);
          allTweets.push(...tweets);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to fetch tweets for query ${query}:`, error);
        }
      }

      return allTweets;
    } catch (error) {
      console.error('Error fetching Twitter trending topics:', error);
      return [];
    }
  }

  // Get tweets from specific users
  async getUserTweets(username: string, maxResults: number = 100): Promise<TrendData[]> {
    try {
      // First get user ID
      const userUrl = new URL(`https://api.twitter.com/2/users/by/username/${username}`);
      userUrl.searchParams.set('user.fields', 'id,name,username,profile_image_url,verified,followers_count');

      const userResponse = await fetch(userUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Accept': 'application/json',
        },
      });

      if (!userResponse.ok) {
        throw new Error(`Twitter API error: ${userResponse.status} ${userResponse.statusText}`);
      }

      const userData = await userResponse.json();
      const userId = userData.data?.id;

      if (!userId) {
        throw new Error(`User ${username} not found`);
      }

      // Get user's tweets
      const tweetsUrl = new URL(`https://api.twitter.com/2/users/${userId}/tweets`);
      tweetsUrl.searchParams.set('max_results', maxResults.toString());
      tweetsUrl.searchParams.set('tweet.fields', 'created_at,public_metrics,entities,lang');
      tweetsUrl.searchParams.set('exclude', 'retweets,replies');

      const tweetsResponse = await fetch(tweetsUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Accept': 'application/json',
        },
      });

      if (!tweetsResponse.ok) {
        throw new Error(`Twitter API error: ${tweetsResponse.status} ${tweetsResponse.statusText}`);
      }

      const tweetsData = await tweetsResponse.json();
      const validatedData = TwitterResponseSchema.parse(tweetsData);

      if (!validatedData.data) {
        return [];
      }

      return validatedData.data.map(tweet => 
        this.transformTweet(tweet, { id: userId, name: username, username })
      );
    } catch (error) {
      console.error(`Error fetching tweets from user ${username}:`, error);
      return [];
    }
  }

  // Get tweets from multiple users
  async getMultipleUserTweets(usernames: string[]): Promise<TrendData[]> {
    const allTweets: TrendData[] = [];
    
    for (const username of usernames) {
      try {
        console.log(`Fetching tweets from user: ${username}`);
        const tweets = await this.getUserTweets(username, 20);
        allTweets.push(...tweets);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to fetch tweets from user ${username}:`, error);
      }
    }

    return allTweets;
  }

  // Transform Twitter tweet to TrendData format
  private transformTweet(tweet: TwitterTweet, user?: TwitterUser): TrendData {
    const publishedAt = new Date(tweet.created_at);
    const metrics = tweet.public_metrics || {};
    
    // Calculate score based on engagement metrics
    const retweetScore = (metrics.retweet_count || 0) * 10;
    const likeScore = (metrics.like_count || 0) * 5;
    const replyScore = (metrics.reply_count || 0) * 15;
    const quoteScore = (metrics.quote_count || 0) * 20;
    const impressionScore = Math.min((metrics.impression_count || 0) / 1000, 50);
    
    const totalScore = retweetScore + likeScore + replyScore + quoteScore + impressionScore;

    // Extract hashtags and mentions
    const hashtags = tweet.entities?.hashtags?.map(h => h.tag) || [];
    const mentions = tweet.entities?.mentions?.map(m => m.username) || [];
    const urls = tweet.entities?.urls?.map(u => u.expanded_url || u.url) || [];

    return {
      source: 'twitter',
      title: tweet.text.substring(0, 100) + (tweet.text.length > 100 ? '...' : ''),
      description: tweet.text,
      url: `https://twitter.com/${user?.username || 'unknown'}/status/${tweet.id}`,
      published_at: publishedAt,
      region: 'global', // Twitter is global
      category: this.getCategoryFromTweet(tweet.text, hashtags),
      score: Math.max(totalScore, 1),
      created_at: publishedAt,
      updated_at: new Date(),
      metadata: {
        tweetId: tweet.id,
        authorId: tweet.author_id,
        authorName: user?.name,
        authorUsername: user?.username,
        authorVerified: user?.verified,
        authorFollowers: user?.followers_count,
        retweetCount: metrics.retweet_count,
        likeCount: metrics.like_count,
        replyCount: metrics.reply_count,
        quoteCount: metrics.quote_count,
        impressionCount: metrics.impression_count,
        hashtags,
        mentions,
        urls,
        language: tweet.lang,
        referencedTweets: tweet.referenced_tweets,
      },
    };
  }

  // Get category from tweet content and hashtags
  private getCategoryFromTweet(text: string, hashtags: string[]): string {
    const textLower = text.toLowerCase();
    const hashtagsLower = hashtags.map(h => h.toLowerCase());

    // Check for category keywords in text and hashtags
    const categoryKeywords: Record<string, string[]> = {
      'news': ['breaking', 'news', 'update', 'alert', 'report'],
      'politics': ['politics', 'election', 'vote', 'government', 'congress', 'senate'],
      'technology': ['tech', 'technology', 'ai', 'artificial intelligence', 'software', 'programming'],
      'sports': ['sports', 'football', 'basketball', 'soccer', 'baseball', 'nba', 'nfl'],
      'entertainment': ['movie', 'film', 'music', 'celebrity', 'hollywood', 'entertainment'],
      'business': ['business', 'economy', 'finance', 'stock', 'market', 'company'],
      'science': ['science', 'research', 'study', 'discovery', 'space', 'climate'],
      'health': ['health', 'medical', 'covid', 'vaccine', 'hospital', 'doctor'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (textLower.includes(keyword) || hashtagsLower.includes(keyword)) {
          return category;
        }
      }
    }

    return 'social';
  }

  // Get tweets by hashtag
  async getTweetsByHashtag(hashtag: string, maxResults: number = 100): Promise<TrendData[]> {
    const query = `#${hashtag.replace('#', '')}`;
    return this.searchTweets(query, maxResults);
  }

  // Get tweets by multiple hashtags
  async getTweetsByHashtags(hashtags: string[]): Promise<TrendData[]> {
    const allTweets: TrendData[] = [];
    
    for (const hashtag of hashtags) {
      try {
        const tweets = await this.getTweetsByHashtag(hashtag, 20);
        allTweets.push(...tweets);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to fetch tweets for hashtag ${hashtag}:`, error);
      }
    }

    return allTweets;
  }

  // Get popular tweets (high engagement)
  async getPopularTweets(minLikes: number = 1000): Promise<TrendData[]> {
    // Search for tweets with high engagement
    const queries = [
      'breaking news',
      'viral',
      'trending',
      'popular',
    ];

    const allTweets: TrendData[] = [];
    
    for (const query of queries) {
      try {
        const tweets = await this.searchTweets(query, 25);
        // Filter by minimum likes
        const popularTweets = tweets.filter(tweet => 
          (tweet.metadata?.likeCount || 0) >= minLikes
        );
        allTweets.push(...popularTweets);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to fetch popular tweets for query ${query}:`, error);
      }
    }

    return allTweets;
  }
}

export const twitterSource = new TwitterSource();
