import axios from 'axios';
import { upsertItem } from '../db/index.js';
import { makeHash } from '../lib/hash.js';
import { log } from '../lib/log.js';

const API = 'https://api.gdeltproject.org/api/v2/doc/doc';

export async function fetchGdelt(tspan = '15MIN', maxrecords = 75) {
  // Simple recency query; refine later with your own keyword filters.
  const { data } = await axios.get(API, {
    params: {
      format: 'json',
      timespan: tspan,
      maxrecords,
      sort: 'DateDesc'
    }
  });

  const items = data?.articles || [];
  for (const a of items) {
    const url = a.url;
    const title = a.title;
    const text = a.seendate ? `${a.title} — ${a.domain}` : a.title;
    const published_at = a.seendate;
    const tags: string[] = a.lang ? [a.lang] : [];
    const metrics = { socialimage: a.socialimage ? 1 : 0 };

    const hash = makeHash(['gdelt', url, title, (text || '').slice(0, 280)]);
    await upsertItem({
      source: 'gdelt',
      source_id: url,
      url, title, text,
      author: a.source ? String(a.source) : null,
      lang: a.lang || 'en',
      published_at,
      tags,
      metrics,
      raw: a,
      hash
    });
  }
  log(`GDELT: upserted ${items.length} items`);
}








