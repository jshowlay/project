-- TTI Views for rollup calculations
-- Run this after creating the TTI tables

-- View for hourly TTI metrics aggregation
CREATE OR REPLACE VIEW tti_hourly_metrics AS
SELECT 
  DATE(timestamp) as date,
  EXTRACT(hour FROM timestamp) as hour,
  metric_name,
  source,
  route,
  COUNT(*) as count,
  SUM(metric_value) as sum,
  MIN(metric_value) as min,
  MAX(metric_value) as max,
  AVG(metric_value) as avg,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric_value) as p99
FROM tti_metric
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp), EXTRACT(hour FROM timestamp), metric_name, source, route;

-- View for daily TTI metrics aggregation
CREATE OR REPLACE VIEW tti_daily_metrics AS
SELECT 
  DATE(timestamp) as date,
  metric_name,
  source,
  route,
  COUNT(*) as count,
  SUM(metric_value) as sum,
  MIN(metric_value) as min,
  MAX(metric_value) as max,
  AVG(metric_value) as avg,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric_value) as p99
FROM tti_metric
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), metric_name, source, route;

-- View for session performance summary
CREATE OR REPLACE VIEW tti_session_summary AS
SELECT 
  s.trace_id,
  s.session_id,
  s.page_url,
  s.browser,
  s.os,
  s.device_type,
  s.region,
  s.created_at,
  COUNT(e.id) as event_count,
  COUNT(m.id) as metric_count,
  AVG(m.metric_value) FILTER (WHERE m.metric_name = 'tti') as avg_tti,
  AVG(m.metric_value) FILTER (WHERE m.metric_name = 'fcp') as avg_fcp,
  AVG(m.metric_value) FILTER (WHERE m.metric_name = 'lcp') as avg_lcp,
  AVG(m.metric_value) FILTER (WHERE m.metric_name = 'cls') as avg_cls
FROM tti_session s
LEFT JOIN tti_event e ON s.id = e.session_id
LEFT JOIN tti_metric m ON s.id = m.session_id
WHERE s.created_at >= NOW() - INTERVAL '7 days'
GROUP BY s.id, s.trace_id, s.session_id, s.page_url, s.browser, s.os, s.device_type, s.region, s.created_at;

-- View for route performance analysis
CREATE OR REPLACE VIEW tti_route_performance AS
SELECT 
  route,
  COUNT(DISTINCT session_id) as session_count,
  AVG(metric_value) FILTER (WHERE metric_name = 'tti') as avg_tti,
  AVG(metric_value) FILTER (WHERE metric_name = 'fcp') as avg_fcp,
  AVG(metric_value) FILTER (WHERE metric_name = 'lcp') as avg_lcp,
  AVG(metric_value) FILTER (WHERE metric_name = 'cls') as avg_cls,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) FILTER (WHERE metric_name = 'tti') as p95_tti,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) FILTER (WHERE metric_name = 'fcp') as p95_fcp
FROM tti_metric
WHERE route IS NOT NULL 
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY route;

-- Function to refresh TTI aggregates
CREATE OR REPLACE FUNCTION refresh_tti_aggregates()
RETURNS void AS $$
BEGIN
  -- Delete old aggregates
  DELETE FROM tti_aggregate 
  WHERE date < CURRENT_DATE - INTERVAL '30 days';
  
  -- Insert hourly aggregates for the last 7 days
  INSERT INTO tti_aggregate (date, hour, metric_name, source, route, count, sum, min, max, avg, p50, p95, p99)
  SELECT 
    date,
    hour,
    metric_name,
    source,
    route,
    count,
    sum,
    min,
    max,
    avg,
    p50,
    p95,
    p99
  FROM tti_hourly_metrics
  ON CONFLICT (date, hour, metric_name, source, route) 
  DO UPDATE SET
    count = EXCLUDED.count,
    sum = EXCLUDED.sum,
    min = EXCLUDED.min,
    max = EXCLUDED.max,
    avg = EXCLUDED.avg,
    p50 = EXCLUDED.p50,
    p95 = EXCLUDED.p95,
    p99 = EXCLUDED.p99,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
