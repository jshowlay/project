-- Alerts MVP Database Schema
-- This creates the complete alerts system with rules and events tables

-- Create alert_rules table for user-defined monitoring rules
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Signal thresholds
    min_score DECIMAL(10,2),
    max_score DECIMAL(10,2),
    min_velocity DECIMAL(10,2),
    max_velocity DECIMAL(10,2),
    min_acceleration DECIMAL(10,2),
    max_acceleration DECIMAL(10,2),
    
    -- Filters
    sources TEXT[], -- Array of source names to monitor
    regions TEXT[], -- Array of regions to monitor
    keywords TEXT[], -- Array of keywords to match in topic/title
    
    -- Notification settings
    notification_frequency VARCHAR(20) DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'daily', 'hourly')),
    cooldown_minutes INTEGER DEFAULT 60, -- Minimum time between alerts for same rule
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT alert_rules_valid_thresholds CHECK (
        (min_score IS NULL OR max_score IS NULL OR min_score <= max_score) AND
        (min_velocity IS NULL OR max_velocity IS NULL OR min_velocity <= max_velocity) AND
        (min_acceleration IS NULL OR max_acceleration IS NULL OR min_acceleration <= max_acceleration)
    ),
    CONSTRAINT alert_rules_at_least_one_signal CHECK (
        min_score IS NOT NULL OR max_score IS NOT NULL OR
        min_velocity IS NOT NULL OR max_velocity IS NOT NULL OR
        min_acceleration IS NOT NULL OR max_acceleration IS NOT NULL
    )
);

-- Create alert_events table for triggered alerts
CREATE TABLE IF NOT EXISTS alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    
    -- Trend data snapshot
    trend_id VARCHAR(255) NOT NULL,
    trend_source VARCHAR(32) NOT NULL,
    trend_topic VARCHAR(500) NOT NULL,
    trend_title VARCHAR(500),
    trend_url TEXT,
    trend_image_url TEXT,
    trend_score DECIMAL(10,2),
    trend_velocity DECIMAL(10,2),
    trend_acceleration DECIMAL(10,2),
    trend_region VARCHAR(10),
    trend_tags TEXT[],
    trend_observed_at TIMESTAMP WITH TIME ZONE,
    
    -- Alert metadata
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Notification status
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Unique constraint to prevent duplicate alerts for same rule/trend
    CONSTRAINT alert_events_unique_rule_trend UNIQUE (rule_id, trend_id, trend_source)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alert_rules_user_id ON alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alert_rules_created_at ON alert_rules(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_rules_sources ON alert_rules USING GIN(sources);
CREATE INDEX IF NOT EXISTS idx_alert_rules_regions ON alert_rules USING GIN(regions);
CREATE INDEX IF NOT EXISTS idx_alert_rules_keywords ON alert_rules USING GIN(keywords);

CREATE INDEX IF NOT EXISTS idx_alert_events_user_id ON alert_events(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_events_rule_id ON alert_events(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_events_triggered_at ON alert_events(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_events_unread ON alert_events(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_alert_events_trend ON alert_events(trend_id, trend_source);
CREATE INDEX IF NOT EXISTS idx_alert_events_user_triggered ON alert_events(user_id, triggered_at DESC);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for alert_rules updated_at
CREATE TRIGGER update_alert_rules_updated_at 
    BEFORE UPDATE ON alert_rules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to mark alert events as read
CREATE OR REPLACE FUNCTION mark_alert_event_read(event_id UUID, user_id_param VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE alert_events 
    SET is_read = true, read_at = NOW()
    WHERE id = event_id AND user_id = user_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to get unread alert count for user
CREATE OR REPLACE FUNCTION get_unread_alert_count(user_id_param VARCHAR(255))
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM alert_events 
        WHERE user_id = user_id_param AND is_read = false
    );
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE alert_rules IS 'User-defined monitoring rules for trend alerts';
COMMENT ON TABLE alert_events IS 'Triggered alerts with trend snapshots';
COMMENT ON FUNCTION mark_alert_event_read IS 'Mark an alert event as read for a specific user';
COMMENT ON FUNCTION get_unread_alert_count IS 'Get count of unread alerts for a user';
