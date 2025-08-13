import { prisma } from '@/server/db';
import { upgradeImageUrl } from '@/server/image_rules';
import { redis } from '@/server/db';

const V2 = 'https://api.twitter.com/2';

type Media = { media_key:string; type:'photo'|'video'|'animated_gif'; url?:string; preview_image_url?:string; width?:number; height?:number };
type User = { id:string; name:string; username:string; profile_image_url?:string };
type Tweet = {
  id:string; text:string; lang?:string; created_at?:string; possibly_sensitive?:boolean;
  public_metrics?: { retweet_count:number; reply_count:number; like_count:number; quote_count:number; bookmark_count?:number; impression_count?:number };
  attachments?: { media_keys?:string[] };
  author_id?: string;
  entities?: { hashtags?: Array<{tag:string}> };
  referenced_tweets?: Array<{ type:'retweeted'|'quoted'|'replied_to', id:string }>;
};

type StreamIncludes = { media?:Media[]; users?:User[]; tweets?:Tweet[] };
type StreamData = { data?:Tweet; includes?:StreamIncludes; matching_rules?: Array<{ id:string; tag?:string }> };

function env(name:string, dflt=''){ return process.env[name] ?? dflt; }
function bearer(){ const t=process.env.X_BEARER_TOKEN; if(!t) throw new Error('X_BEARER_TOKEN missing'); return t; }

function score(pm?:Tweet['public_metrics']): number {
  if (!pm) return 0;
  const { like_count=0, retweet_count=0, reply_count=0, quote_count=0, bookmark_count=0 } = pm;
  return Math.round(like_count*1 + retweet_count*2 + reply_count*1 + quote_count*3 + bookmark_count*1);
}
function hashtags(t: Tweet): string[] {
  const e = t.entities?.hashtags?.map(h=>h.tag.toLowerCase()) ?? [];
  const extra = (t.text.match(/#([a-z0-9_]+)/gi) || []).map(s=>s.slice(1).toLowerCase());
  return Array.from(new Set([...e, ...extra])).slice(0,6);
}
function imgFromMedia(m?: Media|null){ return (m?.type==='photo' ? m?.url : m?.preview_image_url) || null; }

function resolveImg(t: Tweet, inc: StreamIncludes): string | null {
  const mediaByKey = new Map<string, Media>((inc.media ?? []).map(m=>[m.media_key, m]));
  const tweetsById = new Map<string, Tweet>((inc.tweets ?? []).map(tt=>[tt.id, tt]));
  const keys = t.attachments?.media_keys ?? [];
  for (const k of keys){ const m = mediaByKey.get(k!); const u = imgFromMedia(m||null); if (u) return u; }
  for (const r of t.referenced_tweets ?? []) {
    if (r.type==='quoted' || r.type==='retweeted') {
      const rt = tweetsById.get(r.id); if (!rt) continue;
      for (const rk of (rt.attachments?.media_keys ?? [])){ const m2 = mediaByKey.get(rk!); const u2 = imgFromMedia(m2||null); if (u2) return u2; }
    }
  }
  return null;
}

// --- Rules Management ---
export async function listRules(): Promise<any> {
  const url = new URL(V2 + '/tweets/search/stream/rules');
  const r = await fetch(url, { headers: { Authorization:`Bearer ${bearer()}` }});
  return r.json();
}
export async function addRules(expressions: string[]): Promise<any> {
  const url = new URL(V2 + '/tweets/search/stream/rules');
  const body = { add: expressions.map(value => ({ value })) };
  const r = await fetch(url, { method:'POST', headers:{ Authorization:`Bearer ${bearer()}`, 'content-type':'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
export async function deleteAllRules(): Promise<any> {
  const cur = await listRules();
  const ids: string[] = (cur?.data ?? []).map((x:any)=>x.id);
  if (!ids.length) return { ok:true };
  const url = new URL(V2 + '/tweets/search/stream/rules');
  const r = await fetch(url, { method:'POST', headers:{ Authorization:`Bearer ${bearer()}`, 'content-type':'application/json' }, body: JSON.stringify({ delete:{ ids } }) });
  return r.json();
}
export async function replaceRulesFromEnv(): Promise<any> {
  const raw = (env('X_STREAM_RULES') || '').split(/\n|,/).map(s=>s.trim()).filter(Boolean);
  await deleteAllRules();
  if (raw.length) return addRules(raw);
  return { ok:true, message:'no rules' };
}

// --- Streaming Controller (singleton) ---
let running = false;
let abortCtl: AbortController | null = null;
let backoffSec = 2;

export function isStreaming(){ return running; }

export async function startStream(): Promise<{ ok:boolean; started:boolean }> {
  if (running) return { ok:true, started:false };

  running = true;
  backoffSec = 2;

  // Auto ensure rules exist
  if ((env('X_STREAM_RULES') || '').trim()) {
    try { await replaceRulesFromEnv(); } catch {}
  }

  // Loop with backoff
  (async function loop(){
    while (running) {
      abortCtl = new AbortController();
      try {
        const url = new URL(V2 + '/tweets/search/stream');
        url.searchParams.set('tweet.fields', ['created_at','lang','possibly_sensitive','public_metrics','referenced_tweets'].join(','));
        url.searchParams.set('expansions', ['attachments.media_keys','author_id','referenced_tweets.id','referenced_tweets.id.author_id'].join(','));
        url.searchParams.set('media.fields', ['url','preview_image_url','width','height','type'].join(','));
        url.searchParams.set('user.fields', ['username','name','profile_image_url'].join(','));

        const r = await fetch(url, {
          headers: { Authorization:`Bearer ${bearer()}`, 'User-Agent':'TrenderAI-X-Stream/1.0' },
          signal: abortCtl.signal
        });
        if (!r.ok || !r.body) throw new Error(`stream ${r.status}`);

        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        backoffSec = 2; // successful connect → reset backoff

        while (running) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream:true });
          let idx;
          while ((idx = buffer.indexOf('\r\n')) >= 0) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 2);
            if (!line) continue; // heartbeat
            try {
              const json: StreamData = JSON.parse(line);
              const t = json.data;
              const inc = json.includes ?? {};
              if (!t) continue;

              // map to TrendRecord
              const uResp = await upsertTweet(t, inc);
              // (optional) minimal throttle to avoid hot loop
            } catch (e) {
              // ignore malformed line
            }
          }
        }
      } catch (e) {
        // backoff with cap
        const cap = Math.max(5, Number(env('X_STREAM_BACKOFF_MAX_SEC') || 60));
        await sleep(backoffSec * 1000);
        backoffSec = Math.min(cap, Math.round(backoffSec * 2));
      } finally {
        abortCtl = null;
      }
    }
  })();

  return { ok:true, started:true };
}

export async function stopStream(): Promise<{ ok:boolean; stopped:boolean }> {
  if (!running) return { ok:true, stopped:false };
  running = false;
  try { abortCtl?.abort(); } catch {}
  abortCtl = null;
  return { ok:true, stopped:true };
}

function sleep(ms:number){ return new Promise(res=>setTimeout(res, ms)); }

async function upsertTweet(t: Tweet, includes: StreamIncludes) {
  const now = new Date();
  const obsAt = t.created_at ? new Date(t.created_at) : now;
  const obsBucket = new Date(Math.floor(obsAt.getTime()/3600000)*3600000);
  const usersById = new Map<string, User>((includes.users ?? []).map(u=>[u.id, u]));
  const u = t.author_id ? usersById.get(t.author_id) : undefined;
  const username = u?.username ? '@'+u.username : '';
  const short = t.text.replace(/\s+/g,' ').trim().slice(0, 140);
  const url = u?.username ? `https://twitter.com/${u.username}/status/${t.id}` : `https://twitter.com/i/web/status/${t.id}`;
  const img0 = resolveImg(t, includes);
  const img = img0 ? upgradeImageUrl(img0) : null;

  const topic = `${short} [tw:${t.id}]${username ? ' — ' + username : ''}`;
  const tags = ['twitter','stream', ...hashtags(t)];
  const sc = score(t.public_metrics);

  try {
    await prisma.trendRecord.upsert({
      where: { source_topic_observedBucket: { source:'twitter', topic, observedBucket: obsBucket } },
      create: {
        source:'twitter', topic, score: sc, delta24h: null,
        url, region: null, tags, raw:{ tweet:t, users:includes.users ?? [], media:includes.media ?? [] },
        observedAt: obsAt, observedBucket: obsBucket, language: t.lang ?? null,
        imageUrl: img, images: img ? [img] : []
      },
      update: { score: sc, url, tags, observedAt: obsAt, imageUrl: img ?? null }
    });
  } catch {}
}
