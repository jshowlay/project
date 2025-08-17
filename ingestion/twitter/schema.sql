-- Raw + normalized, plus light cursor storage

CREATE TABLE IF NOT EXISTS twitter_authors (
  id BIGINT PRIMARY KEY,
  username TEXT,
  name TEXT,
  created_at TIMESTAMPTZ,
  profile_image_url TEXT,
  verified BOOLEAN,
  followers_count INT,
  following_count INT,
  tweet_count INT,
  listed_count INT,
  raw JSONB
);

CREATE TABLE IF NOT EXISTS twitter_tweets (
  id BIGINT PRIMARY KEY,
  author_id BIGINT REFERENCES twitter_authors(id),
  text TEXT,
  lang TEXT,
  like_count INT,
  retweet_count INT,
  reply_count INT,
  quote_count INT,
  bookmark_count INT,
  impression_count INT,
  conversation_id BIGINT,
  in_reply_to_user_id BIGINT,
  possibly_sensitive BOOLEAN,
  source TEXT,
  created_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ DEFAULT now(),
  keywords TEXT[],
  raw JSONB
);

-- Generic normalized table used across sources
CREATE TABLE IF NOT EXISTS normalized_content (
  source TEXT NOT NULL,              -- e.g., 'twitter'
  external_id TEXT NOT NULL,         -- tweet id
  author_username TEXT,
  author_id TEXT,
  title TEXT,
  content TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ DEFAULT now(),
  metrics JSONB,
  tags TEXT[],
  raw JSONB,
  PRIMARY KEY (source, external_id)
);

-- Simple kv store for incremental cursors
CREATE TABLE IF NOT EXISTS ingestion_cursors (
  source TEXT NOT NULL,
  cursor_key TEXT NOT NULL,
  cursor_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (source, cursor_key)
);

CREATE INDEX IF NOT EXISTS idx_normalized_content_published_at
ON normalized_content (published_at);

CREATE INDEX IF NOT EXISTS idx_twitter_tweets_created_at
ON twitter_tweets (created_at);


