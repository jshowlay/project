import 'dotenv/config';
import { pool } from '../lib/db.js';
import { timesTagsSuggest } from '../integrations/nytimes/semanticClient.js';
import { foldSuggestionsToEntities, mergeEntities } from '../integrations/nytimes/semanticMapper.js';

const MAX_RESULTS = Number(process.env.NYT_SEMANTIC_MAX_RESULTS || 10);
const WINDOW_HOURS = Number(process.env.NYT_SEMANTIC_SAMPLE_WINDOW_HOURS || 24);

async function cachedSuggest(q: string) {
  const hit = await pool.query('select results from nyt_concept_cache where q=$1', [q]);
  if (hit.rows[0]) return hit.rows[0].results;
  const results = await timesTagsSuggest(q, MAX_RESULTS);
  await pool.query(
    `insert into nyt_concept_cache (q, results, updated_at)
     values ($1,$2,now())
     on conflict (q) do update set results=excluded.results, updated_at=now()`,
    [q, JSON.stringify(results)]
  );
  return results;
}

async function fetchCandidateItems() {
  const { rows } = await pool.query(
    `
    select id, tags, entities
    from content_items
    where source='nytimes'
      and published_at >= now() - ($1::int || ' hours')::interval
      and (tags is not null or (entities is null or jsonb_array_length(coalesce(entities->'per','[]'::jsonb))=0))
    limit 500
    `,
    [WINDOW_HOURS]
  );
  return rows as Array<{ id: string; tags: string[] | null; entities: any | null }>;
}

async function updateEntities(id: string, newEntities: any) {
  await pool.query(
    `update content_items set entities = coalesce(entities,'{}'::jsonb) || $2::jsonb where id=$1`,
    [id, JSON.stringify(newEntities)]
  );
}

async function main() {
  const items = await fetchCandidateItems();
  let enriched = 0;

  for (const item of items) {
    const terms = Array.from(new Set([...(item.tags || [])]))
      .map(t => String(t).trim())
      .filter(Boolean)
      .slice(0, 25); // cap per item

    let combined: any = null;
    for (const t of terms) {
      try {
        const suggestions = await cachedSuggest(t);
        const e = foldSuggestionsToEntities(suggestions || []);
        combined = mergeEntities(combined, e);
      } catch (e) {
        // soft-fail per term
        continue;
      }
    }
    if (combined && Object.keys(combined).length) {
      await updateEntities(item.id, combined);
      enriched++;
    }
  }

  console.log(JSON.stringify({ ok: true, scanned: items.length, enriched }, null, 2));
  await pool.end();
}

main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1); });
