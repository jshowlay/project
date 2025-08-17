import 'dotenv/config';
import { pool } from '../lib/db.js';
import { TimesWire, TopStories, MostPopular, ArticleSearch, Archive } from '../integrations/nytimes/nytClient.js';
import { mapTimesWire, mapTopStories, mapMostPopular, mapArticleSearch, mapArchive, NormalizedItem } from '../integrations/nytimes/mappers.js';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function upsert(items: NormalizedItem[]) {
  if (!items.length) return { inserted: 0, updated: 0 };
  
  // Use individual inserts for better error handling
  let inserted = 0;
  for (const item of items) {
    try {
      const text = `
        insert into content_items
          (id, source, channel, url, title, abstract, byline, section, subsection, published_at, updated_at, tags, entities, media, popularity, editorial, raw)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        on conflict (id) do update set
          updated_at = excluded.updated_at,
          popularity = coalesce(excluded.popularity, content_items.popularity),
          raw = excluded.raw
      `;
      const values = [
        item.id, item.source, item.channel, item.url, item.title ?? null, item.abstract ?? null, item.byline ?? null,
        item.section ?? null, item.subsection ?? null, item.published_at ?? null, item.updated_at ?? null,
        item.tags ?? null, item.entities ?? null, item.media ?? null, item.popularity ?? null,
        item.editorial ?? false, JSON.stringify(item.raw)
      ];
      await pool.query(text, values);
      inserted++;
    } catch (error) {
      console.error(`Failed to upsert item ${item.id}:`, error);
    }
  }
  return { inserted, updated: 0 };
}

async function ingestTimesWire() {
  const hours = Number(process.env.NYT_TIMESWIRE_HOURS || 24);
  const res = await TimesWire.list('all','all',{ limit: 100, offset: 0, 'time-period': hours });
  const normalized = mapTimesWire(res);
  await upsert(normalized);
  return { timeswire: normalized.length };
}

async function ingestTopStories() {
  const sections = (process.env.NYT_TOP_SECTIONS || 'home').split(',').map(s=>s.trim()).filter(Boolean);
  let total = 0;
  for (const s of sections) {
    const r = await TopStories.section(s);
    const items = mapTopStories(r, s);
    await upsert(items);
    total += items.length;
    await sleep(2000); // increased delay to avoid rate limits
  }
  return { topstories: total };
}

async function ingestMostPopular() {
  const periods = (process.env.NYT_MOSTPOPULAR_PERIODS || '1,7').split(',').map(n=>Number(n.trim())||1);
  let total = 0;
  for (const p of periods) {
    const lists: Array<['viewed'|'shared'|'emailed', number]> = [['viewed',p], ['shared',p], ['emailed',p]];
    for (const [list, period] of lists) {
      const r = await (list==='viewed' ? MostPopular.viewed(period) : list==='shared' ? MostPopular.shared(period) : MostPopular.emailed(period));
      const items = mapMostPopular(r, list, period);
      await upsert(items);
      total += items.length;
      await sleep(2000); // increased delay to avoid rate limits
    }
  }
  return { mostpopular: total };
}

async function backfillArticleSearchExample() {
  // Example: backfill last 7 days of technology/business articles
  const today = new Date();
  const start = new Date(today.getTime() - 7*24*3600*1000);
  const fmt = (d: Date) => d.toISOString().slice(0,10).replace(/-/g,'');
  const params = { fq: 'section_name:("Technology" "Business") AND type_of_material:("News" "Article")', begin_date: fmt(start), end_date: fmt(today), sort:'newest' as const };
  let page = 0, total = 0;
  while (page < 5) { // first 5 pages as a sane default
    const r = await ArticleSearch.search({ ...params, page });
    const items = mapArticleSearch(r);
    if (!items.length) break;
    await upsert(items);
    total += items.length;
    page++;
    await sleep(750); // ~10/min safety
  }
  return { articlesearch: total };
}

async function backfillArchiveRecentMonths() {
  const now = new Date();
  const months = [0,1].map(n => {
    const d = new Date(now); d.setMonth(d.getMonth() - n);
    return { y: d.getFullYear(), m: d.getMonth()+1 };
  });
  let total = 0;
  for (const {y,m} of months) {
    const r = await Archive.month(y, m);
    const items = mapArchive(r);
    await upsert(items);
    total += items.length;
    await sleep(1000);
  }
  return { archive: total };
}

async function main() {
  const args = process.argv.slice(2);
  const doBackfill = args.includes('--backfill');

  const results: any = {};
  
  results.timeswire = (await ingestTimesWire()).timeswire;
  results.topstories = (await ingestTopStories()).topstories;
  results.mostpopular = (await ingestMostPopular()).mostpopular;

  if (doBackfill) {
    results.articlesearch = (await backfillArticleSearchExample()).articlesearch;
    results.archive = (await backfillArchiveRecentMonths()).archive;
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2));
  await pool.end();
}

main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1); });
