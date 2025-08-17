import os
import time
import json
import yaml
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from twitter_client import TwitterClient
from normalize import author_map, normalize_tweet
from db import db_cursor, run_schema

LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

def log(msg: str):
    if LOG_LEVEL in ("INFO","DEBUG"):
        print(msg, flush=True)

def ensure_schema():
    here = os.path.dirname(__file__)
    run_schema(os.path.join(here, "schema.sql"))

def upsert_author(cur, a: Dict[str, Any]):
    pm = (a.get("public_metrics") or {})
    cur.execute("""
        INSERT INTO twitter_authors (id, username, name, created_at, profile_image_url, verified,
                                     followers_count, following_count, tweet_count, listed_count, raw)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (id) DO UPDATE SET
          username=EXCLUDED.username,
          name=EXCLUDED.name,
          profile_image_url=EXCLUDED.profile_image_url,
          verified=EXCLUDED.verified,
          followers_count=EXCLUDED.followers_count,
          following_count=EXCLUDED.following_count,
          tweet_count=EXCLUDED.tweet_count,
          listed_count=EXCLUDED.listed_count,
          raw=EXCLUDED.raw
    """, (
        int(a["id"]), a.get("username"), a.get("name"), a.get("created_at"),
        a.get("profile_image_url"), a.get("verified"),
        pm.get("followers_count"), pm.get("following_count"),
        pm.get("tweet_count"), pm.get("listed_count"),
        json.dumps(a)
    ))

def upsert_tweet(cur, t: Dict[str, Any], keywords: List[str]):
    pm = (t.get("public_metrics") or {})
    cur.execute("""
        INSERT INTO twitter_tweets (
          id, author_id, text, lang, like_count, retweet_count, reply_count, quote_count,
          bookmark_count, impression_count, conversation_id, in_reply_to_user_id,
          possibly_sensitive, source, created_at, keywords, raw
        ) VALUES (
          %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
        )
        ON CONFLICT (id) DO UPDATE SET
          text=EXCLUDED.text,
          lang=EXCLUDED.lang,
          like_count=EXCLUDED.like_count,
          retweet_count=EXCLUDED.retweet_count,
          reply_count=EXCLUDED.reply_count,
          quote_count=EXCLUDED.quote_count,
          bookmark_count=EXCLUDED.bookmark_count,
          impression_count=EXCLUDED.impression_count,
          keywords=EXCLUDED.keywords,
          raw=EXCLUDED.raw
    """, (
        int(t["id"]),
        int(t["author_id"]) if t.get("author_id") else None,
        t.get("text"),
        t.get("lang"),
        pm.get("like_count"), pm.get("retweet_count"), pm.get("reply_count"), pm.get("quote_count"),
        pm.get("bookmark_count"), pm.get("impression_count"),
        int(t["conversation_id"]) if t.get("conversation_id") else None,
        int(t["in_reply_to_user_id"]) if t.get("in_reply_to_user_id") else None,
        t.get("possibly_sensitive"),
        t.get("source"),
        t.get("created_at"),
        keywords,
        json.dumps(t)
    ))

def upsert_normalized(cur, nm: Dict[str, Any]):
    cur.execute("""
      INSERT INTO normalized_content (
        source, external_id, author_username, author_id, title, content, url,
        published_at, metrics, tags, raw
      ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
      ON CONFLICT (source, external_id) DO UPDATE SET
        content=EXCLUDED.content,
        metrics=EXCLUDED.metrics,
        tags=EXCLUDED.tags,
        raw=EXCLUDED.raw
    """, (
        nm["source"],
        nm["external_id"],
        nm.get("author_username"),
        str(nm.get("author_id")) if nm.get("author_id") else None,
        nm.get("title"),
        nm.get("content"),
        nm.get("url"),
        nm.get("published_at"),
        json.dumps(nm.get("metrics") or {}),
        nm.get("tags") or [],
        json.dumps(nm.get("raw") or {})
    ))

def get_cursor(cur, key: str) -> Optional[str]:
    cur.execute("SELECT cursor_value FROM ingestion_cursors WHERE source='twitter' AND cursor_key=%s", (key,))
    r = cur.fetchone()
    return r["cursor_value"] if r else None

def set_cursor(cur, key: str, value: str):
    cur.execute("""
      INSERT INTO ingestion_cursors (source, cursor_key, cursor_value)
      VALUES ('twitter', %s, %s)
      ON CONFLICT (source, cursor_key) DO UPDATE SET
        cursor_value=EXCLUDED.cursor_value, updated_at=now()
    """, (key, value))

def load_config(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def ingest_recent_search(client: TwitterClient, cfg: Dict[str, Any], max_results: int):
    queries = cfg.get("queries") or []
    tags = cfg.get("tags") or ["twitter"]
    for q in queries:
        log(f"[recent_search] query: {q}")
        next_token = None
        cursor_key = f"recent:{q}"
        # since_id incremental
        with db_cursor() as cur:
            since_id = get_cursor(cur, cursor_key)

        page_count = 0
        while True:
            data = client.recent_search(q, max_results=max_results, next_token=next_token, since_id=since_id)
            includes = data.get("includes") or {}
            a_map = author_map(includes)
            tweets = data.get("data") or []
            meta = data.get("meta") or {}
            newest_id = meta.get("newest_id")
            for t in tweets:
                a = a_map.get(t.get("author_id"))
                with db_cursor() as cur:
                    if a:
                        upsert_author(cur, a)
                    upsert_tweet(cur, t, keywords=[q])
                    nm = normalize_tweet(t, a, tags)
                    upsert_normalized(cur, nm)

            if newest_id:
                with db_cursor() as cur:
                    set_cursor(cur, cursor_key, newest_id)

            next_token = meta.get("next_token")
            page_count += 1
            if not next_token or page_count >= 10:
                break

def ingest_user_timelines(client: TwitterClient, cfg: Dict[str, Any], max_results: int):
    usernames = cfg.get("usernames") or []
    tags = cfg.get("tags") or ["twitter"]
    for uname in usernames:
        log(f"[user_timeline] @{uname}")
        user = client.user_by_username(uname)
        if not user: 
            log(f"  - user not found: {uname}")
            continue
        uid = user["id"]
        with db_cursor() as cur:
            upsert_author(cur, user)

        cursor_key = f"user:{uid}"
        with db_cursor() as cur:
            since_id = get_cursor(cur, cursor_key)

        pagination_token = None
        page_count = 0
        while True:
            data = client.user_tweets(uid, max_results=max_results, pagination_token=pagination_token, since_id=since_id)
            includes = data.get("includes") or {}
            a_map = author_map(includes)
            tweets = data.get("data") or []
            meta = data.get("meta") or {}
            newest_id = meta.get("newest_id")
            for t in tweets:
                a = a_map.get(t.get("author_id")) or user
                with db_cursor() as cur:
                    if a:
                        upsert_author(cur, a)
                    upsert_tweet(cur, t, keywords=[f"@{uname}"])
                    nm = normalize_tweet(t, a, tags)
                    upsert_normalized(cur, nm)

            if newest_id:
                with db_cursor() as cur:
                    set_cursor(cur, cursor_key, newest_id)

            pagination_token = meta.get("next_token")
            page_count += 1
            if not pagination_token or page_count >= 10:
                break

def main():
    load_dotenv()
    ensure_schema()

    cfg_path = os.environ.get("TWITTER_CONFIG", os.path.join(os.path.dirname(__file__), "config.example.yaml"))
    cfg = load_config(cfg_path)

    interval_min = int(os.environ.get("INGEST_INTERVAL_MINUTES", "15"))
    max_results = int(os.environ.get("MAX_RESULTS_PER_CALL", "100"))

    client = TwitterClient()

    run_once = os.environ.get("RUN_ONCE", "false").lower() in ("1","true","yes")

    def cycle():
        ingest_recent_search(client, cfg, max_results=max_results)
        ingest_user_timelines(client, cfg, max_results=max_results)

    if run_once:
        cycle()
        return

    log(f"Starting loop: every {interval_min} min")
    while True:
        start = time.time()
        try:
            cycle()
        except Exception as e:
            print(f"[ERROR] {e}", flush=True)
        elapsed = time.time() - start
        sleep_for = max(10, interval_min*60 - int(elapsed))
        time.sleep(sleep_for)

if __name__ == "__main__":
    main()


