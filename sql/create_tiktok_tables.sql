-- TikTok Ingestion System Tables
-- Run this SQL to create the TikTok tables

-- TikTokPost table
CREATE TABLE IF NOT EXISTS "TikTokPost" (
  "id" TEXT NOT NULL,
  "postId" VARCHAR(255) NOT NULL,
  "authorId" VARCHAR(255) NOT NULL,
  "authorUsername" VARCHAR(255) NOT NULL,
  "authorDisplayName" VARCHAR(255),
  "authorAvatar" TEXT,
  "authorVerified" BOOLEAN NOT NULL DEFAULT false,
  "authorFollowers" INTEGER DEFAULT 0,
  "authorFollowing" INTEGER DEFAULT 0,
  "authorLikes" INTEGER DEFAULT 0,
  "description" TEXT,
  "hashtags" TEXT[] NOT NULL DEFAULT '{}',
  "mentions" TEXT[] NOT NULL DEFAULT '{}',
  "musicTitle" VARCHAR(500),
  "musicAuthor" VARCHAR(255),
  "videoUrl" TEXT,
  "videoDuration" INTEGER,
  "videoWidth" INTEGER,
  "videoHeight" INTEGER,
  "videoBitrate" INTEGER,
  "videoFormat" VARCHAR(50),
  "likeCount" INTEGER NOT NULL DEFAULT 0,
  "commentCount" INTEGER NOT NULL DEFAULT 0,
  "shareCount" INTEGER NOT NULL DEFAULT 0,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "bookmarkCount" INTEGER NOT NULL DEFAULT 0,
  "postedAt" TIMESTAMPTZ(6) NOT NULL,
  "crawledAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "sourceType" VARCHAR(50) NOT NULL,
  "sourceValue" VARCHAR(255) NOT NULL,
  "ingestEventId" TEXT,
  "rawData" JSONB,
  "region" VARCHAR(10),
  "language" VARCHAR(10),
  "isPrivate" BOOLEAN NOT NULL DEFAULT false,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT "TikTokPost_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TikTokPost_postId_key" UNIQUE ("postId")
);

-- IngestEvent table
CREATE TABLE IF NOT EXISTS "IngestEvent" (
  "id" TEXT NOT NULL,
  "source" VARCHAR(50) NOT NULL,
  "eventType" VARCHAR(50) NOT NULL,
  "sourceValue" VARCHAR(255),
  "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ(6),
  "duration" INTEGER,
  "itemsRequested" INTEGER NOT NULL DEFAULT 0,
  "itemsReceived" INTEGER NOT NULL DEFAULT 0,
  "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
  "itemsSkipped" INTEGER NOT NULL DEFAULT 0,
  "itemsFailed" INTEGER NOT NULL DEFAULT 0,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "errorMessage" TEXT,
  "errorStack" TEXT,
  "config" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT "IngestEvent_pkey" PRIMARY KEY ("id")
);

-- TikTokHourly table
CREATE TABLE IF NOT EXISTS "TikTokHourly" (
  "id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "hour" INTEGER NOT NULL,
  "totalPosts" INTEGER NOT NULL DEFAULT 0,
  "totalLikes" INTEGER NOT NULL DEFAULT 0,
  "totalComments" INTEGER NOT NULL DEFAULT 0,
  "totalShares" INTEGER NOT NULL DEFAULT 0,
  "totalViews" INTEGER NOT NULL DEFAULT 0,
  "totalBookmarks" INTEGER NOT NULL DEFAULT 0,
  "trendingPosts" INTEGER NOT NULL DEFAULT 0,
  "hashtagPosts" INTEGER NOT NULL DEFAULT 0,
  "userPosts" INTEGER NOT NULL DEFAULT 0,
  "topHashtags" JSONB,
  "topAuthors" JSONB,
  "avgLikes" DOUBLE PRECISION DEFAULT 0,
  "avgComments" DOUBLE PRECISION DEFAULT 0,
  "avgShares" DOUBLE PRECISION DEFAULT 0,
  "avgViews" DOUBLE PRECISION DEFAULT 0,
  "engagementRate" DOUBLE PRECISION DEFAULT 0,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT "TikTokHourly_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TikTokHourly_date_hour_key" UNIQUE ("date", "hour")
);

-- Indexes for TikTokPost
CREATE INDEX IF NOT EXISTS "TikTokPost_postId_idx" ON "TikTokPost"("postId");
CREATE INDEX IF NOT EXISTS "TikTokPost_authorId_idx" ON "TikTokPost"("authorId");
CREATE INDEX IF NOT EXISTS "TikTokPost_authorUsername_idx" ON "TikTokPost"("authorUsername");
CREATE INDEX IF NOT EXISTS "TikTokPost_postedAt_idx" ON "TikTokPost"("postedAt");
CREATE INDEX IF NOT EXISTS "TikTokPost_sourceType_sourceValue_idx" ON "TikTokPost"("sourceType", "sourceValue");
CREATE INDEX IF NOT EXISTS "TikTokPost_ingestEventId_idx" ON "TikTokPost"("ingestEventId");
CREATE INDEX IF NOT EXISTS "TikTokPost_hashtags_idx" ON "TikTokPost" USING GIN("hashtags");
CREATE INDEX IF NOT EXISTS "TikTokPost_likeCount_idx" ON "TikTokPost"("likeCount");
CREATE INDEX IF NOT EXISTS "TikTokPost_viewCount_idx" ON "TikTokPost"("viewCount");
CREATE INDEX IF NOT EXISTS "TikTokPost_createdAt_idx" ON "TikTokPost"("createdAt");

-- Indexes for IngestEvent
CREATE INDEX IF NOT EXISTS "IngestEvent_source_idx" ON "IngestEvent"("source");
CREATE INDEX IF NOT EXISTS "IngestEvent_eventType_idx" ON "IngestEvent"("eventType");
CREATE INDEX IF NOT EXISTS "IngestEvent_startedAt_idx" ON "IngestEvent"("startedAt");
CREATE INDEX IF NOT EXISTS "IngestEvent_success_idx" ON "IngestEvent"("success");
CREATE INDEX IF NOT EXISTS "IngestEvent_createdAt_idx" ON "IngestEvent"("createdAt");

-- Indexes for TikTokHourly
CREATE INDEX IF NOT EXISTS "TikTokHourly_date_idx" ON "TikTokHourly"("date");
CREATE INDEX IF NOT EXISTS "TikTokHourly_hour_idx" ON "TikTokHourly"("hour");
CREATE INDEX IF NOT EXISTS "TikTokHourly_createdAt_idx" ON "TikTokHourly"("createdAt");

-- Foreign key constraints
ALTER TABLE "TikTokPost" ADD CONSTRAINT "TikTokPost_ingestEventId_fkey" 
  FOREIGN KEY ("ingestEventId") REFERENCES "IngestEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
