# Twitter/X Ingestor (TrenderAI)

## Setup
1) `cd ingestion/twitter`
2) `python -m venv .venv && source .venv/bin/activate` (Windows: `.venv\Scripts\activate`)
3) `pip install -r requirements.txt`
4) Copy `.env.example` to `.env` and fill:
   - `DATABASE_URL` (Neon works great)
   - `TWITTER_BEARER_TOKEN`
   - optional: `TWITTER_API_BASE=https://api.twitter.com/2`
5) Copy `config.example.yaml` to `config.yaml` and customize queries/usernames.
   - Or set `TWITTER_CONFIG` env var to a different path.

## Initialize DB
```bash
python -c "from db import run_schema; import os; run_schema(os.path.join('ingestion','twitter','schema.sql'))"
```

(or just run the ingestor once; it applies schema automatically.)

## Run Once
```bash
export RUN_ONCE=true
python ingestion/twitter/ingest.py
```

## Run as Loop (every N minutes)
```bash
export INGEST_INTERVAL_MINUTES=15
python ingestion/twitter/ingest.py
```


