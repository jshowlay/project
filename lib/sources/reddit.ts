import Parser from 'rss-parser';
import { z } from 'zod';
import { TrendData } from '../database';

// RSS Parser instance
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'TrenderAI/1.0 (Trend Aggregation Bot)',
  },
});

// Reddit RSS item schema
const RedditItemSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  pubDate: z.string(),
  content: z.string().optional(),
  contentSnippet: z.string().optional(),
  categories: z.array(z.string()).optional(),
  author: z.string().optional(),
  guid: z.string().optional(),
});

export type RedditItem = z.infer<typeof RedditItemSchema>;

export class RedditSource {
  private feeds: string[];

  constructor() {
    this.feeds = (process.env.REDDIT_RSS_FEEDS || '').split(',').filter(Boolean);
    
    if (this.feeds.length === 0) {
      this.feeds = [
        'https://www.reddit.com/r/worldnews/.rss',
        'https://www.reddit.com/r/technology/.rss',
        'https://www.reddit.com/r/science/.rss',
        'https://www.reddit.com/r/entertainment/.rss',
        'https://www.reddit.com/r/sports/.rss',
      ];
    }
  }

  // Get posts from a single RSS feed
  async getFeedPosts(feedUrl: string, limit: number = 25): Promise<TrendData[]> {
    try {
      console.log(`Fetching Reddit RSS feed: ${feedUrl}`);
      
      const feed = await parser.parseURL(feedUrl);
      const items = feed.items.slice(0, limit);

      return items.map(item => this.transformItem(item, feedUrl));
    } catch (error) {
      console.error(`Error fetching Reddit RSS feed ${feedUrl}:`, error);
      return [];
    }
  }

  // Get posts from all configured feeds
  async getAllFeedPosts(): Promise<TrendData[]> {
    const allPosts: TrendData[] = [];
    
    for (const feedUrl of this.feeds) {
      try {
        const posts = await this.getFeedPosts(feedUrl, 15); // Limit per feed
        allPosts.push(...posts);
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to fetch feed ${feedUrl}:`, error);
      }
    }

    return allPosts;
  }

  // Get posts from specific subreddit
  async getSubredditPosts(subreddit: string, limit: number = 25): Promise<TrendData[]> {
    const feedUrl = `https://www.reddit.com/r/${subreddit}/.rss`;
    return this.getFeedPosts(feedUrl, limit);
  }

  // Get posts from multiple subreddits
  async getMultipleSubreddits(subreddits: string[]): Promise<TrendData[]> {
    const allPosts: TrendData[] = [];
    
    for (const subreddit of subreddits) {
      try {
        const posts = await this.getSubredditPosts(subreddit, 10); // Limit per subreddit
        allPosts.push(...posts);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to fetch subreddit r/${subreddit}:`, error);
      }
    }

    return allPosts;
  }

  // Transform Reddit RSS item to TrendData format
  private transformItem(item: any, feedUrl: string): TrendData {
    try {
      const validatedItem = RedditItemSchema.parse(item);
      
      // Extract subreddit from feed URL
      const subredditMatch = feedUrl.match(/\/r\/([^\/]+)\//);
      const subreddit = subredditMatch ? subredditMatch[1] : 'reddit';
      
      // Calculate score based on post age and content length
      const publishedAt = new Date(validatedItem.pubDate);
      const ageInHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
      const contentLength = validatedItem.content?.length || validatedItem.contentSnippet?.length || 0;
      
      // Score calculation: newer posts get higher scores, longer content gets bonus
      const timeScore = Math.max(1, 100 - Math.floor(ageInHours));
      const contentScore = Math.min(50, Math.floor(contentLength / 100));
      const score = timeScore + contentScore;

      return {
        source: 'reddit',
        title: validatedItem.title,
        description: validatedItem.contentSnippet || validatedItem.content?.substring(0, 500) || '',
        url: validatedItem.link,
        published_at: publishedAt,
        region: 'global', // Reddit is global
        category: this.getCategoryFromSubreddit(subreddit),
        score: Math.max(score, 1),
        created_at: publishedAt,
        updated_at: new Date(),
        metadata: {
          subreddit,
          author: validatedItem.author,
          guid: validatedItem.guid,
          categories: validatedItem.categories,
          contentLength,
          ageInHours,
        },
      };
    } catch (error) {
      console.error('Error transforming Reddit item:', error);
      // Return a minimal valid item
      return {
        source: 'reddit',
        title: item.title || 'Unknown Post',
        description: item.contentSnippet || '',
        url: item.link || '',
        published_at: new Date(item.pubDate || Date.now()),
        region: 'global',
        category: 'other',
        score: 1,
        metadata: { error: 'Transformation failed' },
      };
    }
  }

  // Get category from subreddit name
  private getCategoryFromSubreddit(subreddit: string): string {
    const categoryMap: Record<string, string> = {
      'worldnews': 'news',
      'news': 'news',
      'technology': 'technology',
      'science': 'science',
      'entertainment': 'entertainment',
      'movies': 'entertainment',
      'television': 'entertainment',
      'music': 'entertainment',
      'sports': 'sports',
      'nba': 'sports',
      'soccer': 'sports',
      'nfl': 'sports',
      'baseball': 'sports',
      'politics': 'politics',
      'business': 'business',
      'economics': 'business',
      'personalfinance': 'business',
      'gaming': 'gaming',
      'pcgaming': 'gaming',
      'ps4': 'gaming',
      'xboxone': 'gaming',
      'nintendo': 'gaming',
      'programming': 'technology',
      'webdev': 'technology',
      'machinelearning': 'technology',
      'artificial': 'technology',
      'space': 'science',
      'physics': 'science',
      'chemistry': 'science',
      'biology': 'science',
      'medicine': 'health',
      'fitness': 'health',
      'food': 'lifestyle',
      'travel': 'lifestyle',
      'books': 'entertainment',
      'literature': 'entertainment',
    };

    return categoryMap[subreddit.toLowerCase()] || 'other';
  }

  // Get trending subreddits (popular ones)
  getTrendingSubreddits(): string[] {
    return [
      'worldnews',
      'technology',
      'science',
      'entertainment',
      'sports',
      'politics',
      'business',
      'gaming',
      'programming',
      'space',
      'medicine',
      'books',
    ];
  }

  // Get posts from trending subreddits
  async getTrendingPosts(): Promise<TrendData[]> {
    const trendingSubreddits = this.getTrendingSubreddits();
    return this.getMultipleSubreddits(trendingSubreddits);
  }

  // Search for posts by keyword (simulated - Reddit RSS doesn't support search)
  async searchPosts(keyword: string): Promise<TrendData[]> {
    // Since Reddit RSS doesn't support search, we'll get posts from all feeds
    // and filter by keyword
    const allPosts = await this.getAllFeedPosts();
    
    const keywordLower = keyword.toLowerCase();
    return allPosts.filter(post => 
      post.title.toLowerCase().includes(keywordLower) ||
      post.description.toLowerCase().includes(keywordLower)
    );
  }
}

export const redditSource = new RedditSource();
