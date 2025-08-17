-- Base signals table (safe if already created by the worker)
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
CREATE INDEX IF NOT EXISTS ix_signals_src_metric ON signals(source, metric);
CREATE INDEX IF NOT EXISTS ix_signals_ent ON signals(entity_id);

-- Trending view: compares last 15 minutes vs prior 24h (excluding last hour)
CREATE OR REPLACE VIEW trending_now AS
WITH now_15m AS (
  SELECT source, entity_id, MAX(entity_name) AS entity_name, metric, COALESCE(region,'') AS region,
         AVG(value) AS now_value
  FROM signals
  WHERE bucket_min >= date_trunc('minute', NOW()) - interval '15 minutes'
  GROUP BY source, entity_id, metric, COALESCE(region,'')
),
baseline AS (
  SELECT source, entity_id, metric, COALESCE(region,'') AS region,
         AVG(value) AS baseline_value
  FROM signals
  WHERE bucket_min >= NOW() - interval '25 hours'
    AND bucket_min <  NOW() - interval '1 hour'
  GROUP BY source, entity_id, metric, COALESCE(region,'')
)
SELECT n.source, n.entity_id, n.entity_name, n.metric, NULLIF(n.region,'') AS region,
       n.now_value, b.baseline_value,
       CASE
         WHEN n.metric LIKE 'rank.%' THEN
           COALESCE( (NULLIF(b.baseline_value,0) - n.now_value) / NULLIF(b.baseline_value,0), 0 )
         ELSE
           COALESCE( (n.now_value - b.baseline_value) / NULLIF(b.baseline_value,0), 0 )
       END AS score
FROM now_15m n
LEFT JOIN baseline b
  ON (n.source=b.source AND n.entity_id=b.entity_id AND n.metric=b.metric AND n.region=b.region);
