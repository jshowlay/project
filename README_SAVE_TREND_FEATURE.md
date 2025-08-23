# Save Trend Feature Implementation

This document describes the complete implementation of the "Save Trend" feature for the TrenderAI application.

## Overview

The Save Trend feature allows users to save interesting trends to their personal collection, view saved trends, and manage their saved items. The implementation includes:

- Database schema with proper indexing
- RESTful API endpoints
- Reusable UI components
- Server-side rendered saved trends page
- Optimistic UI updates
- TypeScript type safety

## Database Schema

### Table: `saved_trends`

```sql
CREATE TABLE saved_trends (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    trend_id VARCHAR(255) NOT NULL,
    trend_source VARCHAR(50) NOT NULL,
    trend_topic TEXT NOT NULL,
    trend_title TEXT,
    trend_url TEXT,
    trend_image_url TEXT,
    trend_score INTEGER DEFAULT 0,
    trend_velocity FLOAT DEFAULT 0,
    trend_acceleration FLOAT DEFAULT 0,
    trend_region VARCHAR(10) DEFAULT 'US',
    trend_tags JSONB DEFAULT '[]',
    trend_observed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes and Constraints

- Unique constraint: `(user_id, trend_id, trend_source)` - prevents duplicate saves
- Indexes for performance: `user_id`, `trend_id`, `created_at`, `trend_source`, `trend_region`
- Automatic `updated_at` trigger

## API Endpoints

### 1. Save a Trend
**POST** `/api/saved`

**Request Body:**
```json
{
  "trend_id": "string",
  "trend_source": "google_trends",
  "trend_topic": "AI Art Generators",
  "trend_title": "AI Art Generators Trending",
  "trend_url": "https://example.com",
  "trend_image_url": "https://example.com/image.jpg",
  "trend_score": 85,
  "trend_velocity": 12.5,
  "trend_acceleration": 2.3,
  "trend_region": "US",
  "trend_tags": ["ai", "art", "technology"],
  "trend_observed_at": "2025-08-20T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* saved trend object */ },
  "message": "Trend saved successfully"
}
```

### 2. Remove Saved Trend
**DELETE** `/api/saved/[trendId]?source=[trendSource]`

**Response:**
```json
{
  "success": true,
  "message": "Trend removed from saved list"
}
```

### 3. Check if Trend is Saved
**GET** `/api/saved/[trendId]?source=[trendSource]`

**Response:**
```json
{
  "success": true,
  "data": {
    "isSaved": true,
    "trendId": "string",
    "trendSource": "google_trends"
  }
}
```

### 4. Get Saved Trends (Paginated)
**GET** `/api/saved?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "trends": [ /* array of saved trends */ ],
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

## Components

### SaveButton Component

A reusable component with optimistic UI updates and loading states.

**Props:**
```typescript
interface SaveButtonProps {
  trendId: string;
  trendSource: string;
  trendTopic: string;
  trendTitle?: string;
  trendUrl?: string;
  trendImageUrl?: string;
  trendScore?: number;
  trendVelocity?: number;
  trendAcceleration?: number;
  trendRegion?: string;
  trendTags?: string[];
  trendObservedAt?: Date;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'text' | 'full';
}
```

**Features:**
- Automatic saved status checking
- Optimistic UI updates
- Loading states
- Error handling with tooltips
- Responsive design
- Accessibility support

### SavedTrendsGrid Component

Displays saved trends in a responsive grid layout.

**Features:**
- Responsive grid (1-4 columns based on screen size)
- Pagination controls
- Empty state with call-to-action
- Trend cards with metadata
- Sparkline integration for Google Trends

### SavedTrendsHeader Component

Header with navigation and pagination controls.

**Features:**
- Back to trends navigation
- Trend count display
- Pagination controls
- Responsive design

## Pages

### Saved Trends Page (`/saved`)

Server-side rendered page showing user's saved trends.

**Features:**
- Server-side data fetching
- Pagination support
- Responsive grid layout
- Loading skeletons
- Error handling

## Authentication

The feature uses a simple session-based authentication system with development fallbacks:

- **Development**: Uses `DEV_USER_ID` from `.env.local` or defaults to `'dev-user-001'`
- **Production**: Integrates with session cookies and user authentication
- **Client-side**: Stores user ID in localStorage and cookies

## Environment Setup

Add to `.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Development user ID (optional)
DEV_USER_ID=dev-user-001
```

## Installation and Setup

### 1. Run Database Migration

```bash
# Make the migration script executable
chmod +x scripts/migrate-saved-trends.js

# Run the migration
node scripts/migrate-saved-trends.js
```

### 2. Install Dependencies

The feature uses existing dependencies:
- `pg` - PostgreSQL client
- `zod` - Schema validation
- `@heroicons/react` - Icons (if not already installed)

### 3. Start the Development Server

```bash
npm run dev
```

## Testing

### API Testing with cURL

#### Save a Trend
```bash
curl -X POST http://localhost:3000/api/saved \
  -H "Content-Type: application/json" \
  -d '{
    "trend_id": "test-trend-001",
    "trend_source": "google_trends",
    "trend_topic": "Test Trend",
    "trend_title": "Test Trend Title",
    "trend_score": 85,
    "trend_velocity": 12.5,
    "trend_acceleration": 2.3,
    "trend_region": "US",
    "trend_tags": ["test", "trend"],
    "trend_observed_at": "2025-08-20T10:00:00Z"
  }'
```

#### Check if Trend is Saved
```bash
curl "http://localhost:3000/api/saved/test-trend-001?source=google_trends"
```

#### Get Saved Trends
```bash
curl "http://localhost:3000/api/saved?page=1&limit=10"
```

#### Remove Saved Trend
```bash
curl -X DELETE "http://localhost:3000/api/saved/test-trend-001?source=google_trends"
```

### Manual Testing

1. **Save a Trend**: Click the star icon on any trend card
2. **View Saved Trends**: Navigate to `/saved`
3. **Remove Saved Trend**: Click the filled star icon to unsave
4. **Pagination**: Test pagination controls on the saved page

## File Structure

```
├── app/
│   ├── api/saved/
│   │   ├── route.ts                    # POST/GET saved trends
│   │   └── [trendId]/route.ts          # DELETE/GET specific trend
│   └── saved/
│       └── page.tsx                    # Saved trends page
├── components/
│   ├── SaveButton.tsx                  # Save/unsave button component
│   ├── SavedTrendsGrid.tsx             # Grid display component
│   └── SavedTrendsHeader.tsx           # Page header component
├── lib/
│   ├── auth.ts                         # Authentication utilities
│   └── saved-trends.ts                 # Database operations
├── prisma/migrations/
│   └── 20250820_add_saved_trends/
│       └── migration.sql               # Database migration
└── scripts/
    └── migrate-saved-trends.js         # Migration runner
```

## Performance Considerations

- **Database Indexes**: Optimized for common query patterns
- **Connection Pooling**: Reuses database connections
- **Pagination**: Limits data transfer
- **Optimistic Updates**: Immediate UI feedback
- **Error Boundaries**: Graceful error handling

## Security Features

- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries
- **Authentication**: User ID verification
- **Rate Limiting**: Built into Next.js API routes
- **CORS**: Configured for same-origin requests

## Future Enhancements

1. **Bulk Operations**: Save/remove multiple trends at once
2. **Categories**: Organize saved trends by categories
3. **Search**: Search within saved trends
4. **Export**: Export saved trends to various formats
5. **Sharing**: Share saved trend collections
6. **Notifications**: Notify when saved trends change significantly

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure `DATABASE_URL` is set correctly
2. **Migration Errors**: Check PostgreSQL permissions and connection
3. **Authentication**: Verify `DEV_USER_ID` is set in development
4. **CORS Issues**: Ensure API routes are accessible from frontend

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=saved-trends:*
```

## Support

For issues or questions about the Save Trend feature, please refer to:
- Database logs for connection issues
- Browser console for client-side errors
- Server logs for API errors
- Network tab for request/response debugging
