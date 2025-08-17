#!/bin/bash

# Create types.ts
cat > src/types.ts << 'TYPES_EOF'
import { z } from "zod";

export const SignalRowSchema = z.object({
  source: z.string(),
  entity_id: z.string(),
  entity_name: z.string().optional(),
  topic: z.string().optional(),
  metric: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  window: z.string().optional(),
  region: z.string().optional(),
  url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  raw: z.any().optional(),
  captured_at: z.date().optional(),
  bucket_min: z.date().optional()
});

export type SignalRow = z.infer<typeof SignalRowSchema>;
TYPES_EOF

# Create logger.ts
cat > src/logger.ts << 'LOGGER_EOF'
import pino from "pino";

export const log = pino({ 
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: 'pino/pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});
LOGGER_EOF

# Create utils.ts
cat > src/utils.ts << 'UTILS_EOF'
import axios from "axios";
import pRetry from "p-retry";
import { addMilliseconds } from "date-fns";

export const http = axios.create({
  timeout: 15000,
  headers: { "User-Agent": "trenderai-fresh/1.0" }
});

export async function getJson<T>(url: string, config: any = {}): Promise<T> {
  return pRetry(async () => {
    const res = await http.get<T>(url, config);
    return res.data as T;
  }, { retries: 3 });
}

export function floorToMinute(d = new Date()): Date {
  const ms = d.getTime();
  return new Date(ms - (ms % 60000));
}

export function safe<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  return fn().catch((e) => {
    console.error(`[${label}]`, e?.response?.status, e?.response?.data || e?.message);
    return null;
  });
}
UTILS_EOF

# Create db.ts
cat > src/db.ts << 'DB_EOF'
import { Pool } from "pg";
import { log } from "./logger";

export const pool = new Pool({ connectionString: process.env.PG_URL });

export async function initDb() {
  const sql = `
  CREATE TABLE IF NOT EXISTS signals(
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_name TEXT,
    topic TEXT,
    metric TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit TEXT,
    "window" TEXT,
    region TEXT,
    url TEXT,
    tags TEXT[],
    raw JSONB,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    bucket_min TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', NOW())
  );
  CREATE UNIQUE INDEX IF NOT EXISTS ux_signals_src_ent_metric_win_bucket
    ON signals(source, entity_id, metric, "window", bucket_min);
  CREATE INDEX IF NOT EXISTS ix_signals_ts ON signals(captured_at DESC);
  CREATE INDEX IF NOT EXISTS ix_signals_source_metric ON signals(source, metric);
  `;
  await pool.query(sql);
  log.info("DB ready");
}
DB_EOF

# Create upsert.ts
cat > src/upsert.ts << 'UPSERT_EOF'
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
UPSERT_EOF

echo "Core files created successfully!"
