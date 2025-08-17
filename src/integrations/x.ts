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

type XV2Ref = { type: 'retweeted'|'quoted'|'replied_to', id: string };
type XV2Includes = {
  media?: XMedia[];
  users?: XUser[];
  tweets?: XV2Tweet[];
};
type XV2Resp = {
  data?: XV2Tweet[];
  includes?: XV2Includes;
};

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
  referenced_tweets?: XV2Ref[];
};

function resolveMediaUrlFromTweet(
  t: XV2Tweet,
  includes: XV2Includes
): string | null {
  const mediaByKey = new Map<string, XMedia>((includes.media ?? []).map(m => [m.media_key, m]));
  const tweetsById = new Map<string, XV2Tweet>((includes.tweets ?? []).map(tt => [tt.id, tt]));
  // 1) media on the tweet itself
  const keys = t.attachments?.media_keys ?? [];
  for (const k of keys) {
    const m = mediaByKey.get(k!);
    const u = imageFromMedia(m || null);
    if (u) return u;
  }
  // 2) media on referenced (quoted / retweeted) tweet
  const refs: XV2Ref[] = (t as any).referenced_tweets ?? [];
  for (const r of refs) {
    if (r.type === 'quoted' || r.type === 'retweeted') {
      const rt = tweetsById.get(r.id);
      if (!rt) continue;
      const rkeys = rt.attachments?.media_keys ?? [];
      for (const rk of rkeys) {
        const m2 = mediaByKey.get(rk!);
        const u2 = imageFromMedia(m2 || null);
        if (u2) return u2;
      }
    }
  }
  return null;
}

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
function ttl() { return Number(process.env.X_CACHE_TTL_SECONDS ?? 1800); } // 30 minutes default

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
  
  try {
    const data = await fetcher();
    await redis().setex(key, seconds, JSON.stringify(data));
    return data;
  } catch (error: any) {
    // If we hit rate limit, cache empty result for a shorter time to avoid repeated failures
    if (error.message?.includes('429')) {
      console.warn('Rate limit hit, caching empty result for 5 minutes');
      const emptyData = key.includes('trends') ? [] : { data: [], includes: { media: [], users: [] } };
      await redis().setex(key, 300, JSON.stringify(emptyData)); // 5 minutes
      return emptyData as T;
    }
    throw error;
  }
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
  if (!r.ok) {
    if (r.status === 429) {
      console.warn('X API rate limit hit (v2), will retry later');
      return { data: [], includes: { media: [], users: [] } };
    }
    throw new Error(`X v2 ${r.status}`);
  }
  return r.json();
}

async function v11(path: string, params: Record<string,string>): Promise<any> {
  const url = new URL(V11 + path);
  Object.entries(params).forEach(([k,v])=>url.searchParams.set(k, v));
  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${bearer()}`, 'User-Agent':'TrenderAI-X/1.0' }
  });
  if (!r.ok) {
    if (r.status === 429) {
      console.warn('X API rate limit hit (v1.1), will retry later');
      return [];
    }
    throw new Error(`X v1.1 ${r.status}`);
  }
  return r.json();
}

/** Recent search (v2): last 7 days. */
export async function searchRecent(query: string, max = 50): Promise<XItem[]> {
  const key = ck({ kind:'recent', q: query, max });
  return fromCache(key, async () => {
    const params = {
      query,
      max_results: String(Math.min(Math.max(max, 10), 100)),
      'tweet.fields': ['created_at','lang','possibly_sensitive','public_metrics','referenced_tweets'].join(','),
      'expansions': ['attachments.media_keys','author_id','referenced_tweets.id','referenced_tweets.id.author_id'].join(','),
      'media.fields': ['url','preview_image_url','width','height','type'].join(','),
      'user.fields': ['username','name','profile_image_url'].join(',')
    };
    const j: XV2Resp = await v2('/tweets/search/recent', params); // v2 Recent Search
    const tweets: XV2Tweet[] = j?.data ?? [];
    const mediaArr: XMedia[] = j?.includes?.media ?? [];
    const users: XUser[] = j?.includes?.users ?? [];
    const mediaByKey = new Map<string, XMedia>(mediaArr.map(m => [m.media_key, m]));
    const userById = new Map<string, XUser>(users.map(u => [u.id, u]));

    const now = new Date();
    const items: XItem[] = tweets.map(t => {
      const img = resolveMediaUrlFromTweet(t, j.includes ?? {});
      const u = t.author_id ? userById.get(t.author_id) : undefined;
      const username = u?.username ? '@'+u.username : '';
      const short = t.text.replace(/\s+/g,' ').trim().slice(0, 140);
      const url = (u?.username) ? `https://twitter.com/${u.username}/status/${t.id}` : `https://twitter.com/i/web/status/${t.id}`;
      const tags = ['twitter', ...extractHashtags(t)];
      
      // Get first media item if available
      const firstMedia = t.attachments?.media_keys?.[0] ? mediaByKey.get(t.attachments.media_keys[0]) : null;

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
  }, 30*60); // 30 minutes for trends
}

/** Convenience to ingest default queries + default WOEIDs */
export async function fetchDefaultXSet(): Promise<XItem[]> {
  const all: XItem[] = [];
  const queries = (env('X_DEFAULT_QUERIES') || '').split(',').map(s=>s.trim()).filter(Boolean);
  
  // Limit to 1 query to avoid rate limits during testing
  const limitedQueries = queries.slice(0, 1);
  console.log(`X: Processing ${limitedQueries.length}/${queries.length} queries to avoid rate limits`);
  
  for (const q of limitedQueries) {
    try {
      const chunk = await searchRecent(q, 50); // Reduced from 80 to 50
      all.push(...chunk);
      console.log(`X: Got ${chunk.length} tweets for query "${q}"`);
    } catch (error: any) {
      console.warn(`X: Failed to fetch tweets for "${q}":`, error.message);
    }
  }
  
  // Skip trends for now to avoid rate limits
  // const woeids = (env('X_TRENDS_WOEIDS') || '').split(',').map(s=>Number(s.trim())).filter(Boolean);
  // for (const w of woeids) {
  //   const chunk = await trendsByWOEID(w);
  //   all.push(...chunk);
  // }
  
  // final sort/dedupe by URL or topic
  const map = new Map<string, XItem>();
  for (const it of all) {
    const k = it.url || it.topic;
    if (!map.has(k)) map.set(k, it);
  }
  return Array.from(map.values()).sort((a,b)=>b.score - a.score).slice(0, 100); // Reduced from 200 to 100
}
