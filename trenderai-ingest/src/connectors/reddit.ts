import axios from 'axios';
import { upsertItem } from '../db/index.js';
import { makeHash } from '../lib/hash.js';
import { log, warn } from '../lib/log.js';

type TokenResp = { access_token: string; token_type: string; expires_in: number; scope: string; };

async function getToken(): Promise<string | null> {
  const {
    REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, REDDIT_USER_AGENT
  } = process.env;
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET || !REDDIT_USERNAME || !REDDIT_PASSWORD) {
    warn('Reddit env missing; skipping');
    return null;
  }
  const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
  const params = new URLSearchParams({
    grant_type: 'password',
    username: REDDIT_USERNAME!,
    password: REDDIT_PASSWORD!
  });

  const { data } = await axios.post<TokenResp>('https://www.reddit.com/api/v1/access_token', params, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'User-Agent': REDDIT_USER_AGENT || 'trenderai-ingest/0.1'
    }
  });

  return data.access_token;
}

export async function fetchReddit() {
  const token = await getToken();
  if (!token) return;

  const subsRaw = process.env.REDDIT_SUBS || 'technology/50';
  const subs = subsRaw.split(',').map(s => s.trim()).filter(Boolean);

  for (const spec of subs) {
    const [sub, limitStr] = spec.split('/');
    const limit = Math.min(Number(limitStr || 50), 100);
    const url = `https://oauth.reddit.com/r/${sub}/new.json?limit=${limit}`;
    const { data } = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': process.env.REDDIT_USER_AGENT || 'trenderai-ingest/0.1' }
    });

    const posts = data?.data?.children || [];
    for (const p of posts) {
      const r = p.data;
      const itemUrl = r.url_overridden_by_dest || `https://www.reddit.com${r.permalink}`;
      const title = r.title;
      const text = r.selftext || '';
      const published_at = new Date(r.created_utc * 1000).toISOString();
      const metrics = { score: r.score, num_comments: r.num_comments };
      const tags = [sub];

      const hash = makeHash(['reddit', r.id, itemUrl, title, text.slice(0,280)]);
      await upsertItem({
        source: 'reddit',
        source_id: r.id,
        url: itemUrl,
        title,
        text,
        author: r.author,
        lang: 'en',
        published_at,
        tags,
        metrics,
        raw: r,
        hash
      });
    }
    log(`Reddit: /r/${sub} upserted ${posts.length} items`);
  }
}







