import { Adapter } from './types';
import { TrendItem } from '../types/trends';
import { normalizeTo100, clamp, safeNumber } from './scoring';
import { request } from 'undici';

const API = 'https://www.googleapis.com/youtube/v3';
const key = process.env.YOUTUBE_API_KEY;

async function listMostPopular(regionCode='US') {
  if (!key) throw new Error('YOUTUBE_API_KEY missing');
  const { body } = await request(`${API}/videos?part=snippet,statistics&chart=mostPopular&maxResults=25&regionCode=${regionCode}&key=${key}`);
  const json = await body.json() as any;
  return json.items ?? [];
}

export const youtubeAdapter: Adapter = {
  SOURCE_ID: 'youtube',
  async fetchTrends() {
    const items: TrendItem[] = [];
    const vids = await listMostPopular('US');
    const rawScores = vids.map((v:any)=> safeNumber(v?.statistics?.viewCount) + safeNumber(v?.statistics?.likeCount)*50);
    const norm = normalizeTo100(rawScores);
    vids.forEach((v:any, i:number) => {
      items.push({
        source: 'youtube',
        topic: String(v?.snippet?.title ?? '').slice(0, 280),
        score: clamp(norm[i]),
        delta24h: null,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        region: 'US',
        tags: (v?.snippet?.tags ?? []).slice(0,5),
        raw: { id: v.id, channel: v?.snippet?.channelTitle },
        observedAt: new Date(v?.snippet?.publishedAt ?? Date.now()),
        language: v?.snippet?.defaultAudioLanguage ?? null
      });
    });
    return items;
  }
}
