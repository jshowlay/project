import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { alertsDB, AlertRule } from '../../../../lib/alerts';

// Environment validation
const ALERT_JOB_SECRET = process.env.ALERT_JOB_SECRET;

interface TrendData {
  id: string;
  source: string;
  topic: string;
  title?: string;
  url?: string;
  image_url?: string;
  score?: number;
  velocity?: number;
  acceleration?: number;
  region?: string;
  tags?: string[];
  observed_at: Date;
}

export async function GET(request: NextRequest) {
  try {
    // Verify job secret for security
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (!ALERT_JOB_SECRET || secret !== ALERT_JOB_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting alert evaluation job...');
    
    // Get all active alert rules
    const activeRules = await alertsDB.getActiveAlertRules();
    
    if (activeRules.length === 0) {
      console.log('No active alert rules found');
      return NextResponse.json({ 
        success: true, 
        message: 'No active alert rules found',
        evaluatedRules: 0,
        createdEvents: 0
      });
    }

    console.log(`Found ${activeRules.length} active alert rules`);

    // Get recent trend data (last 2 hours, limited to 2000 records)
    const recentTrends = await getRecentTrends();
    
    if (recentTrends.length === 0) {
      console.log('No recent trend data found');
      return NextResponse.json({ 
        success: true, 
        message: 'No recent trend data found',
        evaluatedRules: activeRules.length,
        createdEvents: 0
      });
    }

    console.log(`Found ${recentTrends.length} recent trends to evaluate`);

    // Evaluate each rule against recent trends
    let totalEventsCreated = 0;
    const evaluationResults = [];

    for (const rule of activeRules) {
      const ruleEvents = await evaluateRule(rule, recentTrends);
      totalEventsCreated += ruleEvents;
      
      evaluationResults.push({
        ruleId: rule.id,
        ruleName: rule.name,
        eventsCreated: ruleEvents
      });
    }

    console.log(`Alert evaluation completed. Created ${totalEventsCreated} events`);

    return NextResponse.json({
      success: true,
      message: 'Alert evaluation completed successfully',
      evaluatedRules: activeRules.length,
      evaluatedTrends: recentTrends.length,
      createdEvents: totalEventsCreated,
      results: evaluationResults
    });

  } catch (error) {
    console.error('Error in alert evaluation job:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get recent trend data from the database
async function getRecentTrends(): Promise<TrendData[]> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Try to use materialized view first, fallback to regular table
    let query = `
      SELECT 
        id,
        source,
        topic,
        COALESCE(trend_score, score) as score,
        COALESCE(velocity, 0) as velocity,
        COALESCE(acceleration, 0) as acceleration,
        region,
        url,
        image_url,
        tags,
        observed_at
      FROM v_trends_live
      WHERE observed_at >= NOW() - INTERVAL '2 hours'
      ORDER BY observed_at DESC
      LIMIT 2000
    `;

    const result = await pool.query(query);
    
    return result.rows.map(row => ({
      id: row.id,
      source: row.source,
      topic: row.topic,
      title: row.topic, // Use topic as title if no separate title field
      url: row.url,
      image_url: row.image_url,
      score: row.score,
      velocity: row.velocity,
      acceleration: row.acceleration,
      region: row.region,
      tags: row.tags || [],
      observed_at: new Date(row.observed_at),
    }));

  } catch (error) {
    console.warn('Failed to use v_trends_live view, falling back to trend_record table:', error);
    
    // Fallback to direct table query
    const fallbackQuery = `
      SELECT 
        id,
        source,
        topic,
        score,
        region,
        url,
        image_url,
        tags,
        observed_at
      FROM trend_record
      WHERE observed_at >= NOW() - INTERVAL '2 hours'
      ORDER BY observed_at DESC
      LIMIT 2000
    `;

    const result = await pool.query(fallbackQuery);
    
    return result.rows.map(row => ({
      id: row.id,
      source: row.source,
      topic: row.topic,
      title: row.topic,
      url: row.url,
      image_url: row.image_url,
      score: row.score,
      velocity: 0, // Default values for missing fields
      acceleration: 0,
      region: row.region,
      tags: row.tags || [],
      observed_at: new Date(row.observed_at),
    }));
  } finally {
    await pool.end();
  }
}

// Evaluate a single rule against trend data
async function evaluateRule(rule: AlertRule, trends: TrendData[]): Promise<number> {
  let eventsCreated = 0;

  for (const trend of trends) {
    // Check if trend matches rule filters
    if (!matchesRuleFilters(rule, trend)) {
      continue;
    }

    // Check if trend meets signal thresholds
    if (!meetsSignalThresholds(rule, trend)) {
      continue;
    }

    // Check cooldown to prevent spam
    const hasRecentAlert = await alertsDB.checkRecentAlert(
      rule.id,
      trend.id,
      trend.source,
      rule.cooldown_minutes
    );

    if (hasRecentAlert) {
      continue;
    }

    // Create alert event
    try {
      await alertsDB.createAlertEvent({
        rule_id: rule.id,
        user_id: rule.user_id,
        trend_id: trend.id,
        trend_source: trend.source,
        trend_topic: trend.topic,
        trend_title: trend.title,
        trend_url: trend.url,
        trend_image_url: trend.image_url,
        trend_score: trend.score,
        trend_velocity: trend.velocity,
        trend_acceleration: trend.acceleration,
        trend_region: trend.region,
        trend_tags: trend.tags,
        trend_observed_at: trend.observed_at,
      });

      eventsCreated++;
    } catch (error) {
      // Log error but continue processing other trends
      console.error(`Error creating alert event for rule ${rule.id}, trend ${trend.id}:`, error);
    }
  }

  return eventsCreated;
}

// Check if trend matches rule filters
function matchesRuleFilters(rule: AlertRule, trend: TrendData): boolean {
  // Check source filter
  if (rule.sources && rule.sources.length > 0) {
    if (!rule.sources.includes(trend.source)) {
      return false;
    }
  }

  // Check region filter
  if (rule.regions && rule.regions.length > 0) {
    if (!rule.regions.includes(trend.region || 'US')) {
      return false;
    }
  }

  // Check keyword filter
  if (rule.keywords && rule.keywords.length > 0) {
    const trendText = `${trend.topic} ${trend.title || ''}`.toLowerCase();
    const hasKeyword = rule.keywords.some(keyword => 
      trendText.includes(keyword.toLowerCase())
    );
    if (!hasKeyword) {
      return false;
    }
  }

  return true;
}

// Check if trend meets signal thresholds
function meetsSignalThresholds(rule: AlertRule, trend: TrendData): boolean {
  // Check score thresholds
  if (rule.min_score !== undefined && (trend.score || 0) < rule.min_score) {
    return false;
  }
  if (rule.max_score !== undefined && (trend.score || 0) > rule.max_score) {
    return false;
  }

  // Check velocity thresholds
  if (rule.min_velocity !== undefined && (trend.velocity || 0) < rule.min_velocity) {
    return false;
  }
  if (rule.max_velocity !== undefined && (trend.velocity || 0) > rule.max_velocity) {
    return false;
  }

  // Check acceleration thresholds
  if (rule.min_acceleration !== undefined && (trend.acceleration || 0) < rule.min_acceleration) {
    return false;
  }
  if (rule.max_acceleration !== undefined && (trend.acceleration || 0) > rule.max_acceleration) {
    return false;
  }

  return true;
}
