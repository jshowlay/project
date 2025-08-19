# TrenderAI Data Pipeline

A comprehensive data ingestion pipeline that fetches trending data from multiple sources, stores it in PostgreSQL, and provides real-time trend analysis.

## 🚀 Features

- **Multi-source data ingestion**: Reddit, NYTimes, YouTube
- **Real-time trend analysis**: Materialized views with trend scores and velocity
- **Secure API endpoints**: Secret-based authentication
- **Automated scheduling**: Cron jobs for continuous data collection
- **Comprehensive logging**: Structured logging with Pino
- **Health monitoring**: System health checks and error handling
- **Scalable architecture**: Connection pooling and batch processing

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Environment variables configured

## 🛠️ Installation & Setup

### 1. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example.local .env.local
```

Edit `.env.local` with your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
INGEST_SECRET="your-super-secret-key-here"

# Feature Toggles
ENABLE_REDDIT=true
ENABLE_NYTIMES=false
ENABLE_YOUTUBE=false

# API Keys (optional)
NYTIMES_API_KEY=""
YOUTUBE_API_KEY=""

# Reddit Configuration
REDDIT_SUBREDDITS="all,popular,trending"
REDDIT_LIMIT=25

# Logging
LOG_LEVEL="info"
NODE_ENV="development"
```

### 2. Database Initialization

Initialize the database schema and materialized views:

```bash
npm run db:init
```

This creates:
- `trend_items` table for storing raw data
- `mv_trends_hourly` materialized view for trend analysis
- Indexes for optimal performance
- Refresh function for materialized views

### 3. Install Dependencies

```bash
pnpm install
```

## 🔧 Usage

### Manual Ingestion

Run a single ingestion cycle:

```bash
npm run ingest:run
```

### Automated Scheduling

Start the cron job scheduler (runs every 15 minutes):

```bash
npm run cron:start
```

### Database Management

Refresh the materialized view:

```bash
npm run db:refresh-mv
```

## 🌐 API Endpoints

### POST /api/ingest

Trigger data ingestion with secret authentication.

**Authentication**: Query parameter `?secret=your-secret`

**Request Body** (optional):
```json
{
  "batch": false,
  "batchSize": 100
}
```

**Response**:
```json
{
  "success": true,
  "message": "Data ingestion completed successfully",
  "data": {
    "totalItems": 150,
    "sourcesProcessed": 3,
    "duration": 2500,
    "errors": []
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/trends

Fetch trending data with filtering options.

**Query Parameters**:
- `source`: Filter by data source (e.g., "reddit", "nytimes")
- `limit`: Maximum number of items (default: 50, max: 100)
- `minTrendScore`: Minimum trend score threshold
- `minVelocity`: Minimum velocity threshold
- `stats`: Include statistics (true/false)

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "source": "reddit",
        "external_id": "abc123",
        "title": "Trending Topic",
        "topic": "technology",
        "url": "https://reddit.com/...",
        "score": 1500,
        "trend_score": 75,
        "velocity": 25,
        "acceleration": 5,
        "upvotes": 1200,
        "comments": 300,
        "created_at": "2024-01-15T10:00:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "stats": {
      "totalItems": 1500,
      "totalSources": 3,
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    },
    "availableSources": ["reddit", "nytimes", "youtube"]
  },
  "meta": {
    "source": "all",
    "limit": 50,
    "minTrendScore": 0,
    "minVelocity": 0,
    "duration": 45
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/health

System health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "duration": 25,
  "checks": {
    "database": {
      "healthy": true,
      "error": null
    },
    "materializedView": {
      "healthy": true,
      "error": null
    },
    "ingestion": {
      "healthy": true,
      "sources": ["RedditSource", "NYTimesSource"],
      "errors": []
    },
    "environment": {
      "DATABASE_URL": true,
      "INGEST_SECRET": true,
      "ENABLE_REDDIT": true,
      "ENABLE_NYTIMES": false,
      "ENABLE_YOUTUBE": false
    }
  }
}
```

## 📊 Data Sources

### Reddit (No API Key Required)

Fetches trending posts from specified subreddits.

**Configuration**:
- `ENABLE_REDDIT`: Enable/disable Reddit source
- `REDDIT_SUBREDDITS`: Comma-separated list of subreddits
- `REDDIT_LIMIT`: Number of posts per subreddit
- `REDDIT_RATE_LIMIT_MS`: Rate limiting delay

### NYTimes (Requires API Key)

Fetches most popular articles.

**Configuration**:
- `ENABLE_NYTIMES`: Enable NYTimes source
- `NYTIMES_API_KEY`: Your NYTimes API key
- `NYTIMES_SECTION`: Section to fetch (default: "mostpopular")
- `NYTIMES_RATE_LIMIT_MS`: Rate limiting delay

### YouTube (Requires API Key)

Fetches trending videos.

**Configuration**:
- `ENABLE_YOUTUBE`: Enable YouTube source
- `YOUTUBE_API_KEY`: Your YouTube API key
- `YOUTUBE_REGION_CODE`: Region for trending videos
- `YOUTUBE_VIDEO_CATEGORY_ID`: Video category filter
- `YOUTUBE_RATE_LIMIT_MS`: Rate limiting delay

## 🗄️ Database Schema

### trend_items Table

```sql
CREATE TABLE trend_items (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  topic VARCHAR(255),
  url TEXT,
  score INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source, external_id)
);
```

### mv_trends_hourly Materialized View

Calculates trend scores, velocity, and acceleration by comparing recent data (last 60 minutes) with baseline data (prior 24 hours).

**Key Metrics**:
- `trend_score`: Percentage change in score vs baseline
- `velocity`: Rate of change per hour
- `acceleration`: Change in velocity over time

## 🔍 Trend Analysis

The system calculates trend metrics by:

1. **Baseline Calculation**: Average metrics over 24 hours (excluding last 60 minutes)
2. **Recent Data**: Current metrics from last 60 minutes
3. **Trend Score**: Percentage change from baseline
4. **Velocity**: Rate of change per hour
5. **Acceleration**: Change in velocity over time

## 🚨 Error Handling

The system includes comprehensive error handling:

- **Graceful degradation**: Continues processing if one source fails
- **Retry logic**: Automatic retries for transient failures
- **Detailed logging**: Structured logs with context
- **Health monitoring**: System health checks
- **Fallback mechanisms**: Mock data when needed

## 📈 Performance Optimization

- **Connection pooling**: Efficient database connections
- **Batch processing**: Large dataset handling
- **Indexed queries**: Optimized database performance
- **Materialized views**: Pre-computed trend analysis
- **Rate limiting**: Respectful API usage

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` in `.env.local`
   - Verify database is accessible
   - Check network connectivity

2. **Ingestion Fails**
   - Verify `INGEST_SECRET` is set
   - Check API keys for enabled sources
   - Review logs for specific errors

3. **No Data in Trends**
   - Run `npm run db:init` to initialize schema
   - Trigger manual ingestion: `npm run ingest:run`
   - Check materialized view: `npm run db:refresh-mv`

4. **Rate Limiting Issues**
   - Increase rate limit delays in environment
   - Check API quotas for external services

### Logs

Check logs for detailed error information:

```bash
# View application logs
tail -f logs/app.log

# Check ingestion logs
grep "ingestion" logs/app.log
```

### Health Check

Verify system health:

```bash
curl "http://localhost:3000/api/health"
```

## 🔒 Security

- **Secret authentication**: All ingestion endpoints require secret
- **Environment variables**: Sensitive data stored in environment
- **Rate limiting**: Prevents abuse of external APIs
- **Input validation**: Sanitized inputs and parameters

## 📝 Development

### Adding New Data Sources

1. Create a new class extending `DataSource` in `lib/sources.ts`
2. Implement the `fetchData()` method
3. Add configuration to environment variables
4. Update `createDataSources()` factory function

### Testing

```bash
# Test database connection
npm run db:test

# Test ingestion
npm run ingest:run

# Test API endpoints
curl "http://localhost:3000/api/trends?limit=5"
```

## 📄 License

This project is part of TrenderAI and follows the same licensing terms.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs for error details
3. Open an issue with detailed information
4. Include environment configuration (without secrets)
