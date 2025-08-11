import { Adapter } from './types';
import { TrendItem } from '../types/trends';
import { normalizeTo100, clamp } from './scoring';
import { request } from 'undici';

const subs = (process.env.REDDIT_SUBS ?? 'technology,entrepreneurship,CryptoCurrency,worldnews,dataisbeautiful')
  .split(',').map(s => s.trim()).filter(Boolean);

async function getToken() {
  const id = process.env.REDDIT_CLIENT_ID;
  const sec = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !sec) throw new Error('Reddit creds missing');
  const auth = Buffer.from(`${id}:${sec}`).toString('base64');
  const { body } = await request('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': process.env.REDDIT_USER_AGENT ?? 'trenderai/1.0' },
    body: 'grant_type=client_credentials'
  });
  const json = await body.json() as any;
  return json.access_token as string;
}

export const redditAdapter: Adapter = {
  SOURCE_ID: 'reddit',
  async fetchTrends() {
    const token = await getToken();
    const items: TrendItem[] = [];
    for (const sub of subs) {
      const { body } = await request(`https://oauth.reddit.com/r/${sub}/hot?limit=25`, {
        headers: { Authorization: `Bearer ${token}`, 'User-Agent': process.env.REDDIT_USER_AGENT ?? 'trenderai/1.0' }
      });
      const json = await body.json() as any;
      const posts = (json?.data?.children ?? []).map((c:any)=>c.data);
      const rawScores = posts.map((p:any)=> Math.log10((p.ups??0) + (p.num_comments??0)*2 + 1));
      const norm = normalizeTo100(rawScores);
      posts.forEach((p:any, i:number) => {
        items.push({
          source: 'reddit',
          topic: String(p.title ?? '').slice(0, 280),
          score: clamp(norm[i]),
          delta24h: null,
          url: p.permalink ? `https://reddit.com${p.permalink}` : null,
          region: null,
          tags: [sub.toLowerCase()],
          raw: { id: p.id, ups: p.ups, num_comments: p.num_comments, sub },
          observedAt: new Date(p.created_utc ? p.created_utc*1000 : Date.now()),
          language: (p?.link_flair_text ?? null)
        });
      });
    }
    return items;
  }
}
