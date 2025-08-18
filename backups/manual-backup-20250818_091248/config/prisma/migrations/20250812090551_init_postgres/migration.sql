-- CreateTable
CREATE TABLE "public"."TrendRecord" (
    "id" TEXT NOT NULL,
    "source" VARCHAR(32) NOT NULL,
    "topic" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "delta24h" DOUBLE PRECISION,
    "url" TEXT,
    "region" TEXT,
    "tags" TEXT[],
    "raw" JSONB,
    "observedAt" TIMESTAMPTZ(6) NOT NULL,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observedBucket" TIMESTAMPTZ(6),

    CONSTRAINT "TrendRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrendRecord_source_observedAt_idx" ON "public"."TrendRecord"("source", "observedAt");

-- CreateIndex
CREATE INDEX "TrendRecord_topic_idx" ON "public"."TrendRecord"("topic");

-- CreateIndex
CREATE UNIQUE INDEX "TrendRecord_source_topic_observedBucket_key" ON "public"."TrendRecord"("source", "topic", "observedBucket");
