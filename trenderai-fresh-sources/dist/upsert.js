"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertSignals = upsertSignals;
const db_1 = require("./db");
const utils_1 = require("./utils");
async function upsertSignals(rows) {
    if (!rows.length)
        return { inserted: 0 };
    const values = [];
    const placeholders = [];
    rows.forEach((r, i) => {
        const idx = i * 14;
        const bucket = r.bucket_min || (0, utils_1.floorToMinute)(r.captured_at || new Date());
        placeholders.push(`($${idx + 1},$${idx + 2},$${idx + 3},$${idx + 4},$${idx + 5},$${idx + 6},$${idx + 7},$${idx + 8},$${idx + 9},$${idx + 10},$${idx + 11},$${idx + 12},$${idx + 13},$${idx + 14})`);
        values.push(r.source, r.entity_id, r.entity_name || null, r.topic || null, r.metric, r.value, r.unit || null, r.window || null, r.region || null, r.url || null, r.tags || null, r.raw ? JSON.stringify(r.raw) : null, (r.captured_at || new Date()), bucket);
    });
    const sql = `
  INSERT INTO signals(
    source, entity_id, entity_name, topic, metric, value, unit, "window",
    region, url, tags, raw, captured_at, bucket_min
  ) VALUES ${placeholders.join(",")}
  ON CONFLICT (source, entity_id, metric, "window", bucket_min)
  DO UPDATE SET value = EXCLUDED.value, raw = EXCLUDED.raw, captured_at = EXCLUDED.captured_at
  `;
    await db_1.pool.query(sql, values);
    return { inserted: rows.length };
}
//# sourceMappingURL=upsert.js.map