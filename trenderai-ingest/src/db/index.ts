import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const result = await pool.query(text, params);
  return { rows: result.rows as T[] };
}

export async function upsertItem(item: any) {
  const sql = `
    insert into items (source, source_id, url, title, text, author, lang, published_at, tags, metrics, raw, hash)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12)
    on conflict (source, source_id) do update set
      url = excluded.url,
      title = excluded.title,
      text = excluded.text,
      author = excluded.author,
      lang = excluded.lang,
      published_at = excluded.published_at,
      tags = excluded.tags,
      metrics = excluded.metrics,
      raw = excluded.raw,
      hash = excluded.hash,
      updated_at = now()
    returning id;
  `;
  const params = [
    item.source, item.source_id, item.url, item.title, item.text ?? null, item.author ?? null,
    item.lang ?? 'en', item.published_at ?? null, JSON.stringify(item.tags ?? []),
    JSON.stringify(item.metrics ?? {}), JSON.stringify(item.raw ?? {}), item.hash
  ];
  const res = await query(sql, params);
  return res.rows[0]?.id;
}
