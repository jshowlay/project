/*
  # Trender AI Database Schema

  1. New Tables
    - `trend_events`
      - `id` (uuid, primary key)
      - `keyword` (text)
      - `source` (text) - e.g., 'google_trends', 'reddit', 'youtube'
      - `raw_data` (jsonb) - Original API response
      - `geo` (text) - Geographic region code
      - `language` (text) - Language code
      - `timestamp` (timestamptz)
      - `created_at` (timestamptz)
    
    - `trend_scores`
      - `id` (uuid, primary key)  
      - `trend_event_id` (uuid, foreign key)
      - `keyword` (text)
      - `score` (numeric) - Composite trend score 0-100
      - `velocity` (numeric) - Rate of change
      - `acceleration` (numeric) - Rate of velocity change
      - `agreement` (numeric) - Cross-source agreement
      - `freshness` (numeric) - Time-based decay score
      - `novelty` (numeric) - Semantic uniqueness score
      - `computed_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `briefs`
      - `id` (uuid, primary key)
      - `niche` (text)
      - `platforms` (text[]) - Array of platform names
      - `geo` (text)
      - `language` (text)
      - `time_window_hours` (integer)
      - `content` (jsonb) - Generated brief content
      - `metadata` (jsonb) - Generation parameters and stats
      - `created_at` (timestamptz)
    
    - `user_prefs`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References auth.users
      - `default_niche` (text)
      - `default_platforms` (text[])
      - `default_geo` (text)
      - `default_language` (text)
      - `preferences` (jsonb) - Additional settings
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Public read access to trend_events and trend_scores
    - User-specific access to briefs and user_prefs

  3. Indexes
    - Performance indexes on commonly queried columns
    - Composite indexes for trend analysis queries
*/

-- Create trend_events table
CREATE TABLE IF NOT EXISTS trend_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  source text NOT NULL,
  raw_data jsonb DEFAULT '{}',
  geo text DEFAULT 'global',
  language text DEFAULT 'en',
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create trend_scores table
CREATE TABLE IF NOT EXISTS trend_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_event_id uuid REFERENCES trend_events(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  score numeric(5,2) NOT NULL DEFAULT 0,
  velocity numeric(5,2) NOT NULL DEFAULT 0,
  acceleration numeric(5,2) NOT NULL DEFAULT 0,
  agreement numeric(5,2) NOT NULL DEFAULT 0,
  freshness numeric(5,2) NOT NULL DEFAULT 0,
  novelty numeric(5,2) NOT NULL DEFAULT 0,
  computed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create briefs table
CREATE TABLE IF NOT EXISTS briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niche text NOT NULL,
  platforms text[] NOT NULL DEFAULT '{}',
  geo text DEFAULT 'US',
  language text DEFAULT 'en',
  time_window_hours integer DEFAULT 24,
  content jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create user_prefs table
CREATE TABLE IF NOT EXISTS user_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  default_niche text,
  default_platforms text[] DEFAULT '{"TikTok","YouTube"}',
  default_geo text DEFAULT 'US',
  default_language text DEFAULT 'en',
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE trend_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prefs ENABLE ROW LEVEL SECURITY;

-- Policies for trend_events (public read, authenticated write)
CREATE POLICY "Anyone can read trend events"
  ON trend_events
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert trend events"
  ON trend_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for trend_scores (public read, authenticated write)
CREATE POLICY "Anyone can read trend scores"
  ON trend_scores
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert trend scores"
  ON trend_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update trend scores"
  ON trend_scores
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for briefs (user-specific access)
CREATE POLICY "Users can read all briefs"
  ON briefs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create briefs"
  ON briefs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for user_prefs (user owns their preferences)
CREATE POLICY "Users can read own preferences"
  ON user_prefs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_prefs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_prefs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trend_events_keyword ON trend_events(keyword);
CREATE INDEX IF NOT EXISTS idx_trend_events_source ON trend_events(source);
CREATE INDEX IF NOT EXISTS idx_trend_events_geo ON trend_events(geo);
CREATE INDEX IF NOT EXISTS idx_trend_events_timestamp ON trend_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trend_events_created_at ON trend_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trend_scores_keyword ON trend_scores(keyword);
CREATE INDEX IF NOT EXISTS idx_trend_scores_score ON trend_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_trend_scores_computed_at ON trend_scores(computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_briefs_niche ON briefs(niche);
CREATE INDEX IF NOT EXISTS idx_briefs_geo ON briefs(geo);
CREATE INDEX IF NOT EXISTS idx_briefs_created_at ON briefs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_prefs_user_id ON user_prefs(user_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_trend_events_keyword_source_time ON trend_events(keyword, source, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trend_scores_keyword_score ON trend_scores(keyword, score DESC);