import { Pool } from "pg";
import { log } from "./logger";

const cs = process.env.PG_URL;
if (!cs) throw new Error("PG_URL not set");

const needsSsl = /neon\.tech/i.test(cs) || (process.env.PG_SSL ?? "").toLowerCase().startsWith("req");

export const pool = new Pool({
  connectionString: cs,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

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
