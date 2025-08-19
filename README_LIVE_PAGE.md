# TrenderAI Live Page Implementation

A comprehensive real-time trends dashboard built with Next.js 14, TypeScript, and Server-Sent Events (SSE) for continuous data streaming.

## Features

### Core Functionality
- **Real-time Data Streaming**: Server-Sent Events (SSE) for live updates every 10 seconds
- **Dual Data Loading**: Initial fetch via `/api/trends` + real-time updates via `/api/stream`
- **Comprehensive Filtering**: Search, sources, region, timeframe, and minimum score
- **Responsive Design**: Optimized for desktop and mobile devices
- **Graceful Fallbacks**: Mock data when database is unavailable

### Technical Specifications
- **Framework**: Next.js 14 App Router with TypeScript
- **Styling**: Tailwind CSS (no external UI libraries)
- **Database**: Neon PostgreSQL with `@neondatabase/serverless`
- **Real-time**: SSE streaming with automatic reconnection
- **Performance**: Memoized components and efficient filtering

## File Structure

```
├── types/
│   └── trend.ts                    # TypeScript interfaces
├── lib/
│   ├── db.ts                       # Database connection and queries
│   └── mock.ts                     # Mock data generator
├── components/
│   └── TrendCard.tsx               # Trend display component
├── app/
│   ├── api/
│   │   ├── trends/route.ts         # Initial data fetch endpoint
│   │   ├── stream/route.ts         # SSE streaming endpoint
│   │   └── admin/refresh/route.ts  # Manual refresh endpoint
│   └── live/
│       └── page.tsx                # Main live page component
└── sql/
    └── create_view_v_trends_live.sql # Database view setup
```

## Database Schema

### Primary View: `v_trends_live`
```sql
CREATE OR REPLACE VIEW v_trends_live AS
SELECT 
    t.id,
    t.topic as title,
    t.source,
    COALESCE(t.region, 'US') as region,
    COALESCE(t.trend_score, t.score, 0) as score,
    COALESCE(t.velocity, 0) as velocity,
    COALESCE(t.acceleration, 0) as accel,
    t.image_url,
    t.url,
    t.observed_at as last_seen_at,
    t.signals,
    t.tags
FROM trend_record t
WHERE t.observed_at >= NOW() - INTERVAL '24 hours'
ORDER BY t.observed_at DESC;
```

### Materialized View: `mv_trends_hourly`
For manual refresh operations and analytics.

## API Endpoints

### 1. `/api/trends` - Initial Data Fetch
**Method**: GET  
**Parameters**:
- `q` (string): Search query
- `sources` (string): Comma-separated source list
- `region` (string): Region filter
- `sinceMins` (number): Time window in minutes
- `minScore` (number): Minimum score threshold
- `limit` (number): Result limit (max 100)
- `mock` (boolean): Force mock data mode

**Response**:
```typescript
{
  trends: TrendData[],
  total: number,
  lastUpdated: string
}
```

### 2. `/api/stream` - SSE Streaming
**Method**: GET  
**Parameters**: Same as `/api/trends`  
**Response**: Server-Sent Events stream with:
- `trends` events: New trend data
- `heartbeat` events: Connection keep-alive
- `error` events: Error messages

### 3. `/api/admin/refresh` - Manual Refresh
**Method**: GET/POST  
**Authentication**: Required via `STREAM_SECRET`  
**Headers**: `x-stream-token`, `Authorization: Bearer`, or query param `token`

## Environment Variables

Create a `.env.local` file with:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"

# Stream Configuration
STREAM_SECRET="your-secret-key-here"

# Optional: Feature flags
NEXT_PUBLIC_ENABLE_LIVE_STREAMING="true"
NEXT_PUBLIC_ENABLE_MOCK_DATA="false"
```

## Installation & Setup

### 1. Install Dependencies
```bash
pnpm install @neondatabase/serverless
```

### 2. Set Up Database
```bash
# Run the database view setup
psql $DATABASE_URL -f sql/create_view_v_trends_live.sql
```

### 3. Configure Environment
Copy the environment variables above to `.env.local`

### 4. Start Development Server
```bash
pnpm dev
```

## Usage

### Accessing the Live Page
Navigate to `/live` to view the real-time trends dashboard.

### Filtering Options
- **Search**: Text search across titles and tags
- **Sources**: Toggle specific data sources (Twitter, Reddit, etc.)
- **Region**: Filter by geographic region
- **Time Range**: 15m, 1h, 6h, 24h options
- **Min Score**: Filter by minimum trend score

### Real-time Features
- **Live Connection**: Visual indicator shows connection status
- **Auto-refresh**: Data updates every 10 seconds
- **Reconnection**: Automatic reconnection on connection loss
- **New Indicators**: First 3 trends marked as "NEW"

## Components

### TrendCard
Displays individual trend information with:
- Score indicator with color coding
- Velocity and acceleration metrics
- Source and region information
- Tags and external links
- Visual indicators for trend strength

### Live Page
Main component with:
- Real-time data streaming
- Comprehensive filtering
- Responsive grid layout
- Connection status monitoring
- Error handling and fallbacks

## Performance Optimizations

### Client-side
- Memoized filtering with `useMemo`
- Efficient state management
- Optimized re-renders with `memo`
- Debounced search inputs

### Server-side
- Database indexes for common queries
- Efficient SQL with proper joins
- Connection pooling
- Graceful error handling

### Real-time
- SSE for efficient streaming
- Automatic reconnection logic
- Heartbeat monitoring
- Resource cleanup on unmount

## Error Handling

### Database Failures
- Automatic fallback to mock data
- User-friendly error messages
- Graceful degradation

### Connection Issues
- Visual connection status indicators
- Automatic reconnection attempts
- Fallback to polling if SSE fails

### Data Validation
- TypeScript interfaces for type safety
- Runtime validation of API responses
- Default values for missing data

## Testing

### Manual Testing
1. **Database Mode**: Test with real database connection
2. **Mock Mode**: Test with `?mock=true` parameter
3. **Connection Testing**: Test SSE streaming and reconnection
4. **Filter Testing**: Test all filter combinations

### API Testing
```bash
# Test trends endpoint
curl "http://localhost:3000/api/trends?limit=10"

# Test stream endpoint
curl "http://localhost:3000/api/stream?limit=5"

# Test admin refresh
curl -H "x-stream-token: your-secret" "http://localhost:3000/api/admin/refresh"
```

## Deployment

### Vercel Deployment
1. Set environment variables in Vercel dashboard
2. Deploy with `vercel --prod`
3. Configure database connection
4. Test live streaming functionality

### Database Setup
1. Run the SQL setup script
2. Verify view creation
3. Test data access
4. Monitor performance

## Monitoring

### Key Metrics
- Connection status and uptime
- Data refresh frequency
- Filter usage patterns
- Error rates and types

### Logging
- Database query performance
- SSE connection events
- Error tracking and debugging
- User interaction analytics

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` configuration
   - Verify database accessibility
   - Check network connectivity

2. **SSE Not Working**
   - Verify `STREAM_SECRET` is set
   - Check CORS configuration
   - Test with mock data mode

3. **Slow Performance**
   - Check database indexes
   - Monitor query performance
   - Optimize filter combinations

4. **No Data Displayed**
   - Check database view exists
   - Verify data in `trend_record` table
   - Test with mock data mode

### Debug Mode
Enable debug logging by setting:
```bash
NEXT_PUBLIC_DEBUG_MODE="true"
```

## Future Enhancements

### Planned Features
- Advanced analytics dashboard
- Custom alert configurations
- Export functionality
- Mobile app integration
- Machine learning insights

### Performance Improvements
- Database query optimization
- Caching strategies
- CDN integration
- Progressive loading

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review error logs
3. Test with mock data mode
4. Verify environment configuration

---

**Note**: This implementation provides a production-ready live trends dashboard with comprehensive error handling, performance optimizations, and graceful fallbacks for various failure scenarios.
