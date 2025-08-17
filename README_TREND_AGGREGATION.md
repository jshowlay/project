# TrenderAI Trend Aggregation System

A comprehensive trend aggregation system that collects and normalizes trending content from multiple sources into a unified PostgreSQL database with automated data collection via serverless functions.

## 🚀 Features

- **Multi-Source Integration**: YouTube, Reddit, NYTimes, Google Trends, Twitter/X, TikTok
- **Automated Data Collection**: Cron jobs every 15 minutes via Vercel
- **Type-Safe Architecture**: Full TypeScript implementation with Zod validation
- **Database Layer**: PostgreSQL with connection pooling and upsert functionality
- **API Routes**: RESTful endpoints for data collection and retrieval
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: Built-in rate limiting and retry mechanisms

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- API keys for various services (see Environment Configuration)

## 🛠️ Installation

1. **Install Dependencies**:
   ```bash
   pnpm add pg rss-parser zod
   ```

2. **Environment Configuration**:
   Create `.env.local` with all required API keys (see `env.example.local`)

3. **Database Setup**:
   - Set up PostgreSQL database
   - Configure `DATABASE_URL` in environment variables
   - Run migration: `POST /api/migrate`

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# PostgreSQL Database
DATABASE_URL="postgresql://username:password@localhost:5432/trenderai"

# YouTube API
YOUTUBE_API_KEY="your_youtube_api_key"
YOUTUBE_REGIONS="US,GB,CA,AU,IN,BR,DE,FR,JP,KR"

# Twitter/X API v2
TWITTER_BEARER_TOKEN="your_twitter_bearer_token"
TWITTER_API_KEY="your_twitter_api_key"
TWITTER_API_SECRET="your_twitter_api_secret"
TWITTER_ACCESS_TOKEN="your_twitter_access_token"
TWITTER_ACCESS_TOKEN_SECRET="your_twitter_access_token_secret"

# Reddit RSS Feeds
REDDIT_RSS_FEEDS="https://www.reddit.com/r/worldnews/.rss,https://www.reddit.com/r/technology/.rss"

# Google Trends
GOOGLE_TRENDS_REGIONS="US,GB,CA,AU,IN,BR,DE,FR,JP,KR"
GOOGLE_TRENDS_CATEGORIES="all,news,entertainment,technology,sports"

# New York Times API
NYT_API_KEY="your_nyt_api_key"
NYT_SECTIONS="home,world,national,politics,technology,science,health,sports,arts,books"

# TikTok (Optional)
TIKTOK_DATASET_URL="https://api.apify.com/v2/datasets/your_dataset_id/items?token=your_apify_token"

# Vercel Configuration
VERCEL_CRON_SECRET="your_vercel_cron_secret"
```

## 🗄️ Database Schema

The system uses a single `trends` table with the following structure:

```sql
CREATE TABLE trends (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  region VARCHAR(10) DEFAULT 'global',
  category VARCHAR(50),
  score INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes
- `idx_trends_source` - Source-based queries
- `idx_trends_published_at` - Time-based queries
- `idx_trends_region` - Region-based queries
- `idx_trends_category` - Category-based queries
- `idx_trends_score` - Score-based queries
- `idx_trends_url` - URL-based queries
- `idx_trends_unique` - Unique constraint (source, title, published_at)

## 📡 API Endpoints

### Migration & Setup
- `POST /api/migrate` - Initialize database schema
- `GET /api/migrate` - Get database statistics

### Individual Data Sources
- `POST /api/cron/youtube` - Collect YouTube data
- `GET /api/cron/youtube` - Get YouTube trends
- `POST /api/cron/reddit` - Collect Reddit data
- `GET /api/cron/reddit` - Get Reddit trends
- `POST /api/cron/nyt` - Collect NYTimes data
- `GET /api/cron/nyt` - Get NYTimes trends
- `POST /api/cron/google-trends` - Collect Google Trends data
- `GET /api/cron/google-trends` - Get Google Trends
- `POST /api/cron/twitter` - Collect Twitter data
- `GET /api/cron/twitter` - Get Twitter trends
- `POST /api/cron/tiktok` - Collect TikTok data
- `GET /api/cron/tiktok` - Get TikTok trends

### Master Orchestration
- `POST /api/cron/master` - Run all data collection jobs
- `GET /api/cron/master` - Get overall statistics

## 🔄 Data Sources

### 1. YouTube Integration
- **API**: YouTube Data API v3
- **Data**: Most popular videos by region
- **Features**: 
  - Regional trending videos
  - Category-based filtering
  - Engagement metrics (views, likes, comments)
  - Automatic scoring based on engagement

### 2. Reddit Integration
- **API**: RSS feeds from subreddits
- **Data**: Top posts from configured subreddits
- **Features**:
  - Multiple subreddit support
  - Automatic categorization
  - Content scoring based on age and length
  - Rate limiting for API compliance

### 3. New York Times Integration
- **API**: NYTimes API
- **Data**: Top stories from multiple sections
- **Features**:
  - Section-based article collection
  - Keyword extraction and trending topics
  - Breaking news detection
  - Semantic enrichment

### 4. Google Trends Integration
- **API**: Google Trends API
- **Data**: Real-time trending searches
- **Features**:
  - Regional trending searches
  - Category-based trends
  - Traffic analysis
  - Related articles

### 5. Twitter/X Integration
- **API**: Twitter API v2
- **Data**: Recent tweets and trending topics
- **Features**:
  - Search-based tweet collection
  - Trending hashtag detection
  - User timeline monitoring
  - Engagement metrics

### 6. TikTok Integration
- **API**: External dataset via Apify
- **Data**: Trending videos
- **Features**:
  - Optional integration
  - Hashtag-based filtering
  - Engagement metrics
  - Content categorization

## 🕐 Cron Job Schedule

The system uses Vercel cron jobs with the following schedule:

```json
{
  "crons": [
    {
      "path": "/api/cron/master",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

- **Frequency**: Every 15 minutes
- **Master Job**: Orchestrates all data collection
- **Individual Jobs**: Can be triggered independently
- **Timeout**: 5 minutes for master job, 1 minute for individual jobs

## 🏗️ Architecture

### Database Layer (`lib/database.ts`)
- PostgreSQL connection pool
- Type-safe query interface
- Automated schema creation
- Upsert functionality for deduplication

### Data Sources (`lib/sources/`)
- Modular source implementations
- Type-safe data transformation
- Error handling and retry logic
- Rate limiting and API compliance

### API Routes (`app/api/cron/`)
- Serverless functions
- Authorization via Vercel cron secret
- Comprehensive error handling
- Detailed logging and monitoring

### Data Flow
1. **Cron Trigger** → Master endpoint
2. **Parallel Collection** → All data sources
3. **Data Transformation** → Normalized format
4. **Database Upsert** → Deduplication and storage
5. **Cleanup** → Remove old trends

## 📊 Data Normalization

All data sources are normalized to a common `TrendData` format:

```typescript
interface TrendData {
  source: 'youtube' | 'reddit' | 'nyt' | 'google_trends' | 'twitter' | 'tiktok';
  title: string;
  description?: string;
  url?: string;
  published_at: Date;
  region: string;
  category?: string;
  score: number;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}
```

### Scoring Algorithm
Each source implements its own scoring algorithm:
- **YouTube**: Views/1000 + likes×10 + comments×50
- **Reddit**: Time-based score + content length bonus
- **NYTimes**: Section importance + word count + recency
- **Google Trends**: Traffic-based scoring
- **Twitter**: Engagement metrics (retweets, likes, replies)
- **TikTok**: Play count + engagement metrics

## 🔒 Security

- **API Authorization**: Vercel cron secret for endpoint protection
- **Environment Variables**: Secure storage of API keys
- **Rate Limiting**: Built-in delays between API calls
- **Error Handling**: Graceful failure handling
- **Data Validation**: Zod schema validation

## 🚀 Deployment

### Vercel Deployment
1. **Connect Repository**: Link to Vercel
2. **Environment Variables**: Set all required variables
3. **Database**: Configure PostgreSQL connection
4. **Cron Jobs**: Automatically configured via `vercel.json`

### Local Development
1. **Database**: Set up local PostgreSQL
2. **Environment**: Copy `env.example.local` to `.env.local`
3. **API Keys**: Obtain required API keys
4. **Migration**: Run `POST /api/migrate`
5. **Testing**: Use individual endpoints for testing

## 📈 Monitoring

### Logging
- Console logging for all operations
- Error tracking and reporting
- Performance metrics
- Data collection statistics

### Metrics
- Collection success rates
- Data volume per source
- Processing time
- Error rates and types

### Health Checks
- Database connectivity
- API endpoint availability
- Data freshness
- System performance

## 🔧 Configuration

### Rate Limiting
- YouTube: 1 second between requests
- Reddit: 2 seconds between feeds
- NYTimes: 1 second between sections
- Google Trends: 2 seconds between regions
- Twitter: 1 second between queries
- TikTok: 1 second between hashtags

### Data Retention
- **Default**: 30 days
- **Configurable**: Via `cleanOldTrends()` method
- **Automatic**: Cleanup runs after each master job

### Batch Processing
- **Parallel Collection**: All sources run simultaneously
- **Error Isolation**: Individual source failures don't affect others
- **Retry Logic**: Built-in retry mechanisms for transient failures

## 🐛 Troubleshooting

### Common Issues

1. **API Rate Limits**
   - Check rate limiting configuration
   - Verify API key quotas
   - Monitor request frequency

2. **Database Connection**
   - Verify `DATABASE_URL` format
   - Check PostgreSQL server status
   - Test connection pool settings

3. **Missing Data**
   - Check API key validity
   - Verify source availability
   - Review error logs

4. **Cron Job Failures**
   - Check Vercel cron secret
   - Verify endpoint accessibility
   - Review function timeouts

### Debugging

1. **Enable Debug Logging**:
   ```bash
   LOG_LEVEL=debug
   ```

2. **Test Individual Sources**:
   ```bash
   curl -X POST /api/cron/youtube
   curl -X POST /api/cron/reddit
   ```

3. **Check Database Status**:
   ```bash
   curl -X GET /api/migrate
   ```

## 📚 API Documentation

### Authentication
All POST endpoints require authorization:
```bash
Authorization: Bearer your_vercel_cron_secret
```

### Response Format
```json
{
  "success": true,
  "message": "Operation completed",
  "count": 42,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 🤝 Contributing

1. **Fork Repository**
2. **Create Feature Branch**
3. **Implement Changes**
4. **Add Tests**
5. **Submit Pull Request**

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review error logs
- Test individual endpoints
- Verify environment configuration
