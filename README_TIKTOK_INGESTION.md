# TikTok Ingestion System

A complete, production-ready TikTok data ingestion system for the Trender AI platform. This system fetches TikTok posts from various sources using the Apify TikTok Scraper actor, normalizes the data, and stores it in PostgreSQL with comprehensive analytics and monitoring.

## 🚀 Features

- **Multi-source ingestion**: Trending posts, hashtag-based posts, and user-specific posts
- **Real-time processing**: Runs every 15 minutes via cron
- **Data normalization**: Converts raw TikTok data into structured format
- **Deduplication**: Prevents duplicate posts by TikTok post ID
- **Hourly aggregations**: Generates analytics summaries every hour
- **Comprehensive logging**: Detailed logging for monitoring and debugging
- **Error handling**: Robust error handling with dead letter queue support
- **Rate limiting**: Configurable rate limits to respect API boundaries
- **Data cleanup**: Automatic cleanup of old data based on configurable retention

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Apify account with TikTok Scraper actor access
- Next.js 14+ application

## 🛠️ Installation

### 1. Database Setup

Run the database migration to create the required tables:

```bash
npm run tiktok:setup
```

This creates three main tables:
- `TikTokPost`: Stores individual TikTok posts
- `IngestEvent`: Tracks ingestion events and metadata
- `TikTokHourly`: Stores hourly aggregations for analytics

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# TikTok Ingestion System
TIKTOK_APIFY_TOKEN=your-apify-token
TIKTOK_APIFY_ACTOR_ID=apify/actor-tiktok-scraper
TIKTOK_APIFY_USER_ID=your-apify-user-id

# TikTok Data Sources (comma-separated)
# Format: trending,hashtag:ai,hashtag:tech,user:nike,user:apple
TIKTOK_SOURCES=trending,hashtag:ai,hashtag:tech

# TikTok Ingestion Configuration
TIKTOK_INGEST_ENABLED=true
TIKTOK_INGEST_CRON=*/15 * * * *  # Every 15 minutes
TIKTOK_MAX_POSTS_PER_SOURCE=50
TIKTOK_MIN_POST_AGE_HOURS=1      # Only fetch posts from last hour
TIKTOK_MAX_POST_AGE_HOURS=24     # Don't fetch posts older than 24 hours
TIKTOK_RATE_LIMIT_DELAY_MS=1000  # Delay between API calls
TIKTOK_MAX_RETRIES=3
TIKTOK_RETRY_DELAY_MS=5000

# TikTok Data Processing
TIKTOK_ENABLE_HOURLY_AGGREGATION=true
TIKTOK_AGGREGATION_CRON=0 * * * *  # Every hour
TIKTOK_CLEANUP_OLD_DATA_DAYS=30    # Keep data for 30 days
TIKTOK_ENABLE_DEAD_LETTER_QUEUE=true

# TikTok API Configuration
TIKTOK_API_TIMEOUT_MS=30000
TIKTOK_API_MAX_CONCURRENT_REQUESTS=3
TIKTOK_ENABLE_RAW_DATA_STORAGE=true
TIKTOK_ENABLE_DEBUG_LOGGING=false
```

### 3. Apify Setup

1. Create an account at [Apify](https://apify.com)
2. Subscribe to the TikTok Scraper actor
3. Get your API token from the Apify console
4. Set the `TIKTOK_APIFY_TOKEN` environment variable

## 📊 Data Sources Configuration

The system supports three types of data sources:

### Trending Posts
```bash
TIKTOK_SOURCES=trending
```

### Hashtag-based Posts
```bash
TIKTOK_SOURCES=hashtag:ai,hashtag:tech,hashtag:startup
```

### User-specific Posts
```bash
TIKTOK_SOURCES=user:nike,user:apple,user:tesla
```

### Mixed Sources
```bash
TIKTOK_SOURCES=trending,hashtag:ai,user:nike
```

## 🚀 Usage

### Manual Ingestion

Trigger ingestion manually via API:

```bash
# Test the system
npm run tiktok:test-system

# Trigger ingestion
curl -X POST http://localhost:3000/api/ingest/tiktok \
  -H 'Authorization: Bearer your-cron-secret' \
  -H 'Content-Type: application/json'

# Check status
curl -X GET http://localhost:3000/api/ingest/tiktok \
  -H 'Authorization: Bearer your-cron-secret'
```

### Automated Ingestion

The system is configured to run automatically via Vercel cron jobs:

- **Ingestion**: Every 15 minutes (`*/15 * * * *`)
- **Aggregation**: Every hour (`0 * * * *`)

### Command Line Tools

```bash
# Run ingestion manually
npm run tiktok:ingest

# Test the system
npm run tiktok:test-system

# Check API status
npm run tiktok:status

# Test API endpoint
npm run tiktok:test
```

## 📈 Data Schema

### TikTokPost Table

Stores individual TikTok posts with comprehensive metadata:

```sql
CREATE TABLE "TikTokPost" (
  "id" TEXT PRIMARY KEY,
  "postId" VARCHAR(255) UNIQUE NOT NULL,  -- TikTok's unique post ID
  "authorId" VARCHAR(255) NOT NULL,       -- TikTok user ID
  "authorUsername" VARCHAR(255) NOT NULL, -- Username
  "authorDisplayName" VARCHAR(255),       -- Display name
  "authorAvatar" TEXT,                    -- Avatar URL
  "authorVerified" BOOLEAN DEFAULT false,
  "authorFollowers" INTEGER DEFAULT 0,
  "authorFollowing" INTEGER DEFAULT 0,
  "authorLikes" INTEGER DEFAULT 0,
  
  "description" TEXT,                     -- Post description
  "hashtags" TEXT[] DEFAULT '{}',         -- Array of hashtags
  "mentions" TEXT[] DEFAULT '{}',         -- Array of mentioned users
  "musicTitle" VARCHAR(500),              -- Music title
  "musicAuthor" VARCHAR(255),             -- Music author
  
  "videoUrl" TEXT,                        -- Video URL
  "videoDuration" INTEGER,                -- Duration in seconds
  "videoWidth" INTEGER,                   -- Video width
  "videoHeight" INTEGER,                  -- Video height
  "videoBitrate" INTEGER,                 -- Video bitrate
  "videoFormat" VARCHAR(50),              -- Video format
  
  "likeCount" INTEGER DEFAULT 0,          -- Like count
  "commentCount" INTEGER DEFAULT 0,       -- Comment count
  "shareCount" INTEGER DEFAULT 0,         -- Share count
  "viewCount" INTEGER DEFAULT 0,          -- View count
  "bookmarkCount" INTEGER DEFAULT 0,      -- Bookmark count
  
  "postedAt" TIMESTAMPTZ(6) NOT NULL,     -- When posted
  "crawledAt" TIMESTAMPTZ(6) DEFAULT NOW(), -- When crawled
  
  "sourceType" VARCHAR(50) NOT NULL,      -- 'trending', 'hashtag', 'user'
  "sourceValue" VARCHAR(255) NOT NULL,    -- hashtag name, username, etc.
  "ingestEventId" TEXT,                   -- Reference to ingest event
  
  "rawData" JSONB,                        -- Raw data from Apify
  "region" VARCHAR(10),                   -- Region
  "language" VARCHAR(10),                 -- Language
  "isPrivate" BOOLEAN DEFAULT false,      -- Is private post
  "isDeleted" BOOLEAN DEFAULT false,      -- Is deleted post
  
  "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW()
);
```

### IngestEvent Table

Tracks ingestion events for monitoring and debugging:

```sql
CREATE TABLE "IngestEvent" (
  "id" TEXT PRIMARY KEY,
  "source" VARCHAR(50) NOT NULL,          -- 'tiktok'
  "eventType" VARCHAR(50) NOT NULL,       -- 'trending', 'hashtag', 'user'
  "sourceValue" VARCHAR(255),             -- hashtag, username, etc.
  
  "startedAt" TIMESTAMPTZ(6) DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ(6),
  "duration" INTEGER,                     -- Duration in milliseconds
  
  "itemsRequested" INTEGER DEFAULT 0,     -- Items requested
  "itemsReceived" INTEGER DEFAULT 0,      -- Items received
  "itemsProcessed" INTEGER DEFAULT 0,     -- Items processed
  "itemsSkipped" INTEGER DEFAULT 0,       -- Items skipped
  "itemsFailed" INTEGER DEFAULT 0,        -- Items failed
  
  "success" BOOLEAN DEFAULT false,        -- Success status
  "errorMessage" TEXT,                    -- Error message
  "errorStack" TEXT,                      -- Error stack trace
  "config" JSONB,                         -- Configuration used
  
  "createdAt" TIMESTAMPTZ(6) DEFAULT NOW()
);
```

### TikTokHourly Table

Stores hourly aggregations for efficient analytics:

```sql
CREATE TABLE "TikTokHourly" (
  "id" TEXT PRIMARY KEY,
  "date" DATE NOT NULL,                   -- Date
  "hour" INTEGER NOT NULL,                -- Hour (0-23)
  
  "totalPosts" INTEGER DEFAULT 0,         -- Total posts
  "totalLikes" INTEGER DEFAULT 0,         -- Total likes
  "totalComments" INTEGER DEFAULT 0,      -- Total comments
  "totalShares" INTEGER DEFAULT 0,        -- Total shares
  "totalViews" INTEGER DEFAULT 0,         -- Total views
  "totalBookmarks" INTEGER DEFAULT 0,     -- Total bookmarks
  
  "trendingPosts" INTEGER DEFAULT 0,      -- Trending posts count
  "hashtagPosts" INTEGER DEFAULT 0,       -- Hashtag posts count
  "userPosts" INTEGER DEFAULT 0,          -- User posts count
  
  "topHashtags" JSONB,                    -- Top hashtags with counts
  "topAuthors" JSONB,                     -- Top authors with stats
  
  "avgLikes" DOUBLE PRECISION DEFAULT 0,  -- Average likes
  "avgComments" DOUBLE PRECISION DEFAULT 0, -- Average comments
  "avgShares" DOUBLE PRECISION DEFAULT 0, -- Average shares
  "avgViews" DOUBLE PRECISION DEFAULT 0,  -- Average views
  "engagementRate" DOUBLE PRECISION DEFAULT 0, -- Engagement rate
  
  "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW(),
  
  UNIQUE("date", "hour")
);
```

## 🔧 Configuration Options

### Rate Limiting

```bash
# Delay between API calls (milliseconds)
TIKTOK_RATE_LIMIT_DELAY_MS=1000

# Maximum concurrent requests
TIKTOK_API_MAX_CONCURRENT_REQUESTS=3

# API timeout (milliseconds)
TIKTOK_API_TIMEOUT_MS=30000
```

### Data Filtering

```bash
# Only fetch posts from last hour
TIKTOK_MIN_POST_AGE_HOURS=1

# Don't fetch posts older than 24 hours
TIKTOK_MAX_POST_AGE_HOURS=24

# Maximum posts per source
TIKTOK_MAX_POSTS_PER_SOURCE=50
```

### Data Retention

```bash
# Keep data for 30 days
TIKTOK_CLEANUP_OLD_DATA_DAYS=30

# Enable dead letter queue
TIKTOK_ENABLE_DEAD_LETTER_QUEUE=true
```

### Debugging

```bash
# Enable debug logging
TIKTOK_ENABLE_DEBUG_LOGGING=false

# Store raw data from Apify
TIKTOK_ENABLE_RAW_DATA_STORAGE=true
```

## 📊 Monitoring and Analytics

### API Endpoints

- `GET /api/ingest/tiktok` - Get system status and configuration
- `POST /api/ingest/tiktok` - Trigger manual ingestion

### Logging

The system provides comprehensive logging with the following levels:
- `info`: General operational information
- `warn`: Warnings and non-critical issues
- `error`: Errors and failures
- `debug`: Detailed debugging information

### Metrics

The system tracks various metrics:
- Posts processed per source
- Success/failure rates
- Processing duration
- Data quality metrics
- API usage statistics

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check that `CRON_SECRET` is set correctly
   - Verify the Authorization header format

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is set correctly
   - Check database permissions
   - Run `npm run tiktok:setup` to create tables

3. **Apify API Issues**
   - Verify `TIKTOK_APIFY_TOKEN` is valid
   - Check Apify account status and quotas
   - Test token with `npm run tiktok:test-system`

4. **No Data Retrieved**
   - Check source configuration in `TIKTOK_SOURCES`
   - Verify time window settings
   - Check Apify actor availability

### Debug Commands

```bash
# Test system components
npm run tiktok:test-system

# Check database tables
npm run tiktok:setup

# Test API endpoints
npm run tiktok:status
npm run tiktok:test

# Run manual ingestion
npm run tiktok:ingest
```

## 🔄 Deployment

### Vercel Deployment

The system is configured for Vercel deployment with cron jobs:

```json
{
  "crons": [
    { "path": "/api/ingest/tiktok", "schedule": "*/15 * * * *" }
  ],
  "functions": {
    "app/api/ingest/tiktok/route.ts": {
      "maxDuration": 300
    }
  }
}
```

### Environment Variables

Make sure to set all required environment variables in your Vercel project settings.

### Database Migration

Run the database setup script in your production environment:

```bash
npm run tiktok:setup
```

## 📝 API Reference

### POST /api/ingest/tiktok

Trigger manual TikTok ingestion.

**Headers:**
- `Authorization: Bearer <cron-secret>`
- `Content-Type: application/json`

**Body (optional):**
```json
{
  "sources": ["trending", "hashtag:ai"],
  "force": true,
  "skipAggregation": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "TikTok ingestion completed successfully",
  "duration": 45000,
  "stats": {
    "totalProcessed": 150,
    "totalSkipped": 10,
    "totalFailed": 0,
    "errorCount": 0
  },
  "timestamp": "2025-08-23T20:30:00.000Z"
}
```

### GET /api/ingest/tiktok

Get TikTok ingestion system status and configuration.

**Headers:**
- `Authorization: Bearer <cron-secret>`

**Response:**
```json
{
  "config": {
    "enabled": true,
    "sources": "trending,hashtag:ai,hashtag:tech",
    "maxPostsPerSource": 50,
    "cronSchedule": "*/15 * * * *",
    "hourlyAggregation": true,
    "cleanupEnabled": true,
    "cleanupDays": 30
  },
  "stats": {
    "totalPosts": 1250,
    "uniqueAuthors": 450,
    "uniqueSources": 3,
    "latestPost": "2025-08-23T20:25:00.000Z",
    "earliestPost": "2025-08-22T20:00:00.000Z"
  },
  "recentEvents": [
    {
      "id": "clx123",
      "eventType": "trending",
      "sourceValue": "trending",
      "startedAt": "2025-08-23T20:15:00.000Z",
      "completedAt": "2025-08-23T20:15:45.000Z",
      "duration": 45000,
      "itemsProcessed": 50,
      "success": true
    }
  ],
  "timestamp": "2025-08-23T20:30:00.000Z"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Test individual components with the provided test scripts
4. Open an issue with detailed error information
