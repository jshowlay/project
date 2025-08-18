import axios from 'axios';
import { upsertItem } from '../db/index.js';
import { makeHash } from '../lib/hash.js';
import { log } from '../lib/log.js';

const API = 'https://www.googleapis.com/youtube/v3/videos';

export async function fetchYouTubeTrending(regionCode = 'US', maxResults = 50) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) { log('YOUTUBE_API_KEY missing; skipping'); return; }

  const { data } = await axios.get(API, {
    params: {
      part: 'snippet,statistics,contentDetails',
      chart: 'mostPopular',
      regionCode,
      maxResults,
      key
    }
  });

  const items = data.items || [];
  for (const v of items) {
    const s = v.snippet || {};
    const stats = v.statistics || {};
    const url = `https://www.youtube.com/watch?v=${v.id}`;
    const title = s.title;
    const text = s.description;
    const published_at = s.publishedAt;
    const tags = s.tags || [];
    const metrics = {
      views: Number(stats.viewCount || 0),
      likes: Number(stats.likeCount || 0),
      comments: Number(stats.commentCount || 0)
    };

    const hash = makeHash(['youtube', v.id, url, title, (text || '').slice(0, 280)]);
    await upsertItem({
      source: 'youtube',
      source_id: String(v.id),
      url, title, text,
      author: s.channelTitle,
      lang: s.defaultAudioLanguage || 'en',
      published_at,
      tags,
      metrics,
      raw: v,
      hash
    });
  }
  log(`YouTube: upserted ${items.length} items`);
}








