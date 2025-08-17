import { pool } from "./db";
import { SignalRow } from "./types";
import { floorToMinute } from "./utils";

export async function upsertSignals(rows: SignalRow[]) {
  if (!rows.length) return { inserted: 0 };
  
  const values: any[] = [];
  const placeholders: string[] = [];
  
  rows.forEach((r, i) => {
    const idx = i * 14;
    const bucket = r.bucket_min || floorToMinute(r.captured_at || new Date());
    placeholders.push(`($${idx+1},$${idx+2},$${idx+3},$${idx+4},$${idx+5},$${idx+6},$${idx+7},$${idx+8},$${idx+9},$${idx+10},$${idx+11},$${idx+12},$${idx+13},$${idx+14})`);
    values.push(
      r.source, r.entity_id, r.entity_name || null, r.topic || null, r.metric, r.value,
      r.unit || null, r.window || null, r.region || null, r.url || null, r.tags || null,
      r.raw ? JSON.stringify(r.raw) : null, (r.captured_at || new Date()), bucket
    );
  });

  const sql = `
  INSERT INTO signals(
    source, entity_id, entity_name, topic, metric, value, unit, "window",
    region, url, tags, raw, captured_at, bucket_min
  ) VALUES ${placeholders.join(",")}
  ON CONFLICT (source, entity_id, metric, "window", bucket_min)
  DO UPDATE SET value = EXCLUDED.value, raw = EXCLUDED.raw, captured_at = EXCLUDED.captured_at
  `;
  
  await pool.query(sql, values);
  return { inserted: rows.length };
}
