import { Adapter } from './types';
import { TrendItem } from '../types/trends';
import { normalizeTo100, clamp, safeNumber } from './scoring';
import { request } from 'undici';

const key = process.env.ALPHAVANTAGE_KEY;
const symbols = (process.env.SYMBOLS ?? 'AAPL,MSFT,NVDA,TSLA,BTC,ETH').split(',').map(s=>s.trim()).filter(Boolean);

async function daily(symbol:string){
  if (!key) throw new Error('ALPHAVANTAGE_KEY missing');
  const fn = symbol === symbol.toUpperCase() && (symbol==='BTC' || symbol==='ETH') ? 'DIGITAL_CURRENCY_DAILY' : 'TIME_SERIES_DAILY';
  const url = fn==='DIGITAL_CURRENCY_DAILY'
    ? `https://www.alphavantage.co/query?function=${fn}&symbol=${symbol}&market=USD&apikey=${key}`
    : `https://www.alphavantage.co/query?function=${fn}&symbol=${symbol}&apikey=${key}`;
  const { body } = await request(url);
  const json = await body.json() as any;
  return json;
}

export const alphavantageAdapter: Adapter = {
  SOURCE_ID: 'alphavantage',
  async fetchTrends() {
    const items: TrendItem[] = [];
    for (const sym of symbols) {
      try {
        const data = await daily(sym);
        const series = data['Time Series (Daily)'] ?? data['Time Series (Digital Currency Daily)'] ?? {};
        const days = Object.keys(series).sort().slice(-2);
        if (days.length < 2) continue;
        const [d1, d2] = days.slice(-2);
        const p1 = Number(series[d1]['4. close'] ?? series[d1]['4b. close (USD)']);
        const p2 = Number(series[d2]['4. close'] ?? series[d2]['4b. close (USD)']);
        const delta = ((p2 - p1) / p1) * 100;
        items.push({
          source: 'alphavantage' as const,
          topic: sym,
          score: clamp(Math.abs(delta)*5), // amplify volatility to 0..100
          delta24h: delta,
          url: null,
          region: 'US',
          tags: ['stocks'],
          raw: { d1, d2, p1, p2 },
          observedAt: new Date(),
          language: null
        });
      } catch {}
    }
    const scores = items.map(i=>i.score);
    const norm = normalizeTo100(scores);
    return items.map((it, idx)=> ({ ...it, score: norm[idx] ?? it.score }));
  }
}
