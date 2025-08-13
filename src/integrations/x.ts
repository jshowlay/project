import { redis } from '@/server/db';

const V2 = 'https://api.twitter.com/2';
const V11 = 'https://api.twitter.com/1.1';

type XMedia = {
  media_key: string;
  type: 'photo'|'video'|'animated_gif';
  url?: string;                 // photo only
  preview_image_url?: string;   // video/gif
  width?: number;
  height?: number;
};

type XUser = { id: string; name: string; username: string; profile_image_url?: string };

type XV2Tweet = {
  id: string;
  text: string;
  created_at?: string;
  lang?: string;
  possibly_sensitive?: boolean;
  public_metrics?: { retweet_count: number; reply_count: number; like_count: number; quote_count: number; bookmark_count?: number; impression_count?: number };
  attachments?: { media_keys?: string[] };
  author_id?: string;
  entities?: { hashtags?: Array<{ tag: string }> };
};

export type XItem = {
  topic: string;
  score: number;
  url: string | null;
  region: string | null;
  observedAt: Date;
  tags: string[];
  imageUrl?: string | null;
  meta?: Record<string, any>;
  source: 'twitter';
};

function env(name: string, dflt = '') { return process.env[name] ?? dflt; }
function ttl() { return Number(process.env.X_CACHE_TTL_SECONDS ?? 600); }

function ck(parts: Record<string,string|number|boolean|undefined>) {
  return 'trenderai:x:' + Object.entries(parts).filter(([,v])=>v!==undefined).map(([k,v])=>`${k}=${v}`).join('|');
}

function bearer(): string {
  const t = process.env.X_BEARER_TOKEN;
  if (!t) throw new Error('X_BEARER_TOKEN missing');
  return t;
}

async function fromCache<T>(key: string, fetcher: ()=>Promise<T>, seconds = ttl()): Promise<T> {
  const hit = await redis().get(key);
  if (hit) return JSON.parse(hit) as T;
  const data = await fetcher();
  await redis().setex(key, seconds, JSON.stringify(data));
  return data;
}

function imageFromMedia(m?: XMedia | null): string | null {
  if (!m) return null;
  // Photos have .url; videos/gifs expose preview_image_url
  return (m.type === 'photo' ? m.url : m.preview_image_url) || null;
}

function scoreFromMetrics(pm?: XV2Tweet['public_metrics']): number {
  if (!pm) return 0;
  const { like_count=0, retweet_count=0, reply_count=0, quote_count=0, bookmark_count=0 } = pm;
  // Weighted by "effort" + virality
  return Math.round(like_count*1 + retweet_count*2 + reply_count*1 + quote_count*3 + bookmark_count*1);
}

function extractHashtags(t: XV2Tweet): string[] {
  const tags = t.entities?.hashtags?.map(h => h.tag.toLowerCase()) ?? [];
  // Also sniff raw text in case entities missing
  const extra = (t.text.match(/#([a-z0-9_]+)/gi) || []).map(s => s.replace('#','').toLowerCase());
  return Array.from(new Set([...tags, ...extra])).slice(0, 6);
}

async function v2(path: string, params: Record<string,string>): Promise<any> {
  const url = new URL(V2 + path);
  Object.entries(params).forEach(([k,v])=>url.searchParams.set(k, v));
  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${bearer()}`, 'User-Agent':'TrenderAI-X/1.0' }
  });
  if (!r.ok) throw new Error(`X v2 ${r.status}`);
  return r.json();
}

async function v11(path: string, params: Record<string,string>): Promise<any> {
  const url = new URL(V11 + path);
  Object.entries(params).forEach(([k,v])=>url.searchParams.set(k, v));
  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${bearer()}`, 'User-Agent':'TrenderAI-X/1.0' }
  });
  if (!r.ok) throw new Error(`X v1.1 ${r.status}`);
  return r.json();
}

/** Recent search (v2): last 7 days. */
export async function searchRecent(query: string, max = 50): Promise<XItem[]> {
  const key = ck({ kind:'recent', q: query, max });
  return fromCache(key, async () => {
    const params = {
      query,
      max_results: String(Math.min(Math.max(max, 10), 100)),
      'tweet.fields': ['created_at','lang','possibly_sensitive','public_metrics'].join(','),
      'expansions': ['attachments.media_keys','author_id'].join(','),
      'media.fields': ['url','preview_image_url','width','height'].join(','),
      'user.fields': ['username','name','profile_image_url'].join(',')
    };
    const j = await v2('/tweets/search/recent', params); // v2 Recent Search
    const tweets: XV2Tweet[] = j?.data ?? [];
    const mediaArr: XMedia[] = j?.includes?.media ?? [];
    const users: XUser[] = j?.includes?.users ?? [];
    const mediaByKey = new Map<string, XMedia>(mediaArr.map(m => [m.media_key, m]));
    const userById = new Map<string, XUser>(users.map(u => [u.id, u]));

    const now = new Date();
    const items: XItem[] = tweets.map(t => {
      const keys = t.attachments?.media_keys ?? [];
      const firstMedia = keys.length ? mediaByKey.get(keys[0]!) : undefined;
      const img = imageFromMedia(firstMedia || null);
      const u = t.author_id ? userById.get(t.author_id) : undefined;
      const username = u?.username ? '@'+u.username : '';
      const short = t.text.replace(/\s+/g,' ').trim().slice(0, 140);
      const url = (u?.username) ? `https://twitter.com/${u.username}/status/${t.id}` : `https://twitter.com/i/web/status/${t.id}`;
      const tags = ['twitter', ...extractHashtags(t)];

      return {
        topic: `${short} [tw:${t.id}]${username ? ' — ' + username : ''}`,
        score: scoreFromMetrics(t.public_metrics),
        url,
        region: null,
        observedAt: t.created_at ? new Date(t.created_at) : now,
        tags,
        imageUrl: img || null,
        meta: { tweet: t, author: u, media: firstMedia ?? null },
        source: 'twitter'
      };
    });

    // Sort desc by score and keep top 100
    items.sort((a,b)=>b.score - a.score);
    return items.slice(0, 100);
  });
}

/** Trending topics (v1.1): by WOEID (e.g., 23424977 = US). */
export async function trendsByWOEID(woeid: number): Promise<XItem[]> {
  const key = ck({ kind:'trends', woeid });
  return fromCache(key, async () => {
    // v1.1 GET trends/place
    const j = await v11('/trends/place.json', { id: String(woeid) });
    const arr = Array.isArray(j) ? j : [];
    const payload = arr[0] ?? {};
    const trends: Array<{ name: string; query?: string; url?: string; tweet_volume?: number }> = payload.trends ?? [];
    const loc = (payload.locations && payload.locations[0]?.name) || `WOEID:${woeid}`;

    const now = new Date();
    const items: XItem[] = trends.map(t => {
      const q = t.query || encodeURIComponent(t.name);
      const url = `https://twitter.com/search?q=${q}&src=trend_click`;
      return {
        topic: t.name,
        score: Number(t.tweet_volume ?? 0) || 0,
        url,
        region: loc,
        observedAt: now,
        tags: ['twitter','trending', String(woeid)],
        imageUrl: null,
        meta: t as any,
        source: 'twitter'
      };
    });

    items.sort((a,b)=>b.score - a.score);
    return items.slice(0, 100);
  }, 15*60);
}

/** Convenience to ingest default queries + default WOEIDs */
export async function fetchDefaultXSet(): Promise<XItem[]> {
  const all: XItem[] = [];
  const queries = (env('X_DEFAULT_QUERIES') || '').split(',').map(s=>s.trim()).filter(Boolean);
  for (const q of queries) {
    const chunk = await searchRecent(q, 80);
    all.push(...chunk);
  }
  const woeids = (env('X_TRENDS_WOEIDS') || '').split(',').map(s=>Number(s.trim())).filter(Boolean);
  for (const w of woeids) {
    const chunk = await trendsByWOEID(w);
    all.push(...chunk);
  }
  // final sort/dedupe by URL or topic
  const map = new Map<string, XItem>();
  for (const it of all) {
    const k = it.url || it.topic;
    if (!map.has(k)) map.set(k, it);
  }
  return Array.from(map.values()).sort((a,b)=>b.score - a.score).slice(0, 200);
}
