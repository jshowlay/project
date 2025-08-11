import { Adapter } from './types';
import { TrendItem } from '../types/trends';
import { normalizeTo100, clamp } from './scoring';
import { request } from 'undici';

const key = process.env.NEWSAPI_KEY;

export const newsapiAdapter: Adapter = {
  SOURCE_ID: 'newsapi',
  async fetchTrends() {
    if (!key) throw new Error('NEWSAPI_KEY missing');
    
    const categories = ['technology', 'business', 'general'];
    const allArticles: any[] = [];
    
    for (const category of categories) {
      try {
        const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=20`;
        console.log(`Fetching ${category} news from: ${url}`);
        const { body } = await request(url, { 
          headers: { 
            'X-Api-Key': key,
            'User-Agent': 'TrenderAI/1.0 (trenderai.com)'
          } 
        });
        const json = await body.json() as any;
        
        if (json.status === 'error') {
          console.error(`NewsAPI error for ${category}:`, json.message);
          continue;
        }
        
        const articles = json?.articles ?? [];
        console.log(`Got ${articles.length} articles for ${category}`);
        allArticles.push(...articles.map((a: any) => ({ ...a, category })));
      } catch (error) {
        console.error(`Failed to fetch ${category} news:`, error);
      }
    }
    
    console.log(`Total articles fetched: ${allArticles.length}`);
    
    if (allArticles.length === 0) {
      console.warn('No articles fetched from NewsAPI');
      return [];
    }
    
    const rawScores = allArticles.map((a:any, i:number)=> (allArticles.length - i)); // rough recency/position signal
    const norm = normalizeTo100(rawScores);
    
    const result = allArticles.map((a:any, i:number)=>({
      source: 'newsapi',
      topic: String(a.title ?? '').slice(0,280),
      score: clamp(norm[i]),
      delta24h: null,
      url: a.url ?? null,
      region: 'US',
      tags: ['news', a.category],
      raw: { source: a?.source?.name, category: a.category },
      observedAt: new Date(a.publishedAt ?? Date.now()),
      language: a?.language ?? null
    }));
    
    console.log(`Returning ${result.length} newsapi items`);
    return result;
  }
}
