# TrenderAI Fresh Sources

Five connectors: Wikipedia Most Read, Hacker News (front page & newest), Product Hunt (today), Apple App Store RSS (US top charts), and CoinGecko Trending Search.

## Features

- **Wikipedia**: Yesterday's most read articles (top 100)
- **Hacker News**: Front page rankings + newest stories with points/comments
- **Product Hunt**: Today's top products with votes/comments (requires API token)
- **Apple App Store**: Top free and paid apps in US (configurable region)
- **CoinGecko**: Trending cryptocurrency searches

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Database**: PostgreSQL (with optional TimescaleDB support)
- **HTTP**: Axios with retry logic
- **Scheduling**: node-cron (every 15 minutes)
- **Logging**: Pino
- **Validation**: Zod
- **Package Manager**: pnpm

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment configuration**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   PG_URL=postgres://user:pass@localhost:5432/trenderai
   PH_TOKEN=YOUR_PRODUCTHUNT_API_TOKEN
   REGION_DEFAULT=US
   KEYWORDS=ai agents, consumer trends
   LOG_LEVEL=info
   ```

3. **Start PostgreSQL** (and TimescaleDB if desired)

4. **Run the application**:
   ```bash
   # Development
   pnpm dev
   
   # Production
   pnpm start
   
   # Build
   pnpm build
   ```

## Database Schema

The application automatically creates the `signals` table with the following structure:

```sql
CREATE TABLE signals(
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  topic TEXT,
  metric TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  unit TEXT,
  "window" TEXT,
  region TEXT,
  url TEXT,
  tags TEXT[],
  raw JSONB,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bucket_min TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', NOW())
);
```

### Deduplication

- **Dedupe key**: `(source, entity_id, metric, window, bucket_min)`
- Re-runs in the same minute overwrite the last value
- Safe to run multiple instances

### Indexes

- `ux_signals_src_ent_metric_win_bucket` - Unique constraint for deduplication
- `ix_signals_ts` - Time-based queries
- `ix_signals_source_metric` - Source and metric filtering

## TimescaleDB Support (Optional)

To enable TimescaleDB features, run these commands in your PostgreSQL database:

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertable
SELECT create_hypertable('signals','captured_at', if_not_exists => TRUE);

-- Optional: Create continuous aggregate for hourly summaries
CREATE MATERIALIZED VIEW IF NOT EXISTS signals_1h WITH (timescaledb.continuous) AS
  SELECT time_bucket('1 hour', captured_at) AS bucket, source, metric, region,
         AVG(value) AS avg_value, MAX(value) AS max_value
  FROM signals
  GROUP BY bucket, source, metric, region;
```

## Data Sources

### Wikipedia (`wikipedia`)
- **Endpoint**: Wikimedia Pageviews API
- **Data**: Yesterday's most read articles
- **Metrics**: `pageviews.rank`
- **Frequency**: Daily (harmless to re-run due to dedupe)

### Hacker News (`hackernews`)
- **Endpoint**: Algolia HN API
- **Data**: Front page + newest stories
- **Metrics**: `frontpage.rank`, `points`, `comments`
- **Frequency**: Every 15 minutes

### Product Hunt (`producthunt`)
- **Endpoint**: GraphQL v2 API
- **Data**: Today's top products
- **Metrics**: `votes`, `comments`
- **Requirements**: API token (`PH_TOKEN`)
- **Frequency**: Every 15 minutes

### Apple App Store (`apple_appstore`)
- **Endpoint**: Apple Marketing Tools RSS
- **Data**: Top free and paid apps
- **Metrics**: `rank.top_free`, `rank.top_paid`
- **Configurable**: Region via `REGION_DEFAULT`
- **Frequency**: Every 15 minutes

### CoinGecko (`coingecko`)
- **Endpoint**: CoinGecko Trending API
- **Data**: Trending cryptocurrency searches
- **Metrics**: `search.trending_rank`
- **Requirements**: None (free API)
- **Frequency**: Every 15 minutes

## Extending

To add new data sources:

1. Create a new file in `src/sources/`
2. Export a function that returns `Promise<SignalRow[]>`
3. Add the function to `runOnce()` in `src/index.ts`

Example:
```typescript
// src/sources/example.ts
import { getJson, floorToMinute } from "../utils";
import { SignalRow } from "../types";

export async function fetchExample(): Promise<SignalRow[]> {
  const data = await getJson("https://api.example.com/data");
  const bucket = floorToMinute();
  
  return data.items.map((item, idx) => ({
    source: "example",
    entity_id: item.id,
    entity_name: item.name,
    metric: "example.metric",
    value: item.value,
    unit: "units",
    window: "now",
    url: item.url,
    raw: item,
    bucket_min: bucket
  }));
}
```

## Deployment

### Background Worker
```bash
# Build the application
pnpm build

# Run in production
NODE_ENV=production pnpm start
```

### Serverless Cron
The application is safe to run as a serverless function with a 15-minute cron trigger.

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
CMD ["pnpm", "start"]
```

## Monitoring

The application logs:
- Ingestion counts per source
- Processing time
- Errors with retry logic
- Database connection status

Log levels: `error`, `warn`, `info`, `debug`

## Notes

- **Safe to re-run**: Deduplication prevents duplicate data
- **Fault tolerant**: Individual source failures don't stop other sources
- **Rate limiting**: Built-in retry logic with exponential backoff
- **Memory efficient**: Processes data in batches
- **Production ready**: Includes proper error handling and logging

## Signals Integration (Local)

1) `cp .env.example .env` and set `PG_URL`.
2) `npm run db:up` to start Postgres.
3) `npm run db:migrate` to create schema & views.
4) Start your ingestion worker (the 5-source worker you built) with the same `PG_URL`.
5) Run the app; open `/trends`.
6) Optional: `npm run db:refresh` forces materialized view refresh.

## Notes

- Trending score is %Δ between now(15m) and baseline(24h). For rank metrics (name starts with `rank.`), lower ranks score higher (we invert).
- Everything is additive. To add new sources later, just keep writing to `signals`.

### Neon Postgres (no Docker)
1) Copy `.env.example` → `.env` and paste your Neon **PG_URL** (keep `?sslmode=require`).
2) Run `npm run db:migrate` (creates table & view).
3) Start your 5-source worker (with the same PG_URL). If using the worker repo, ensure its `src/db.ts` includes SSL (this prompt patches it).
4) Verify:
   - `npm run db:test`
   - Hit `/api/health/db` (Next.js) or run the worker once to see "ingested".# trenderai_black
