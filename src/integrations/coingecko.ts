import { Adapter } from './types';
import { TrendItem } from '../types/trends';
import { normalizeTo100, clamp, safeNumber } from './scoring';
import { request } from 'undici';

export const coingeckoAdapter: Adapter = {
  SOURCE_ID: 'coingecko',
  async fetchTrends() {
    const { body } = await request('https://api.coingecko.com/api/v3/search/trending');
    const trending = await body.json() as any;
    const coins = (trending?.coins ?? []).map((c:any)=>c.item);
    const rawScores = coins.map((c:any)=> safeNumber(c.score));
    const norm = normalizeTo100(rawScores);
    return coins.map((c:any, i:number)=>({
      source: 'coingecko' as const,
      topic: `${c.name} (${c.symbol})`,
      score: clamp(norm[i]),
      delta24h: null,
      url: `https://www.coingecko.com/en/coins/${c.id}`,
      region: null,
      tags: ['crypto'],
      raw: { id: c.id, market_cap_rank: c.market_cap_rank },
      observedAt: new Date(),
      language: null
    }));
  }
}
