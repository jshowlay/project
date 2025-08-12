-- Ensure extensions used by search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Helpful indexes (if not present)
CREATE INDEX IF NOT EXISTS tr_topic_fts_idx
ON "TrendRecord" USING GIN (to_tsvector('english', "topic"));
CREATE INDEX IF NOT EXISTS tr_topic_trgm_idx
ON "TrendRecord" USING GIN ("topic" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS tr_source_observed_idx
ON "TrendRecord" ("source", "observedAt" DESC);

-- Materialized view for FTS (topic)
CREATE MATERIALIZED VIEW IF NOT EXISTS tr_trends_mv AS
SELECT
  id, source, topic, score, delta24h, url, region, tags, observedAt, language,
  to_tsvector('english', coalesce(topic, '')) AS tsv
FROM "TrendRecord";

CREATE UNIQUE INDEX IF NOT EXISTS tr_mv_id_idx ON tr_trends_mv (id);
CREATE INDEX IF NOT EXISTS tr_mv_tsv_idx ON tr_trends_mv USING GIN (tsv);
CREATE INDEX IF NOT EXISTS tr_mv_observed_idx ON tr_trends_mv ("observedAt" DESC);
