-- 1) Add observedBucket and backfill with hour-truncated observedAt
ALTER TABLE "TrendRecord" ADD COLUMN "observedBucket" DATETIME;
UPDATE "TrendRecord"
SET "observedBucket" = datetime("observedAt", 'start of hour')
WHERE "observedBucket" IS NULL;

-- 2) Unique index for de-dupe upsert
CREATE UNIQUE INDEX IF NOT EXISTS "source_topic_observedBucket" ON "TrendRecord" ("source", "topic", "observedBucket");

-- Note: SQLite doesn't support materialized views, so we'll use regular indexes for FTS
-- The search optimization will be handled in the application layer
