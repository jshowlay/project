# TrenderAI Alerts MVP System

A complete alerts system for monitoring trend signals with real-time notifications and user management.

## 🎯 Overview

The Alerts MVP system allows users to create monitoring rules for trend signals (score, velocity, acceleration) and receive notifications when trends meet their criteria. The system includes:

- **Database Schema**: Alert rules and events tables with proper indexing
- **API Endpoints**: Full CRUD operations for rules and events
- **Background Processing**: Automated evaluation job with cooldown protection
- **User Interface**: Rules management and inbox with real-time updates
- **Security**: User authentication and job secret protection

## 🏗️ Architecture

### Database Schema

#### `alert_rules` Table
- **User-defined monitoring rules** with signal thresholds
- **Flexible filtering** by sources, regions, and keywords
- **Notification settings** with frequency and cooldown controls
- **Active/inactive status** for rule management

#### `alert_events` Table
- **Triggered alerts** with trend snapshots
- **Read status tracking** for inbox management
- **De-duplication** to prevent spam alerts
- **Notification status** for future email integration

### API Endpoints

#### Alert Rules Management
- `GET /api/alerts` - List user's alert rules (paginated)
- `POST /api/alerts` - Create new alert rule
- `GET /api/alerts/[id]` - Get specific alert rule
- `PATCH /api/alerts/[id]` - Update alert rule
- `DELETE /api/alerts/[id]` - Delete alert rule

#### Alert Events Management
- `GET /api/alerts/events` - List alert events (paginated, unread filter)
- `POST /api/alerts/events` - Mark events as read (single or bulk)

#### Background Processing
- `GET /api/jobs/alerts-evaluate` - Evaluate rules against recent trends

## 🚀 Quick Start

### 1. Environment Setup

Add the following to your `.env.local`:

```bash
# Required for alerts system
ALERT_JOB_SECRET=your-secure-job-secret-here

# Database connection (should already be set)
DATABASE_URL=your-postgresql-connection-string

# Development user ID (for testing)
DEV_USER_ID=dev-user-001
```

### 2. Database Migration

Run the alerts database migration:

```bash
node scripts/migrate-alerts.js
```

### 3. Start the Application

```bash
pnpm dev
```

### 4. Access the Alerts Interface

Navigate to `/alerts` to access the alerts management interface.

## 📊 Signal Monitoring

### Supported Signals

- **Score**: Trend popularity score (0-1000)
- **Velocity**: Rate of change in score
- **Acceleration**: Rate of change in velocity

### Threshold Configuration

Each signal supports:
- **Minimum threshold**: Alert when signal ≥ value
- **Maximum threshold**: Alert when signal ≤ value
- **Range monitoring**: Alert when signal is between min and max

### Filtering Options

- **Sources**: youtube, reddit, nyt, google_trends, twitter, tiktok
- **Regions**: US, CA, GB, AU, DE, FR, JP, IN, BR, MX
- **Keywords**: Text matching in trend topics/titles

## ⚙️ Configuration

### Notification Frequencies

- **Immediate**: Alert triggered instantly
- **Hourly**: Batched notifications every hour
- **Daily**: Daily digest of alerts

### Cooldown Settings

- **Default**: 60 minutes between alerts for same rule/trend
- **Range**: 1-1440 minutes (1 minute to 24 hours)
- **Purpose**: Prevent spam alerts for trending topics

## 🔄 Background Processing

### Evaluation Job

The system includes a background job that:

1. **Fetches active rules** from the database
2. **Retrieves recent trends** (last 2 hours, max 2000 records)
3. **Evaluates each rule** against trend data
4. **Creates alert events** for matching trends
5. **Respects cooldown periods** to prevent spam

### Job Scheduling

For production deployment, set up a cron job to call:

```
GET /api/jobs/alerts-evaluate?secret=your-secure-job-secret
```

**Recommended frequency**: Every 15 minutes

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/jobs/alerts-evaluate?secret=your-secure-job-secret",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

## 🎨 User Interface

### Alerts Page (`/alerts`)

The main alerts interface includes:

#### Rules Management Section
- **Create new rules** with comprehensive form
- **View existing rules** with status indicators
- **Toggle active/inactive** status
- **Delete rules** with confirmation
- **Signal threshold display** with visual indicators

#### Alert Inbox Section
- **View triggered alerts** with trend details
- **Mark individual alerts** as read
- **Mark all alerts** as read
- **Filter by read status** (all/unread)
- **Direct links** to trend sources

### Quick Add Form

The rule creation form includes:

- **Basic information**: Name and description
- **Signal thresholds**: Score, velocity, acceleration ranges
- **Filters**: Sources, regions, keywords
- **Notification settings**: Frequency and cooldown
- **Real-time validation** and error handling

## 🔒 Security Features

### Authentication
- **User isolation**: All queries filtered by user_id
- **Session management**: Cookie-based authentication
- **Development fallback**: DEV_USER_ID for testing

### Job Protection
- **Secret token**: ALERT_JOB_SECRET required for evaluation
- **Unauthorized access**: 401 responses for invalid secrets
- **Rate limiting**: Built-in cooldown prevents abuse

### Input Validation
- **Zod schemas**: Type-safe validation for all inputs
- **Range validation**: Threshold min/max constraints
- **SQL injection protection**: Parameterized queries

## 📈 Performance Optimizations

### Database Indexes
- **User queries**: Indexed on user_id for fast filtering
- **Time-based queries**: Indexed on timestamps for recent data
- **Rule evaluation**: Composite indexes for efficient joins
- **Read status**: Partial indexes for unread filtering

### Query Optimization
- **Limited scope**: 2-hour window for trend evaluation
- **Record limits**: Max 2000 trends per evaluation
- **De-duplication**: Unique constraints prevent duplicates
- **Connection pooling**: Efficient database connections

### Caching Strategy
- **Materialized views**: v_trends_live for fast access
- **Fallback queries**: Direct table access if views fail
- **Result caching**: Pagination with proper limits

## 🧪 Testing

### API Testing

#### Create Alert Rule
```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Score Trends",
    "description": "Monitor trends with high scores",
    "min_score": 50,
    "sources": ["youtube", "reddit"],
    "notification_frequency": "immediate"
  }'
```

#### List Alert Rules
```bash
curl http://localhost:3000/api/alerts
```

#### List Alert Events
```bash
curl http://localhost:3000/api/alerts/events
```

#### Mark Event as Read
```bash
curl -X POST http://localhost:3000/api/alerts/events \
  -H "Content-Type: application/json" \
  -d '{
    "action": "mark_read",
    "eventId": "event-uuid-here"
  }'
```

#### Test Background Job
```bash
curl "http://localhost:3000/api/jobs/alerts-evaluate?secret=your-secure-job-secret"
```

### Manual Testing

1. **Create a test rule** with low thresholds
2. **Wait for background job** or trigger manually
3. **Check inbox** for triggered alerts
4. **Test read status** functionality
5. **Verify rule management** operations

## 🔧 Development

### File Structure

```
├── sql/
│   └── create_alerts_schema.sql          # Database schema
├── lib/
│   └── alerts.ts                         # Database utilities
├── app/
│   ├── alerts/
│   │   └── page.tsx                      # Main alerts page
│   └── api/
│       ├── alerts/
│       │   ├── route.ts                  # Rules CRUD
│       │   ├── [id]/route.ts             # Individual rules
│       │   └── events/route.ts           # Events management
│       └── jobs/
│           └── alerts-evaluate/route.ts  # Background job
├── components/
│   ├── AlertsHeader.tsx                  # Page header
│   ├── AlertsRulesSection.tsx            # Rules management
│   ├── AlertsInboxSection.tsx            # Events inbox
│   ├── CreateAlertRuleForm.tsx           # Rule creation form
│   └── AlertsSkeleton.tsx                # Loading skeleton
└── scripts/
    └── migrate-alerts.js                 # Database migration
```

### Key Components

#### Database Layer (`lib/alerts.ts`)
- **TypeScript interfaces** for type safety
- **Connection pooling** for performance
- **Validation schemas** with Zod
- **CRUD operations** for all entities

#### API Layer
- **RESTful endpoints** with proper HTTP methods
- **Error handling** with appropriate status codes
- **Authentication** and authorization
- **Input validation** and sanitization

#### UI Components
- **Server-side rendering** for initial data
- **Client-side state** for real-time updates
- **Optimistic UI** for better UX
- **Responsive design** with Tailwind CSS

## 🚀 Deployment

### Prerequisites
- PostgreSQL database with connection string
- Environment variables configured
- Database migration completed

### Vercel Deployment
1. **Set environment variables** in Vercel dashboard
2. **Configure cron job** in vercel.json
3. **Deploy application** with `vercel --prod`
4. **Verify migration** ran successfully
5. **Test background job** manually

### Monitoring
- **Check job logs** in Vercel function logs
- **Monitor database** performance and connections
- **Track alert volume** and user engagement
- **Set up alerts** for job failures

## 🔮 Future Enhancements

### Planned Features
- **Email notifications** with SMTP integration
- **Webhook support** for external integrations
- **Advanced filtering** with regex and fuzzy matching
- **Alert templates** for common use cases
- **Analytics dashboard** for alert performance

### Scalability Improvements
- **Queue system** for high-volume processing
- **Caching layer** for frequently accessed data
- **Database sharding** for multi-tenant support
- **Real-time updates** with WebSocket integration

## 📝 API Reference

### Alert Rules

#### Create Rule
```typescript
POST /api/alerts
{
  name: string;
  description?: string;
  min_score?: number;
  max_score?: number;
  min_velocity?: number;
  max_velocity?: number;
  min_acceleration?: number;
  max_acceleration?: number;
  sources?: string[];
  regions?: string[];
  keywords?: string[];
  notification_frequency?: 'immediate' | 'daily' | 'hourly';
  cooldown_minutes?: number;
}
```

#### Update Rule
```typescript
PATCH /api/alerts/[id]
// Same fields as create, all optional
```

#### List Rules
```typescript
GET /api/alerts?page=1&limit=20
// Returns: { rules: AlertRule[], total: number, page: number, limit: number, totalPages: number }
```

### Alert Events

#### List Events
```typescript
GET /api/alerts/events?page=1&limit=20&unread=true
// Returns: { events: AlertEvent[], total: number, page: number, limit: number, totalPages: number }
```

#### Mark as Read
```typescript
POST /api/alerts/events
{
  action: 'mark_read';
  eventId: string;
}
```

#### Mark All as Read
```typescript
POST /api/alerts/events
{
  action: 'mark_all_read';
  confirm: true;
}
```

### Background Job

#### Evaluate Alerts
```typescript
GET /api/jobs/alerts-evaluate?secret=your-secure-job-secret
// Returns: { success: boolean, evaluatedRules: number, createdEvents: number, results: Array }
```

## 🤝 Contributing

1. **Follow TypeScript** conventions and type safety
2. **Add tests** for new features
3. **Update documentation** for API changes
4. **Use conventional commits** for version control
5. **Test thoroughly** before submitting PRs

## 📄 License

This alerts system is part of the TrenderAI project and follows the same licensing terms.
