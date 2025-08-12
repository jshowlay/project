# TrenderAI - Multi-Source Trend Analysis Platform

A real-time trend analysis platform that aggregates data from multiple sources (Reddit, YouTube, News APIs, Crypto, Stocks) and provides a unified scoring system with a modern dark-themed dashboard.

## 🚀 Features

- **Multi-Source Ingestion**: Reddit, YouTube, NewsAPI, CoinGecko, Alpha Vantage
- **Unified Scoring**: Normalized 0-100 scoring across all sources
- **Real-time Dashboard**: Dark theme with golden accents (#000 / #e5c35a)
- **Caching & Rate Limiting**: Redis-powered caching and API rate limiting
- **Production Ready**: Vercel deployment with cron jobs
- **Type Safety**: Full TypeScript with Zod validation

## 🏗️ Architecture

```
src/
├── types/          # Shared TypeScript interfaces
├── integrations/   # API adapters for each data source
├── server/         # Database, caching, and ingestion logic
app/
├── api/           # Next.js API routes
├── (dashboard)/   # Dashboard UI components
```

## 🛠️ Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure:
```bash
cp env.example .env
```

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `CRON_SECRET` - Secret for ingestion endpoint

**Optional (activate adapters):**
- `REDDIT_CLIENT_ID` & `REDDIT_CLIENT_SECRET` - Reddit API
- `YOUTUBE_API_KEY` - YouTube Data API
- `NEWSAPI_KEY` - NewsAPI.org
- `ALPHAVANTAGE_KEY` - Alpha Vantage (stocks/crypto)

### 3. Database Setup
```bash
# Generate Prisma client
pnpm run build

# Run migrations
pnpm run migrate
```

### 4. Start Development
```bash
pnpm dev
```

Visit `http://localhost:3000` for the dashboard.

## 📊 API Endpoints

### Public Endpoints
- `GET /api/trends` - Fetch trend data with filtering
- `GET /api/sources` - List active data sources
- `GET /api/health` - Health check

## 🔍 Search

- Fast search across topics and tags using SQLite LIKE queries
- Debounced search input with 300ms delay
- Search across all data sources simultaneously
- Results ranked by recency and score

### Search Setup
1) Run migrations:
   ```bash
   npm run migrate  # or: npx prisma migrate dev -n add_search_indexes
   ```
2) Start dev server:
   ```bash
   npm run dev
   ```
3) Ingest data (if needed):
   ```bash
   curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/ingest
   ```

## Query Operators
Alongside free-text, you can add operators inside `q`:

- `tag:<value>` — match any tag (case-insensitive). Example: `tag:ai`, `tag:"gen ai"`.
- `source:<id>` — one or more sources. Example: `source:reddit source:youtube`.
- `region:<ISO>` — region code (e.g., `region:US`).
- `since:<date|rel>` — filter by observedAt >= value. ISO `YYYY-MM-DD` or relative: `24h`, `7d`, `2w`, `3m`.
- `until:<date|rel>` / `before:<date|rel>` — observedAt <= value.
- `score:>N` `score:<N` — filter by normalized score (0–100).
- `delta24h:>N` `delta24h:<N` — filter by 24h change where available (stocks/crypto).
- `sort:rank|score|recency` — default is `rank` when there's text, otherwise `recency`.

Examples:
- `ai agents OR robotics -crypto sort:rank`
- `tag:crypto source:coingecko since:7d sort:score`
- `NVDA source:alphavantage score:>60`
- `"founder stories" source:reddit region:US since:2025-08-01`

## Operator Chips
- When you type operators in the search (e.g., `tag:ai source:reddit since:7d sort:score`), chips render under the input.
- Click ✕ on any chip to remove that operator from the query; the search updates automatically.
- The Source dropdown (right of the input) also shows as a chip. Removing it clears the dropdown filter.

## Search Autocomplete
- Start typing to see operator suggestions like `tag:`, `source:`, `since:`, `sort:`, etc.
- After an operator, you'll get value suggestions:
  - `source:` shows active sources from `/api/sources`
  - `tag:` shows popular tags from `/api/tags`
  - `region:` shows available regions from `/api/regions`
  - `since:` / `until:` offer relative presets like `24h`, `7d`, `1m` (or type a date `YYYY-MM-DD`)
  - `sort:` offers `rank`, `score`, `recency`
  - `score:` and `delta24h:` offer quick comparators like `>70`, `<20`, etc.
- Keyboard: ↑/↓ to move, Enter/Tab to apply, Esc to close. Click to select as well.

## Recent Searches (per browser)
- The dashboard saves up to 15 recent queries (operators + text) in `localStorage`.
- Dedupe is case/whitespace-insensitive; newest wins.
- Click any chip to re-run it instantly.
- Click ★ to pin/unpin; pinned items float to the top.
- Remove a single item with ✕, or **Clear history** to wipe all.
- History is stored locally in your browser and does not sync across devices.

### Protected Endpoints
- `POST /api/ingest` - Trigger data ingestion (requires `Authorization: Bearer $CRON_SECRET`)

### Query Parameters
- `source` - Filter by data source (reddit, youtube, etc.)
- `q` - Search topics
- `region` - Filter by region
- `since` - Filter by date (ISO string)
- `limit` - Results per page (max 200)
- `page` - Page number

## 🔄 Data Ingestion

### Manual Ingestion
```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/ingest
```

### Automated Ingestion (Vercel)
Add a Scheduled Job in Vercel:
- **URL**: `https://your-app.vercel.app/api/ingest`
- **Headers**: `Authorization: Bearer $CRON_SECRET`
- **Schedule**: `0 */6 * * *` (every 6 hours)

### Local Development Cron
Set `ENABLE_LOCAL_CRON=true` in `.env` for automatic ingestion every 5 minutes.

## 🎨 Theming

The application uses a dark theme with golden accents:
- **Background**: `#000` (black)
- **Accent**: `#e5c35a` (golden)
- **Cards**: `#111` with `#222` borders
- **Text**: White with opacity variations

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with UI
pnpm test --ui
```

## 📦 Production Deployment

### Vercel
1. Push this repo to GitHub/GitLab/Bitbucket and import it in Vercel.
2. In **Project Settings → Environment Variables**, set:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `CRON_SECRET`
   - `USE_SEARCH_MV=true`
   - `SENTRY_DSN` (optional)
3. Commit the provided `vercel.json` — Vercel registers Cron automatically on production deploys.
   - `*/5 * * * *` → `POST /api/ingest`
   - `0 2 * * *` → `POST /api/refresh-mv`
   - `*/15 * * * *` → `GET /api/health`
4. Vercel Cron sends `Authorization: Bearer $CRON_SECRET` to your functions. Your routes validate this before running the task.
5. After first deploy:
   - Run one manual ingest to seed data:
     ```bash
     curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/ingest
     ```
   - Open `https://<your-domain>/` (dashboard).
   - Check `https://<your-domain>/api/health`.

### Docker (self-host)
```bash
docker compose -f docker-compose.prod.yml up -d
# First-time DB setup:
docker compose -f docker-compose.prod.yml exec web npx prisma migrate deploy
```

## 🔧 Development

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm migrate` - Run database migrations
- `pnpm test` - Run tests
- `pnpm lint` - Run ESLint

### Adding New Data Sources
1. Create adapter in `src/integrations/`
2. Implement `Adapter` interface
3. Add to `activeAdapters()` in `src/integrations/index.ts`
4. Update dashboard source filter

## 📈 Data Flow

1. **Ingestion**: Cron job triggers `/api/ingest`
2. **Fetching**: Active adapters fetch from external APIs
3. **Scoring**: Raw data normalized to 0-100 scale
4. **Storage**: Data saved to PostgreSQL
5. **Caching**: Latest 100 items cached in Redis
6. **Display**: Dashboard fetches from cache/DB

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## Hardening Notes
- **De-dupe:** Records are upserted by `(source, topic, observedBucket)` where `observedBucket = date_trunc('hour', observedAt)`. This prevents hourly duplicate spam while still allowing updates.
- **Search MV:** When `USE_SEARCH_MV=true` and there's a text query, `/api/trends` uses `tr_trends_mv` for ranked FTS; nightly refresh at 02:00 if `ENABLE_LOCAL_CRON=true`. You can also call the refresh manually in a SQL console: `REFRESH MATERIALIZED VIEW CONCURRENTLY tr_trends_mv;`.
- **API Guard:** All trend items are sanitized via Zod before returning; `tags` are always `string[]`.
- **UX:** Dashboard shows skeletons on first load, an error toast on failures, and a Load-more button when more results exist.
- **Sentry (optional):** Set `SENTRY_DSN` to enable capture on server and client. Basic PII scrubbing is enabled by default.

## 📄 License

MIT License - see LICENSE file for details.