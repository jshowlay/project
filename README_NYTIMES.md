# NYTimes Integration

This integration fetches news content from the New York Times API and stores it in a normalized `content_items` table.

## Setup

1. **Environment Variables**
   ```bash
   # Copy and configure your .env file
   cp env.example .env
   ```

   Required variables:
   - `DATABASE_URL`: PostgreSQL connection string (Neon recommended)
   - `NYT_API_KEY`: Your NYTimes API key

   Optional variables:
   - `NYT_TOP_SECTIONS`: Comma-separated sections (default: home,technology,business,world,science,us)
   - `NYT_MOSTPOPULAR_PERIODS`: Comma-separated periods in days (default: 1,7)
   - `NYT_TIMESWIRE_HOURS`: Hours to look back for Times Wire (default: 24)
   - `INGEST_CRON`: Cron schedule for automated ingestion (default: */15 * * * *)
   - `NYT_SEMANTIC_MAX_RESULTS`: Max results for TimesTags API (default: 10)
   - `NYT_SEMANTIC_SAMPLE_WINDOW_HOURS`: Window for semantic enrichment (default: 24)

2. **Database Migration**
   ```bash
   pnpm run migrate:nyt
   ```

3. **Test Setup**
   ```bash
   pnpm run test:nyt
   ```

## Usage

### One-time Ingestion
```bash
pnpm run ingest:nyt:once
```

### Backfill with Historical Data
```bash
pnpm run ingest:nyt:backfill
```

### Semantic Enrichment
```bash
pnpm run enrich:nyt:semantics
```

### Automated Scheduler
```bash
pnpm run worker
```

The scheduler runs:
- NYTimes ingestion every 15 minutes (configurable via `INGEST_CRON`)
- Semantic enrichment every hour at 5 minutes past the hour

## API Endpoints

The integration covers these NYTimes API endpoints:

- **Times Wire**: Real-time newswire content
- **Top Stories**: Current stories by section
- **Most Popular**: Viewed, shared, and emailed articles
- **Article Search**: Historical article search (backfill only)
- **Archive**: Monthly archives (backfill only)

## Semantic Enrichment

The integration includes semantic enrichment using NYTimes TimesTags API:

- **TimesTags Suggestions**: Automatically suggests canonical NYT tags for article content
- **Entity Extraction**: Extracts people, organizations, geographic locations, and descriptive terms
- **Caching**: Results are cached in `nyt_concept_cache` table to avoid rate limits
- **Automatic Processing**: Runs every hour to enrich recent articles

## Data Structure

All content is normalized into the `content_items` table with these fields:

- `id`: SHA256 hash (stable unique identifier)
- `source`: Always 'nytimes'
- `channel`: API endpoint used (timeswire, topstories, mostpopular, etc.)
- `url`: Article URL
- `title`, `abstract`, `byline`: Article metadata
- `section`, `subsection`: Content categorization
- `published_at`, `updated_at`: Timestamps
- `tags`: Array of topic tags
- `entities`: JSONB with person, organization, geographic, and descriptive entities
- `media`: JSONB with multimedia content
- `popularity`: JSONB with popularity metrics
- `editorial`: Boolean flag for editorial content
- `raw`: Full API response as JSONB

## Rate Limits

- Times Wire: No documented limits
- Top Stories: No documented limits  
- Most Popular: No documented limits
- Article Search: ~10 requests/minute, 4,000/day
- Archive: ~10 requests/minute, 4,000/day

The integration includes built-in rate limiting with sleep delays between requests.

## Verification

Check your data:
```sql
SELECT source, channel, count(*) as n, max(published_at) as latest
FROM content_items
WHERE source='nytimes'
GROUP BY 1,2
ORDER BY latest desc nulls last;
```
