import { z } from 'zod';
import { TrendData } from '../database';

// NYT API response schemas
const NYTArticleSchema = z.object({
  abstract: z.string(),
  web_url: z.string().url(),
  snippet: z.string().optional(),
  lead_paragraph: z.string().optional(),
  print_section: z.string().optional(),
  print_page: z.string().optional(),
  source: z.string(),
  multimedia: z.array(z.any()).optional(),
  headline: z.object({
    main: z.string(),
    kicker: z.string().optional(),
    content_kicker: z.string().optional(),
    print_headline: z.string().optional(),
    name: z.string().optional(),
    seo: z.string().optional(),
    sub: z.string().optional(),
  }),
  keywords: z.array(z.object({
    name: z.string(),
    value: z.string(),
    rank: z.number(),
    major: z.string(),
  })).optional(),
  pub_date: z.string(),
  document_type: z.string(),
  news_desk: z.string().optional(),
  section_name: z.string().optional(),
  subsection_name: z.string().optional(),
  byline: z.object({
    original: z.string().optional(),
    person: z.array(z.any()).optional(),
    organization: z.string().optional(),
  }).optional(),
  type_of_material: z.string(),
  _id: z.string(),
  word_count: z.number().optional(),
  uri: z.string().optional(),
});

const NYTResponseSchema = z.object({
  status: z.string(),
  copyright: z.string(),
  response: z.object({
    docs: z.array(NYTArticleSchema),
    meta: z.object({
      hits: z.number(),
      offset: z.number(),
      time: z.number(),
    }),
  }),
});

export type NYTArticle = z.infer<typeof NYTArticleSchema>;

export class NYTSource {
  private apiKey: string;
  private sections: string[];

  constructor() {
    this.apiKey = process.env.NYT_API_KEY || '';
    this.sections = (process.env.NYT_SECTIONS || 'home').split(',');
    
    if (!this.apiKey) {
      throw new Error('NYT_API_KEY environment variable is required');
    }
  }

  // Get top stories from a specific section
  async getTopStories(section: string = 'home', limit: number = 20): Promise<TrendData[]> {
    try {
      const url = new URL(`https://api.nytimes.com/svc/topstories/v2/${section}.json`);
      url.searchParams.set('api-key', this.apiKey);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`NYT API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validatedData = NYTResponseSchema.parse(data);

      return validatedData.response.docs
        .slice(0, limit)
        .map(article => this.transformArticle(article, section));
    } catch (error) {
      console.error(`Error fetching NYT top stories for section ${section}:`, error);
      return [];
    }
  }

  // Get articles from all configured sections
  async getAllTopStories(): Promise<TrendData[]> {
    const allArticles: TrendData[] = [];
    
    for (const section of this.sections) {
      try {
        console.log(`Fetching NYT top stories for section: ${section}`);
        const articles = await this.getTopStories(section, 10); // Limit per section
        allArticles.push(...articles);
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to fetch articles for section ${section}:`, error);
      }
    }

    return allArticles;
  }

  // Search articles by query
  async searchArticles(query: string, limit: number = 20): Promise<TrendData[]> {
    try {
      const url = new URL('https://api.nytimes.com/svc/search/v2/articlesearch.json');
      url.searchParams.set('api-key', this.apiKey);
      url.searchParams.set('q', query);
      url.searchParams.set('sort', 'newest');

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`NYT API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validatedData = NYTResponseSchema.parse(data);

      return validatedData.response.docs
        .slice(0, limit)
        .map(article => this.transformArticle(article, 'search'));
    } catch (error) {
      console.error(`Error searching NYT articles for query "${query}":`, error);
      return [];
    }
  }

  // Get articles by section and subsection
  async getArticlesBySection(section: string, subsection?: string, limit: number = 20): Promise<TrendData[]> {
    try {
      const url = new URL('https://api.nytimes.com/svc/search/v2/articlesearch.json');
      url.searchParams.set('api-key', this.apiKey);
      url.searchParams.set('fq', `section_name:("${section}")`);
      if (subsection) {
        url.searchParams.set('fq', `subsection_name:("${subsection}")`);
      }
      url.searchParams.set('sort', 'newest');

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`NYT API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validatedData = NYTResponseSchema.parse(data);

      return validatedData.response.docs
        .slice(0, limit)
        .map(article => this.transformArticle(article, section));
    } catch (error) {
      console.error(`Error fetching NYT articles for section ${section}:`, error);
      return [];
    }
  }

  // Transform NYT article to TrendData format
  private transformArticle(article: NYTArticle, section: string): TrendData {
    const publishedAt = new Date(article.pub_date);
    const ageInHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
    const wordCount = article.word_count || 0;
    
    // Calculate score based on article age, word count, and section importance
    const timeScore = Math.max(1, 100 - Math.floor(ageInHours));
    const contentScore = Math.min(50, Math.floor(wordCount / 100));
    const sectionScore = this.getSectionScore(section);
    const score = timeScore + contentScore + sectionScore;

    return {
      source: 'nyt',
      title: article.headline.main,
      description: article.abstract || article.snippet || article.lead_paragraph || '',
      url: article.web_url,
      published_at: publishedAt,
      region: 'us', // NYT is US-focused
      category: this.getCategoryFromSection(section),
      score: Math.max(score, 1),
      created_at: publishedAt,
      updated_at: new Date(),
      metadata: {
        articleId: article._id,
        section: section,
        subsection: article.subsection_name,
        newsDesk: article.news_desk,
        documentType: article.document_type,
        typeOfMaterial: article.type_of_material,
        wordCount,
        keywords: article.keywords,
        byline: article.byline?.original,
        multimedia: article.multimedia,
        ageInHours,
      },
    };
  }

  // Get section importance score
  private getSectionScore(section: string): number {
    const sectionScores: Record<string, number> = {
      'home': 30,
      'world': 25,
      'national': 25,
      'politics': 20,
      'technology': 15,
      'science': 15,
      'health': 10,
      'sports': 10,
      'arts': 5,
      'books': 5,
      'search': 0,
    };
    return sectionScores[section] || 0;
  }

  // Get category from section name
  private getCategoryFromSection(section: string): string {
    const categoryMap: Record<string, string> = {
      'home': 'news',
      'world': 'news',
      'national': 'news',
      'politics': 'politics',
      'technology': 'technology',
      'science': 'science',
      'health': 'health',
      'sports': 'sports',
      'arts': 'entertainment',
      'books': 'entertainment',
      'movies': 'entertainment',
      'television': 'entertainment',
      'music': 'entertainment',
      'business': 'business',
      'economy': 'business',
      'education': 'education',
      'climate': 'science',
      'space': 'science',
      'search': 'news',
    };
    return categoryMap[section] || 'news';
  }

  // Get trending topics (most mentioned keywords)
  async getTrendingTopics(): Promise<string[]> {
    try {
      const allArticles = await this.getAllTopStories();
      const keywordCounts: Record<string, number> = {};

      allArticles.forEach(article => {
        const keywords = article.metadata?.keywords || [];
        keywords.forEach((keyword: any) => {
          const term = keyword.value.toLowerCase();
          keywordCounts[term] = (keywordCounts[term] || 0) + 1;
        });
      });

      return Object.entries(keywordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([term]) => term);
    } catch (error) {
      console.error('Error getting trending topics:', error);
      return [];
    }
  }

  // Get articles by trending topics
  async getArticlesByTrendingTopics(): Promise<TrendData[]> {
    const trendingTopics = await this.getTrendingTopics();
    const allArticles: TrendData[] = [];

    for (const topic of trendingTopics.slice(0, 5)) { // Limit to top 5 topics
      try {
        const articles = await this.searchArticles(topic, 5);
        allArticles.push(...articles);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to fetch articles for topic ${topic}:`, error);
      }
    }

    return allArticles;
  }

  // Get latest breaking news
  async getBreakingNews(): Promise<TrendData[]> {
    // Get articles from multiple important sections
    const sections = ['home', 'world', 'national', 'politics'];
    const allArticles: TrendData[] = [];

    for (const section of sections) {
      try {
        const articles = await this.getTopStories(section, 5);
        allArticles.push(...articles);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to fetch breaking news for section ${section}:`, error);
      }
    }

    // Sort by publication date (newest first)
    return allArticles.sort((a, b) => b.published_at.getTime() - a.published_at.getTime());
  }
}

export const nytSource = new NYTSource();
