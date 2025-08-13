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
    const r = await fetch(url.toString(), { headers: authHeaders() });
    if (!r.ok) return null;
    const j = await r.json();
    const id = j?.data?.[0]?.id ? String(j.data[0].id) : null;
    return id;
  });
}

type Media = {
  id: string;
  caption?: string;
  media_type: MediaType;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
  children?: { data?: Array<{ media_type: MediaType; media_url?: string; thumbnail_url?: string }> };
};

async function getMediaForHashtag(tagId: string, userId: string, edge: 'top_media' | 'recent_media'): Promise<Media[]> {
  const key = ck({ kind: 'media', edge, tagId });
  return fromCache(key, async () => {
    const url = new URL(`${API}/${tagId}/${edge}`);
    url.searchParams.set('user_id', userId);
    url.searchParams.set('limit', '50');
    url.searchParams.set('fields', [
      'id','caption','media_type','media_url','thumbnail_url','permalink','timestamp',
      'like_count','comments_count',
      'children{media_type,media_url,thumbnail_url}'
    ].join(','));
    withToken(url);
    const r = await fetch(url.toString(), { headers: authHeaders() });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j?.data) ? j.data as Media[] : [];
  });
}

function firstImageUrl(m: Media): string | null {
  if (m.media_type === 'IMAGE' && m.media_url) return m.media_url;
  if (m.media_type === 'VIDEO') return m.thumbnail_url ?? null;
  if (m.media_type === 'CAROUSEL_ALBUM') {
    const c = m.children?.data ?? [];
    const img = c.find(x => x.media_type === 'IMAGE')?.media_url
            ?? c.find(x => x.media_type === 'VIDEO')?.thumbnail_url;
    return img ?? null;
  }
  return m.media_url ?? m.thumbnail_url ?? null;
}

// Simple trend score: weighted engagement + recency (last 72h)
function scoreFor(m: Media): number {
  const likes = Number(m.like_count ?? 0);
  const comments = Number(m.comments_count ?? 0);
  let base = likes + comments * 2;
  const ts = m.timestamp ? Date.parse(m.timestamp) : Date.now();
  const ageH = Math.max(1, (Date.now() - ts) / 3_600_000);
  const recencyBoost = Math.max(0.5, Math.min(1.5, 72 / ageH)); // younger → a bit more
  return Math.round(base * recencyBoost);
}

export async function fetchHashtagItems(hashtag: string): Promise<IgTrendsItem[]> {
  const userId = env('IG_USER_ID');
  if (!userId) return [];
  const id = await getHashtagId(userId, hashtag);
  if (!id) return [];

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
    observedAt: m.timestamp ? new Date(m.timestamp) : new Date(),
    tags: ['instagram', 'hashtag', hashtag.replace(/^#/, '').toLowerCase()],
    meta: m as any,
    imageUrl: firstImageUrl(m),
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
