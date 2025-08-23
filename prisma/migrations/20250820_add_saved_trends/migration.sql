-- Create saved_trends table
CREATE TABLE IF NOT EXISTS saved_trends (
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

-- Create unique constraint to prevent duplicate saves per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_trends_user_trend_unique 
ON saved_trends(user_id, trend_id, trend_source);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_trends_user_id ON saved_trends(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_trends_trend_id ON saved_trends(trend_id);
CREATE INDEX IF NOT EXISTS idx_saved_trends_created_at ON saved_trends(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_trends_source ON saved_trends(trend_source);
CREATE INDEX IF NOT EXISTS idx_saved_trends_region ON saved_trends(trend_region);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_saved_trends_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_trends_updated_at 
    BEFORE UPDATE ON saved_trends 
    FOR EACH ROW 
    EXECUTE FUNCTION update_saved_trends_updated_at();

-- Add comments for documentation
COMMENT ON TABLE saved_trends IS 'User saved trends with metadata';
COMMENT ON COLUMN saved_trends.user_id IS 'User identifier (session ID or user ID)';
COMMENT ON COLUMN saved_trends.trend_id IS 'Original trend identifier from trend_record table';
COMMENT ON COLUMN saved_trends.trend_source IS 'Source of the trend (google_trends, reddit, etc.)';
COMMENT ON COLUMN saved_trends.trend_topic IS 'Original topic/title of the trend';
COMMENT ON COLUMN saved_trends.trend_title IS 'Display title for the saved trend';
COMMENT ON COLUMN saved_trends.trend_url IS 'URL associated with the trend';
COMMENT ON COLUMN saved_trends.trend_image_url IS 'Image URL for the trend';
COMMENT ON COLUMN saved_trends.trend_score IS 'Trend score at time of saving';
COMMENT ON COLUMN saved_trends.trend_velocity IS 'Velocity at time of saving';
COMMENT ON COLUMN saved_trends.trend_acceleration IS 'Acceleration at time of saving';
COMMENT ON COLUMN saved_trends.trend_region IS 'Geographic region of the trend';
COMMENT ON COLUMN saved_trends.trend_tags IS 'Tags associated with the trend';
COMMENT ON COLUMN saved_trends.trend_observed_at IS 'When the trend was originally observed';
