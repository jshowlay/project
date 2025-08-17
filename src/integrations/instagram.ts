import { redis } from '@/server/db';

const API = 'https://graph.facebook.com/v20.0';

type MediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

export type IgTrendsItem = {
  topic: string;
  score: number;
  url: string | null;
  region: string | null;
  observedAt: Date;
  tags: string[];
  meta?: Record<string, any>;
  imageUrl?: string | null;
  source: 'instagram';
};

function env(name: string, dflt = '') { return process.env[name] ?? dflt; }
function ttl() { return Number(process.env.IG_CACHE_TTL_SECONDS ?? 900); }

function ck(parts: Record<string, string | number | boolean | undefined>) {
  return 'trenderai:ig:' + Object.entries(parts).filter(([,v]) => v !== undefined)
    .map(([k,v]) => `${k}=${v}`).join('|');
}

async function fromCache<T>(key: string, fetcher: () => Promise<T>, seconds = ttl()): Promise<T> {
  const hit = await redis().get(key);
  if (hit) return JSON.parse(hit) as T;
  const data = await fetcher();
  await redis().setex(key, seconds, JSON.stringify(data));
  return data;
}

function authHeaders() {
  return { };
}

function withToken(url: URL) {
  url.searchParams.set('access_token', env('IG_LONG_LIVED_TOKEN'));
  return url;
}

// Basic token refresher (optional invoke via job; not used automatically here)
export async function refreshLongLivedToken(): Promise<{ ok: boolean; expires_in?: number }> {
  // Meta's refresh endpoint (for long-lived IG tokens) uses /oauth/access_token on graph.facebook.com
  try {
    const url = new URL('https://graph.facebook.com/v20.0/oauth/access_token');
    url.searchParams.set('grant_type', 'fb_exchange_token');
    url.searchParams.set('client_id', env('IG_APP_ID'));
    url.searchParams.set('client_secret', env('IG_APP_SECRET'));
    url.searchParams.set('fb_exchange_token', env('IG_LONG_LIVED_TOKEN'));
    const r = await fetch(url.toString());
    if (!r.ok) return { ok: false };
    const j = await r.json();
    // j.access_token, j.token_type, j.expires_in
    // NOTE: You must update IG_LONG_LIVED_TOKEN manually or via your own secret store.
    return { ok: true, expires_in: Number(j.expires_in ?? 0) };
  } catch {
    return { ok: false };
  }
}

async function getHashtagId(userId: string, hashtag: string): Promise<string | null> {
  const key = ck({ kind: 'tagid', hashtag: hashtag.toLowerCase() });
  return fromCache(key, async () => {
    const url = new URL(`${API}/ig_hashtag_search`);
    url.searchParams.set('user_id', userId);
    url.searchParams.set('q', hashtag.replace(/^#/, ''));
    withToken(url);
    console.log(`Instagram: Searching for hashtag "${hashtag}" with URL: ${url.toString().replace(/access_token=[^&]+/, 'access_token=***')}`);
    const r = await fetch(url.toString(), { headers: authHeaders() });
    console.log(`Instagram: Hashtag search response status: ${r.status}`);
    if (!r.ok) {
      const errorText = await r.text();
      console.log(`Instagram: Hashtag search error: ${errorText}`);
      return null;
    }
    const j = await r.json();
    console.log(`Instagram: Hashtag search response:`, JSON.stringify(j, null, 2));
    const id = j?.data?.[0]?.id ? String(j.data[0].id) : null;
    console.log(`Instagram: Found hashtag ID: ${id}`);
    return id;
  });
}

type Media = {
  id: string;
  caption?: string;
  media_type: MediaType;
  media_url?: string;
  permalink?: string;
  // Note: Most fields are not available in basic Instagram Graph API
  // We'll use basic scoring based on post existence
};

async function getMediaForHashtag(tagId: string, userId: string, edge: 'top_media' | 'recent_media'): Promise<Media[]> {
  const key = ck({ kind: 'media', edge, tagId });
  return fromCache(key, async () => {
    const url = new URL(`${API}/${tagId}/${edge}`);
    url.searchParams.set('user_id', userId);
    url.searchParams.set('limit', '10'); // Reduced limit to avoid rate limiting
    // Use only the most basic fields that are definitely supported
    url.searchParams.set('fields', 'id,caption,media_type,media_url,permalink');
    withToken(url);
    
    // Add retry logic for network issues
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Instagram: Fetching ${edge} for hashtag ${tagId} (attempt ${attempt})`);
        const r = await fetch(url.toString(), { 
          headers: authHeaders(),
          // Reduced timeout to 15 seconds
          signal: AbortSignal.timeout(15000)
        });
        
        if (!r.ok) {
          const errorText = await r.text();
          console.log(`Instagram: ${edge} fetch error (attempt ${attempt}): ${r.status} ${errorText}`);
          if (attempt === 3) return [];
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Shorter backoff
          continue;
        }
        
        const j = await r.json();
        const media = Array.isArray(j?.data) ? j.data as Media[] : [];
        console.log(`Instagram: Successfully fetched ${media.length} ${edge} items`);
        return media;
        
      } catch (error) {
        console.log(`Instagram: Network error fetching ${edge} (attempt ${attempt}):`, error);
        if (attempt === 3) return [];
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Shorter backoff
      }
    }
    
    return [];
  });
}



// Simple trend score: basic scoring since we have limited data
function scoreFor(m: Media): number {
  // Base score of 50, with small variations based on media type
  let score = 50;
  if (m.media_type === 'VIDEO') score += 10; // Videos tend to be more engaging
  if (m.caption && m.caption.length > 50) score += 5; // Longer captions might be more engaging
  return score;
}

export async function fetchHashtagItems(hashtag: string): Promise<IgTrendsItem[]> {
  const userId = env('IG_USER_ID');
  console.log(`Instagram: Starting fetch for hashtag "${hashtag}", userId: ${userId}`);
  if (!userId) {
    console.log(`Instagram: No userId configured`);
    return [];
  }
  const id = await getHashtagId(userId, hashtag);
  console.log(`Instagram: Got hashtag ID: ${id}`);
  if (!id) {
    console.log(`Instagram: No hashtag ID found for "${hashtag}"`);
    return [];
  }

  const [topMedia, recentMedia] = await Promise.all([
    getMediaForHashtag(id, userId, 'top_media'),
    getMediaForHashtag(id, userId, 'recent_media')
  ]);

  const both = [...topMedia, ...recentMedia];
  const uniq = new Map<string, Media>();
  for (const m of both) uniq.set(m.id, m);
  const items: IgTrendsItem[] = Array.from(uniq.values()).map((m) => ({
    topic: (m.caption?.slice(0, 140) || '(post)') + ` #${hashtag.replace(/^#/, '')}`,
    score: scoreFor(m),
    url: m.permalink ?? null,
    region: env('IG_DEFAULT_GEO') || 'GLOBAL',
    observedAt: new Date(), // Use current time since we don't have timestamp
    tags: ['instagram', 'hashtag', hashtag.replace(/^#/, '').toLowerCase()],
    meta: m as any,
    imageUrl: m.media_url || null, // Simplified image URL logic
    source: 'instagram'
  }));

  // Sort by score desc, keep top 100
  items.sort((a,b) => b.score - a.score);
  return items.slice(0, 100);
}

export async function fetchDefaultHashtagSet(): Promise<IgTrendsItem[]> {
  const list = (env('IG_DEFAULT_HASHTAGS') || 'ai').split(',').map(s => s.trim()).filter(Boolean);
  const all: IgTrendsItem[] = [];
  for (const tag of list) {
    const chunk = await fetchHashtagItems(tag);
    all.push(...chunk);
  }
  // final sort & dedupe by URL
  const byUrl = new Map<string, IgTrendsItem>();
  for (const it of all) {
    const key = it.url || it.topic;
    if (!byUrl.has(key)) byUrl.set(key, it);
  }
  return Array.from(byUrl.values()).sort((a,b) => b.score - a.score);
}
