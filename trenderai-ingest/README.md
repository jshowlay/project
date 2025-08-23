# TrenderAI Ingest (YouTube, GDELT, Reddit, RSS)

## Quick start
1) `cp env.example .env` and fill values.
2) `docker-compose up -d`  (starts Postgres + Redis)
3) `npm i`
4) `npm run db:migrate`
5) Dev mode: `npm run dev`

## One-off runs (debug)
- `npm run run:youtube`
- `npm run run:gdelt`
- `npm run run:reddit`
- `npm run run:rss`

### Notes
- Reddit uses **password grant** to ensure `read` scope works for subreddit listings. Use a throwaway account if needed, respect Reddit ToS.
- RSS accepts both native feeds and RSSHub endpoints.
- Extend schema and enrichment as needed (language detection, NER, OpenGraph).











