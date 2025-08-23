# Time-to-Interactive (TTI) Tracking System Implementation

## Overview

This document describes the comprehensive Time-to-Interactive (TTI) tracking system implemented across the Trender AI application stack. The system provides end-to-end performance monitoring from data ingestion through API responses to UI interactions.

## Features

### ✅ Core Functionality
- **End-to-end tracing** with correlated trace IDs across all system layers
- **PostgreSQL storage** via Prisma ORM with optimized schema
- **Client-side instrumentation** for UI metrics and user interactions
- **Server-side API timing** and database operation tracking
- **Privacy-compliant** anonymous session tracking with IP anonymization
- **Configurable sampling rates** for production scaling
- **Real-time metrics aggregation** with hourly and daily rollups

### ✅ Performance Metrics Tracked
- **Web Vitals**: TTI, FCP, LCP, CLS
- **Page Load Times**: DOM content loaded, load complete, total page load
- **API Response Times**: All API endpoints with status codes
- **Database Operations**: Query execution times and row counts
- **User Interactions**: Clicks, inputs, scrolls, route changes
- **Resource Loading**: Images, scripts, stylesheets with timing
- **Error Tracking**: JavaScript errors and API failures

### ✅ Data Storage
- **TTISession**: User session data with device/browser info
- **TTIEvent**: Performance events and user interactions
- **TTIMetric**: Quantitative performance measurements
- **TTIAggregate**: Pre-computed hourly/daily statistics

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client-Side   │    │   Server-Side   │    │   Database      │
│                 │    │                 │    │                 │
│ • React Hooks   │───▶│ • API Endpoints │───▶│ • PostgreSQL    │
│ • Web Vitals    │    │ • Middleware    │    │ • Prisma ORM    │
│ • User Events   │    │ • Workers       │    │ • Views         │
│ • Performance   │    │ • Tracing       │    │ • Aggregates    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Installation & Setup

### 1. Environment Variables
Add to your `.env` file:
```bash
# TTI Tracking Configuration
TTI_ENABLED=true
TTI_SAMPLE_RATE=0.1
TTI_MAX_TRACE_AGE_HOURS=24
TTI_ANONYMIZE_IPS=true
TTI_STORAGE_TTL_DAYS=30
TTI_DEBUG_MODE=false
TTI_CORRELATION_ENABLED=true
TTI_METRICS_ENDPOINT=/api/tti/metrics
TTI_STATS_ENDPOINT=/api/tti/stats
```

### 2. Database Setup
```bash
# Run the TTI setup script
npm run tti:setup
```

### 3. Dependencies
The following packages are automatically installed:
- `uuid`: For trace ID generation
- `crypto-js`: For IP anonymization
- `@types/uuid` and `@types/crypto-js`: TypeScript definitions

## Usage

### Client-Side Integration

#### Basic TTI Hook
```typescript
import { useTTI } from '../hooks/useTTI';

function MyComponent() {
  const ttiState = useTTI({
    component: 'MyComponent',
    enableWebVitals: true,
    enableUserInteractions: true,
  });

  return <div>Component with TTI tracking</div>;
}
```

#### Component Performance Tracking
```typescript
import { useTTIComponent } from '../hooks/useTTI';

function MyComponent() {
  const { trackRender, trackInteraction } = useTTIComponent('MyComponent');

  useEffect(() => {
    const endTracking = trackRender('initial');
    // Component logic
    endTracking();
  }, []);

  const handleClick = () => {
    trackInteraction('button_click', 'submit-button');
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

#### API Call Tracking
```typescript
import { useTTIAPI } from '../hooks/useTTI';

function MyComponent() {
  const { trackAPICall } = useTTIAPI();

  const fetchData = async () => {
    return await trackAPICall(
      () => fetch('/api/data'),
      '/api/data',
      'GET'
    );
  };
}
```

### Server-Side Integration

#### API Handler Wrapper
```typescript
import { withTTITracking } from '../lib/tti-api-wrapper';

export const GET = withTTITracking(async (request: NextRequest) => {
  // Your API logic here
  return NextResponse.json({ data: 'success' });
}, {
  route: '/api/my-endpoint',
  component: 'MyAPI',
  enableMetrics: true,
});
```

#### Database Operation Tracking
```typescript
import { withTTIDatabase } from '../lib/tti-api-wrapper';

const trackedQuery = withTTIDatabase(
  async (userId: string) => {
    return await prisma.user.findUnique({ where: { id: userId } });
  },
  {
    operationName: 'get_user',
    enableQueryLogging: true,
  }
);
```

#### Middleware Integration
```typescript
import { ttiMiddleware } from '../middleware/tti-middleware';

export function middleware(request: NextRequest) {
  return ttiMiddleware(request);
}

export const config = {
  matcher: ['/((?!api/tti|_next/static|_next/image|favicon.ico).*)'],
};
```

## API Endpoints

### POST /api/tti/metrics
Records client-side metrics and events.

**Request Body:**
```json
{
  "traceId": "uuid",
  "sessionId": "uuid",
  "userId": "optional-user-id",
  "events": [
    {
      "eventType": "page_load",
      "eventName": "homepage_load",
      "timestamp": "2025-08-21T17:00:00Z",
      "duration": 1200,
      "metadata": {}
    }
  ],
  "metrics": [
    {
      "metricName": "tti",
      "metricValue": 1500,
      "unit": "ms",
      "timestamp": "2025-08-21T17:00:00Z"
    }
  ],
  "userContext": {
    "userAgent": "Mozilla/5.0...",
    "pageUrl": "http://localhost:3000",
    "browser": "chrome",
    "os": "macos",
    "deviceType": "desktop"
  }
}
```

### GET /api/tti/stats
Retrieves aggregated TTI statistics.

**Query Parameters:**
- `type`: `overview` | `route_performance` | `hourly_metrics` | `session_summary` | `aggregates`
- `route`: Route path (for route_performance)
- `days`: Number of days (default: 7)
- `metricName`: Specific metric name
- `date`: Date in YYYY-MM-DD format

### POST /api/tti/stats
Administrative actions.

**Request Body:**
```json
{
  "action": "refresh_aggregates" | "cleanup_sessions"
}
```

## Database Schema

### TTISession
```sql
CREATE TABLE "TTISession" (
  "id" TEXT PRIMARY KEY,
  "traceId" TEXT UNIQUE NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT,
  "ipHash" TEXT,
  "userAgent" TEXT,
  "referrer" TEXT,
  "pageUrl" TEXT NOT NULL,
  "region" TEXT,
  "deviceType" TEXT,
  "browser" TEXT,
  "os" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP NOT NULL,
  "isActive" BOOLEAN DEFAULT true
);
```

### TTIEvent
```sql
CREATE TABLE "TTIEvent" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "traceId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "timestamp" TIMESTAMP NOT NULL,
  "duration" INTEGER,
  "metadata" JSONB,
  "source" TEXT NOT NULL,
  "component" TEXT,
  "route" TEXT
);
```

### TTIMetric
```sql
CREATE TABLE "TTIMetric" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "traceId" TEXT NOT NULL,
  "metricName" TEXT NOT NULL,
  "metricValue" DOUBLE PRECISION NOT NULL,
  "unit" TEXT,
  "timestamp" TIMESTAMP NOT NULL,
  "metadata" JSONB,
  "source" TEXT NOT NULL
);
```

## Configuration Options

### Sampling Configuration
- `TTI_SAMPLE_RATE`: Percentage of requests to track (0.0-1.0)
- `TTI_MAX_TRACE_AGE_HOURS`: How long to keep trace data
- `TTI_STORAGE_TTL_DAYS`: Database retention period

### Privacy Configuration
- `TTI_ANONYMIZE_IPS`: Hash IP addresses for privacy
- `TTI_CORRELATION_ENABLED`: Enable trace correlation headers

### Performance Configuration
- `TTI_DEBUG_MODE`: Enable debug logging
- `TTI_ENABLED`: Master switch for TTI tracking

## Monitoring & Maintenance

### Available Scripts
```bash
# Setup TTI system
npm run tti:setup

# Test TTI functionality
npm run tti:test

# View current stats
npm run tti:stats

# Clean up expired sessions
npm run tti:cleanup
```

### Database Views
- `tti_hourly_metrics`: Hourly aggregated metrics
- `tti_daily_metrics`: Daily aggregated metrics
- `tti_session_summary`: Session performance summaries
- `tti_route_performance`: Route-specific performance data

### Maintenance Functions
- `refresh_tti_aggregates()`: Updates aggregated statistics
- Automatic cleanup of expired sessions
- Performance indexes for fast queries

## Performance Impact

### Client-Side
- **Minimal overhead**: ~1-2ms per tracked event
- **Sampling reduces impact**: Only tracks configured percentage
- **Async operations**: Non-blocking metric collection

### Server-Side
- **Database optimized**: Indexed queries and efficient schema
- **Batch processing**: Ingestion worker processes events in batches
- **Configurable sampling**: Reduces database load in production

### Storage
- **Automatic cleanup**: Expired sessions removed automatically
- **Aggregated data**: Raw data aggregated to reduce storage
- **Configurable TTL**: Adjustable retention periods

## Security & Privacy

### Data Protection
- **IP anonymization**: Optional hashing of IP addresses
- **Metadata sanitization**: Sensitive data filtered out
- **User consent**: Respects user privacy preferences

### Access Control
- **API rate limiting**: Prevents abuse of tracking endpoints
- **Input validation**: All inputs validated and sanitized
- **Error handling**: Graceful degradation on failures

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure all dependencies are installed: `pnpm install`
   - Restart the development server

2. **Database connection errors**
   - Check DATABASE_URL in environment
   - Run `npm run tti:setup` to create tables

3. **Sampling issues**
   - Adjust TTI_SAMPLE_RATE for more/less data
   - Check TTI_ENABLED is set to true

4. **Performance impact**
   - Reduce sampling rate in production
   - Monitor database query performance
   - Use aggregated views for reporting

### Debug Mode
Enable debug logging by setting `TTI_DEBUG_MODE=true` in your environment.

## Future Enhancements

### Planned Features
- **Real-time dashboards**: Live performance monitoring
- **Alert system**: Performance threshold alerts
- **A/B testing integration**: Compare performance across variants
- **Mobile app tracking**: React Native integration
- **Advanced analytics**: Machine learning insights

### Scalability Improvements
- **Redis caching**: Reduce database load
- **Event streaming**: Real-time data processing
- **Multi-region support**: Global performance monitoring
- **Data warehouse integration**: Advanced analytics

## Support

For issues or questions about the TTI implementation:
1. Check the troubleshooting section above
2. Review the API documentation
3. Test with the provided test scripts
4. Monitor the application logs for errors

---

**Implementation Status**: ✅ Complete and Tested
**Last Updated**: August 21, 2025
**Version**: 1.0.0
