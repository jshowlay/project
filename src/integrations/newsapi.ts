import { Adapter } from './types';
import { TrendItem } from '../types/trends';
import { normalizeTo100, clamp } from './scoring';
import { request } from 'undici';

const key = process.env.NEWSAPI_KEY;

export const newsapiAdapter: Adapter = {
  SOURCE_ID: 'newsapi',
  async fetchTrends() {
    if (!key) throw new Error('NEWSAPI_KEY missing');
    const url = `https://newsapi.org/v2/top-headlines?country=us&category=technology&category=business&pageSize=50`;
    const { body } = await request(url, { headers: { 'X-Api-Key': key } });
    const json = await body.json() as any;
    const arts = json?.articles ?? [];
    const rawScores = arts.map((a:any, i:number)=> (arts.length - i)); // rough recency/position signal
    const norm = normalizeTo100(rawScores);
    return arts.map((a:any, i:number)=>({
      source: 'newsapi',
      topic: String(a.title ?? '').slice(0,280),
      score: clamp(norm[i]),
      delta24h: null,
      url: a.url ?? null,
      region: 'US',
      tags: ['news','technology','business'],
      raw: { source: a?.source?.name },
      observedAt: new Date(a.publishedAt ?? Date.now()),
      language: a?.language ?? null
    }));
  }
}
