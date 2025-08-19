-- Create the live trends view for real-time data
CREATE OR REPLACE VIEW v_trends_live AS
SELECT 
    t.id,
    t.topic as title,
    t.source,
    COALESCE(t.region, 'US') as region,
    COALESCE(t.trend_score, t.score, 0) as score,
    COALESCE(t.velocity, 0) as velocity,
    COALESCE(t.acceleration, 0) as accel,
    t.image_url,
    t.url,
    t.observed_at as last_seen_at,
    CASE 
        WHEN t.signals IS NOT NULL THEN t.signals
        ELSE jsonb_build_object(
            'velocity', COALESCE(t.velocity, 0),
            'acceleration', COALESCE(t.acceleration, 0),
            'convergence', COALESCE(t.convergence, 0),
            'searchIntent', COALESCE(t.search_intent, 0),
            'creatorIndex', COALESCE(t.creator_index, 0),
            'engagementEfficiency', COALESCE(t.engagement_efficiency, 0),
            'geoSpread', COALESCE(t.geo_spread, 0)
        )
    END as signals,
    CASE 
        WHEN t.tags IS NOT NULL AND jsonb_typeof(t.tags) = 'array' THEN t.tags
        WHEN t.tags IS NOT NULL THEN jsonb_build_array(t.tags)
        ELSE jsonb_build_array()
    END as tags
FROM trend_record t
WHERE t.observed_at >= NOW() - INTERVAL '24 hours'
ORDER BY t.observed_at DESC;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trends_live_observed_at ON trend_record(observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trends_live_source ON trend_record(source);
CREATE INDEX IF NOT EXISTS idx_trends_live_region ON trend_record(region);
CREATE INDEX IF NOT EXISTS idx_trends_live_score ON trend_record(trend_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_trends_live_velocity ON trend_record(velocity DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_trends_live_acceleration ON trend_record(acceleration DESC NULLS LAST);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_trends_live_source_time ON trend_record(source, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trends_live_region_time ON trend_record(region, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trends_live_score_time ON trend_record(trend_score DESC NULLS LAST, observed_at DESC);

-- Create materialized view for hourly aggregations (optional, for manual refresh)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_trends_hourly AS
SELECT 
    date_trunc('hour', observed_at) as hour,
    source,
    region,
    COUNT(*) as trend_count,
    AVG(COALESCE(trend_score, score)) as avg_score,
    AVG(COALESCE(velocity, 0)) as avg_velocity,
    AVG(COALESCE(acceleration, 0)) as avg_acceleration,
    MAX(COALESCE(trend_score, score)) as max_score,
    MIN(COALESCE(trend_score, score)) as min_score
FROM trend_record
WHERE observed_at >= NOW() - INTERVAL '24 hours'
GROUP BY date_trunc('hour', observed_at), source, region
ORDER BY hour DESC, avg_score DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_trends_hourly_hour ON mv_trends_hourly(hour DESC);
CREATE INDEX IF NOT EXISTS idx_mv_trends_hourly_source ON mv_trends_hourly(source);
CREATE INDEX IF NOT EXISTS idx_mv_trends_hourly_region ON mv_trends_hourly(region);

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON v_trends_live TO your_app_user;
-- GRANT SELECT ON mv_trends_hourly TO your_app_user;

-- Add comments for documentation
COMMENT ON VIEW v_trends_live IS 'Real-time view of trending topics with signals and metadata';
COMMENT ON MATERIALIZED VIEW mv_trends_hourly IS 'Hourly aggregated trends data for analytics and manual refresh operations';
