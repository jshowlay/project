# TrenderAI Cron Job System

This document describes the production-ready cron job system for computing trend analytics with EWMA calculations.

## Overview

The cron system provides automated trend analytics computation using Exponential Weighted Moving Average (EWMA) calculations. It runs hourly to process trend data and update analytics metrics.

## Features

- ✅ **Robust Authentication**: Multiple authentication methods (query params, headers, Bearer token)
- ✅ **EWMA Calculations**: Exponential Weighted Moving Average with α = 0.35
- ✅ **Performance Monitoring**: Comprehensive logging with timing metrics
- ✅ **Error Handling**: Graceful error handling with detailed error reporting
- ✅ **Database Optimization**: Batch updates with proper indexing
- ✅ **Vercel Integration**: Automatic scheduling with Vercel Cron
- ✅ **Clean URLs**: URL rewriting for better endpoint access

## Architecture

### Endpoints

1. **GET `/cron/compute-trends`** - Returns current analytics status
2. **POST `/cron/compute-trends`** - Triggers trend analytics computation
3. **GET `/api/cron/compute-trends`** - Direct API access
4. **POST `/api/cron/compute-trends`** - Direct API access

### Authentication Methods

The system supports multiple authentication methods:

1. **Query Parameter**: `?token=YOUR_CRON_SECRET`
2. **Header**: `x-cron-token: YOUR_CRON_SECRET`
3. **Authorization Header**: `Authorization: Bearer YOUR_CRON_SECRET`

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Cron authentication
CRON_SECRET=your-secure-random-secret-here

# Database (if not already set)
DATABASE_URL=postgresql://user:password@host:port/database
```

### 2. Database Migration

Run the database migration to add EWMA fields:

```bash
# Execute the migration
psql $DATABASE_URL -f sql/add_ewma_fields.sql
```

### 3. Vercel Configuration

The `vercel.json` file is already configured with:

```json
{
  "crons": [
    {
      "path": "/api/cron/compute-trends",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs the cron job every hour at minute 0.

## EWMA Calculation

### Formula

```
EWMA = α × CurrentValue + (1 - α) × PreviousEWMA
```

Where:
- α (alpha) = 0.35 (configurable)
- CurrentValue = trend score
- PreviousEWMA = previous EWMA value (or current score if first calculation)

### Trend Score Calculation

The trend score combines multiple factors:

```javascript
trendScore = (ewma × 0.6) + engagementBonus + recencyBonus
```

- **Base Score**: 60% of EWMA value
- **Engagement Bonus**: Up to 30% based on engagement metrics
- **Recency Bonus**: Up to 10% based on content age (decays over 7 days)

## Testing

### Local Testing

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Run the test script**:
   ```bash
   node scripts/test-compute-trends.js local
   ```

3. **Manual testing with curl**:
   ```bash
   # Test GET (status)
   curl "http://localhost:3000/cron/compute-trends?token=YOUR_CRON_SECRET"
   
   # Test POST (computation)
   curl -X POST "http://localhost:3000/cron/compute-trends?token=YOUR_CRON_SECRET"
   ```

### Production Testing

```bash
node scripts/test-compute-trends.js production
```

## Expected Responses

### GET Response (Status)

```json
{
  "success": true,
  "message": "Trend analytics status retrieved",
  "timestamp": "2025-08-18T10:00:00.000Z",
  "stats": {
    "totalTrends": 150,
    "trendsWithEwma": 145,
    "averageEwma": 75.5,
    "averageTrendScore": 82.3,
    "lastUpdate": "2025-08-18T09:00:00.000Z"
  }
}
```

### POST Response (Computation)

```json
{
  "success": true,
  "message": "Trend analytics computation completed successfully",
  "timestamp": "2025-08-18T10:00:00.000Z",
  "duration": "1250ms",
  "metrics": {
    "totalTrends": 150,
    "processedTrends": 148,
    "failedTrends": 2,
    "averageEwmaChange": 12.5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Unauthorized",
  "timestamp": "2025-08-18T10:00:00.000Z"
}
```

## Monitoring & Logging

### Console Logs

The system provides comprehensive logging:

```
🔄 Starting trend analytics computation...
📊 Found 150 trends to process
✅ Updated 148 trends with new EWMA values
✅ Trend analytics computation completed in 1250ms
📊 Processed: 148, Failed: 2, Avg EWMA Change: 12.50
```

### Performance Metrics

- **Duration**: Total execution time in milliseconds
- **Processed Trends**: Number of successfully processed trends
- **Failed Trends**: Number of trends that failed processing
- **Average EWMA Change**: Average change in EWMA values

## Database Schema

### New Fields

```sql
-- EWMA field for trend analytics
ALTER TABLE trends ADD COLUMN ewma DECIMAL(10,4);

-- Computed trend score
ALTER TABLE trends ADD COLUMN trend_score INTEGER DEFAULT 0;
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_trends_ewma ON trends(ewma);
CREATE INDEX idx_trends_trend_score ON trends(trend_score);
CREATE INDEX idx_trends_analytics ON trends(ewma, trend_score, created_at);
```

## Deployment

### Vercel Deployment

1. **Push to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Set environment variables**:
   ```bash
   vercel env add CRON_SECRET
   ```

3. **Verify cron job**:
   - Check Vercel dashboard → Functions → Cron Jobs
   - Monitor execution logs

### Alternative Scheduling

For non-Vercel deployments, you can use:

1. **cron (Linux/macOS)**:
   ```bash
   # Add to crontab
   0 * * * * curl -X POST "https://your-domain.com/cron/compute-trends?token=YOUR_CRON_SECRET"
   ```

2. **Windows Task Scheduler**:
   - Create hourly task
   - Execute: `curl -X POST "https://your-domain.com/cron/compute-trends?token=YOUR_CRON_SECRET"`

3. **GitHub Actions**:
   ```yaml
   name: Compute Trends
   on:
     schedule:
       - cron: '0 * * * *'
   jobs:
     compute:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger computation
           run: |
             curl -X POST "https://your-domain.com/cron/compute-trends?token=${{ secrets.CRON_SECRET }}"
   ```

## Security Considerations

1. **Strong Secrets**: Use cryptographically secure random secrets
2. **Environment Variables**: Never commit secrets to version control
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **IP Whitelisting**: Optionally restrict to known IP ranges
5. **Audit Logging**: Monitor access patterns and failed attempts

## Troubleshooting

### Common Issues

1. **401 Unauthorized**:
   - Check `CRON_SECRET` environment variable
   - Verify token in request
   - Check authentication method

2. **Database Errors**:
   - Verify database connection
   - Check table schema
   - Ensure proper permissions

3. **Timeout Errors**:
   - Increase function timeout in `vercel.json`
   - Optimize database queries
   - Consider batch processing

### Debug Mode

Enable debug logging by setting:

```bash
LOG_LEVEL=debug
```

## Performance Optimization

1. **Batch Processing**: Updates are batched for better performance
2. **Database Indexes**: Proper indexing for analytics queries
3. **Connection Pooling**: Efficient database connection management
4. **Memory Management**: Proper cleanup of large datasets

## Future Enhancements

- [ ] Real-time analytics dashboard
- [ ] Advanced trend prediction algorithms
- [ ] Multi-region trend analysis
- [ ] Automated alerting for significant changes
- [ ] Historical trend analysis
- [ ] Machine learning integration

## Support

For issues or questions:

1. Check the logs for error details
2. Verify environment configuration
3. Test with the provided test script
4. Review database schema and indexes
5. Check Vercel function logs

---

**Last Updated**: August 18, 2025
**Version**: 1.0.0
