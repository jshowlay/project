-- Add EWMA and trend_score fields to trends table
-- This migration adds the necessary fields for trend analytics computation

-- Add ewma column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trends' AND column_name = 'ewma') THEN
        ALTER TABLE trends ADD COLUMN ewma DECIMAL(15,4);
        RAISE NOTICE 'Added ewma column to trends table';
    ELSE
        RAISE NOTICE 'ewma column already exists in trends table';
    END IF;
END $$;

-- Add trend_score column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trends' AND column_name = 'trend_score') THEN
        ALTER TABLE trends ADD COLUMN trend_score INTEGER DEFAULT 0;
        RAISE NOTICE 'Added trend_score column to trends table';
    ELSE
        RAISE NOTICE 'trend_score column already exists in trends table';
    END IF;
END $$;

-- Create index on ewma for better query performance
CREATE INDEX IF NOT EXISTS idx_trends_ewma ON trends(ewma);

-- Create index on trend_score for better query performance
CREATE INDEX IF NOT EXISTS idx_trends_trend_score ON trends(trend_score);

-- Create composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_trends_analytics ON trends(ewma, trend_score, created_at);

-- Initialize ewma values for existing trends (set to current score)
UPDATE trends 
SET ewma = score 
WHERE ewma IS NULL AND score > 0;

-- Initialize trend_score values for existing trends
UPDATE trends 
SET trend_score = COALESCE(score, 0)
WHERE trend_score IS NULL;

-- Add comment to document the fields
COMMENT ON COLUMN trends.ewma IS 'Exponential Weighted Moving Average of the trend score';
COMMENT ON COLUMN trends.trend_score IS 'Computed trend score based on EWMA, engagement, and recency';
