-- CreateTable
CREATE TABLE "TrendRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "delta24h" REAL,
    "url" TEXT,
    "region" TEXT,
    "tags" TEXT NOT NULL,
    "raw" TEXT,
    "observedAt" DATETIME NOT NULL,
    "language" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "TrendRecord_source_observedAt_idx" ON "TrendRecord"("source", "observedAt");

-- CreateIndex
CREATE INDEX "TrendRecord_topic_idx" ON "TrendRecord"("topic");
