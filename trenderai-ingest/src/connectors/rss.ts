import Parser from 'rss-parser';
import { upsertItem } from '../db/index.js';
import { makeHash } from '../lib/hash.js';
import { log } from '../lib/log.js';

const parser = new Parser();

export async function fetchRss() {
  const feedsRaw = process.env.RSS_FEEDS || '';
  const feeds = feedsRaw.split(',').map(s => s.trim()).filter(Boolean);
  if (feeds.length === 0) { log('No RSS_FEEDS defined; skipping'); return; }

  for (const feed of feeds) {
    try {
      const res = await parser.parseURL(feed);
      const items = res.items || [];
      for (const it of items.slice(0, 75)) {
        const url = it.link || '';
        const title = it.title || '';
        const text = it.contentSnippet || it.content || '';
        const published_at = it.isoDate || it.pubDate || null;

        const hash = makeHash(['rss', feed, url, title, (text || '').slice(0, 280)]);
        await upsertItem({
          source: 'rss',
          source_id: url || title,
          url, title, text,
          author: (it as any).creator || (it as any).author || null,
          lang: 'en',
          published_at,
          tags: [res.title || 'rss'],
          metrics: {},
          raw: it,
          hash
        });
      }
      log(`RSS: ${feed} upserted ${Math.min(75, (res.items || []).length)} items`);
    } catch (e:any) {
      log(`RSS: failed ${feed} - ${e?.message}`);
    }
  }
}







