import { Pool, PoolClient, QueryResult } from 'pg';
import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
});

// Alert rule schema validation
const AlertRuleSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  
  // Signal thresholds
  min_score: z.number().min(0).max(1000).optional(),
  max_score: z.number().min(0).max(1000).optional(),
  min_velocity: z.number().min(-1000).max(1000).optional(),
  max_velocity: z.number().min(-1000).max(1000).optional(),
  min_acceleration: z.number().min(-1000).max(1000).optional(),
  max_acceleration: z.number().min(-1000).max(1000).optional(),
  
  // Filters
  sources: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  
  // Notification settings
  notification_frequency: z.enum(['immediate', 'daily', 'hourly']).default('immediate'),
  cooldown_minutes: z.number().min(1).max(1440).default(60),
});

// Alert event schema validation
const AlertEventSchema = z.object({
  id: z.string().uuid().optional(),
  rule_id: z.string().uuid(),
  user_id: z.string(),
  
  // Trend data snapshot
  trend_id: z.string(),
  trend_source: z.string(),
  trend_topic: z.string(),
  trend_title: z.string().optional(),
  trend_url: z.string().url().optional(),
  trend_image_url: z.string().url().optional(),
  trend_score: z.number().optional(),
  trend_velocity: z.number().optional(),
  trend_acceleration: z.number().optional(),
  trend_region: z.string().optional(),
  trend_tags: z.array(z.string()).optional(),
  trend_observed_at: z.date().optional(),
  
  // Alert metadata
  triggered_at: z.date().optional(),
  is_read: z.boolean().default(false),
  read_at: z.date().optional(),
  notification_sent: z.boolean().default(false),
  notification_sent_at: z.date().optional(),
});

// TypeScript interfaces
export interface AlertRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  min_score?: number;
  max_score?: number;
  min_velocity?: number;
  max_velocity?: number;
  min_acceleration?: number;
  max_acceleration?: number;
  sources?: string[];
  regions?: string[];
  keywords?: string[];
  notification_frequency: 'immediate' | 'daily' | 'hourly';
  cooldown_minutes: number;
  created_at: Date;
  updated_at: Date;
}

export interface AlertEvent {
  id: string;
  rule_id: string;
  user_id: string;
  trend_id: string;
  trend_source: string;
  trend_topic: string;
  trend_title?: string;
  trend_url?: string;
  trend_image_url?: string;
  trend_score?: number;
  trend_velocity?: number;
  trend_acceleration?: number;
  trend_region?: string;
  trend_tags?: string[];
  trend_observed_at?: Date;
  triggered_at: Date;
  is_read: boolean;
  read_at?: Date;
  notification_sent: boolean;
  notification_sent_at?: Date;
}

export interface CreateAlertRuleData {
  user_id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  min_score?: number;
  max_score?: number;
  min_velocity?: number;
  max_velocity?: number;
  min_acceleration?: number;
  max_acceleration?: number;
  sources?: string[];
  regions?: string[];
  keywords?: string[];
  notification_frequency?: 'immediate' | 'daily' | 'hourly';
  cooldown_minutes?: number;
}

export interface UpdateAlertRuleData {
  name?: string;
  description?: string;
  is_active?: boolean;
  min_score?: number;
  max_score?: number;
  min_velocity?: number;
  max_velocity?: number;
  min_acceleration?: number;
  max_acceleration?: number;
  sources?: string[];
  regions?: string[];
  keywords?: string[];
  notification_frequency?: 'immediate' | 'daily' | 'hourly';
  cooldown_minutes?: number;
}

export interface PaginatedAlertRules {
  rules: AlertRule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedAlertEvents {
  events: AlertEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Database configuration
const config = envSchema.parse(process.env);

// Create connection pool
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Alerts database class
export class AlertsDB {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  // Create a new alert rule
  async createAlertRule(data: CreateAlertRuleData): Promise<AlertRule> {
    const validatedData = AlertRuleSchema.parse({
      ...data,
      is_active: data.is_active ?? true,
      notification_frequency: data.notification_frequency ?? 'immediate',
      cooldown_minutes: data.cooldown_minutes ?? 60,
    });

    const query = `
      INSERT INTO alert_rules (
        user_id, name, description, is_active,
        min_score, max_score, min_velocity, max_velocity, min_acceleration, max_acceleration,
        sources, regions, keywords, notification_frequency, cooldown_minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      validatedData.user_id,
      validatedData.name,
      validatedData.description,
      validatedData.is_active,
      validatedData.min_score,
      validatedData.max_score,
      validatedData.min_velocity,
      validatedData.max_velocity,
      validatedData.min_acceleration,
      validatedData.max_acceleration,
      validatedData.sources,
      validatedData.regions,
      validatedData.keywords,
      validatedData.notification_frequency,
      validatedData.cooldown_minutes,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToAlertRule(result.rows[0]);
  }

  // Get alert rule by ID
  async getAlertRule(id: string, userId: string): Promise<AlertRule | null> {
    const query = `
      SELECT * FROM alert_rules 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await this.pool.query(query, [id, userId]);
    return result.rows.length > 0 ? this.mapRowToAlertRule(result.rows[0]) : null;
  }

  // Get all alert rules for a user
  async getAlertRules(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedAlertRules> {
    const offset = (page - 1) * limit;
    
    const countQuery = `
      SELECT COUNT(*) FROM alert_rules WHERE user_id = $1
    `;
    
    const rulesQuery = `
      SELECT * FROM alert_rules 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

    const [countResult, rulesResult] = await Promise.all([
      this.pool.query(countQuery, [userId]),
      this.pool.query(rulesQuery, [userId, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return {
      rules: rulesResult.rows.map(row => this.mapRowToAlertRule(row)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Update alert rule
  async updateAlertRule(id: string, userId: string, data: UpdateAlertRuleData): Promise<AlertRule | null> {
    const validatedData = AlertRuleSchema.partial().parse(data);
    
    const setClause = Object.keys(validatedData)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');
    
    const query = `
      UPDATE alert_rules 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const values = [id, userId, ...Object.values(validatedData)];
    const result = await this.pool.query(query, values);
    
    return result.rows.length > 0 ? this.mapRowToAlertRule(result.rows[0]) : null;
  }

  // Delete alert rule
  async deleteAlertRule(id: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM alert_rules 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await this.pool.query(query, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  // Toggle alert rule active status
  async toggleAlertRule(id: string, userId: string): Promise<AlertRule | null> {
    const query = `
      UPDATE alert_rules 
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [id, userId]);
    return result.rows.length > 0 ? this.mapRowToAlertRule(result.rows[0]) : null;
  }

  // Create alert event
  async createAlertEvent(data: Omit<AlertEvent, 'id' | 'triggered_at' | 'is_read' | 'notification_sent'>): Promise<AlertEvent> {
    const validatedData = AlertEventSchema.parse({
      ...data,
      triggered_at: new Date(),
      is_read: false,
      notification_sent: false,
    });

    const query = `
      INSERT INTO alert_events (
        rule_id, user_id, trend_id, trend_source, trend_topic, trend_title,
        trend_url, trend_image_url, trend_score, trend_velocity, trend_acceleration,
        trend_region, trend_tags, trend_observed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (rule_id, trend_id, trend_source) DO NOTHING
      RETURNING *
    `;

    const values = [
      validatedData.rule_id,
      validatedData.user_id,
      validatedData.trend_id,
      validatedData.trend_source,
      validatedData.trend_topic,
      validatedData.trend_title,
      validatedData.trend_url,
      validatedData.trend_image_url,
      validatedData.trend_score,
      validatedData.trend_velocity,
      validatedData.trend_acceleration,
      validatedData.trend_region,
      validatedData.trend_tags,
      validatedData.trend_observed_at,
    ];

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Alert event already exists for this rule and trend');
    }
    
    return this.mapRowToAlertEvent(result.rows[0]);
  }

  // Get alert events for a user
  async getAlertEvents(userId: string, page: number = 1, limit: number = 20, unreadOnly: boolean = false): Promise<PaginatedAlertEvents> {
    const offset = (page - 1) * limit;
    
    const whereClause = unreadOnly ? 'WHERE ae.user_id = $1 AND ae.is_read = false' : 'WHERE ae.user_id = $1';
    const params = unreadOnly ? [userId, limit, offset] : [userId, limit, offset];
    
    const countQuery = `
      SELECT COUNT(*) FROM alert_events ae ${whereClause}
    `;
    
    const eventsQuery = `
      SELECT ae.*, ar.name as rule_name 
      FROM alert_events ae
      LEFT JOIN alert_rules ar ON ae.rule_id = ar.id
      ${whereClause}
      ORDER BY ae.triggered_at DESC 
      LIMIT $${unreadOnly ? 2 : 2} OFFSET $${unreadOnly ? 3 : 3}
    `;

    const [countResult, eventsResult] = await Promise.all([
      this.pool.query(countQuery, unreadOnly ? [userId] : [userId]),
      this.pool.query(eventsQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return {
      events: eventsResult.rows.map(row => this.mapRowToAlertEvent(row)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Mark alert event as read
  async markAlertEventRead(eventId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE alert_events 
      SET is_read = true, read_at = NOW()
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await this.pool.query(query, [eventId, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  // Mark all alert events as read for a user
  async markAllAlertEventsRead(userId: string): Promise<number> {
    const query = `
      UPDATE alert_events 
      SET is_read = true, read_at = NOW()
      WHERE user_id = $1 AND is_read = false
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rowCount;
  }

  // Get unread alert count for a user
  async getUnreadAlertCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) FROM alert_events 
      WHERE user_id = $1 AND is_read = false
    `;
    
    const result = await this.pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  // Get active alert rules for evaluation
  async getActiveAlertRules(): Promise<AlertRule[]> {
    const query = `
      SELECT * FROM alert_rules 
      WHERE is_active = true
      ORDER BY created_at ASC
    `;
    
    const result = await this.pool.query(query);
    return result.rows.map(row => this.mapRowToAlertRule(row));
  }

  // Check if alert was recently triggered for a rule/trend combination
  async checkRecentAlert(ruleId: string, trendId: string, trendSource: string, cooldownMinutes: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) FROM alert_events 
      WHERE rule_id = $1 AND trend_id = $2 AND trend_source = $3 
      AND triggered_at > NOW() - INTERVAL '${cooldownMinutes} minutes'
    `;
    
    const result = await this.pool.query(query, [ruleId, trendId, trendSource]);
    return parseInt(result.rows[0].count) > 0;
  }

  // Helper methods to map database rows to TypeScript interfaces
  private mapRowToAlertRule(row: any): AlertRule {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      is_active: row.is_active,
      min_score: row.min_score,
      max_score: row.max_score,
      min_velocity: row.min_velocity,
      max_velocity: row.max_velocity,
      min_acceleration: row.min_acceleration,
      max_acceleration: row.max_acceleration,
      sources: row.sources,
      regions: row.regions,
      keywords: row.keywords,
      notification_frequency: row.notification_frequency,
      cooldown_minutes: row.cooldown_minutes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  private mapRowToAlertEvent(row: any): AlertEvent {
    return {
      id: row.id,
      rule_id: row.rule_id,
      user_id: row.user_id,
      trend_id: row.trend_id,
      trend_source: row.trend_source,
      trend_topic: row.trend_topic,
      trend_title: row.trend_title,
      trend_url: row.trend_url,
      trend_image_url: row.trend_image_url,
      trend_score: row.trend_score,
      trend_velocity: row.trend_velocity,
      trend_acceleration: row.trend_acceleration,
      trend_region: row.trend_region,
      trend_tags: row.trend_tags,
      trend_observed_at: row.trend_observed_at ? new Date(row.trend_observed_at) : undefined,
      triggered_at: new Date(row.triggered_at),
      is_read: row.is_read,
      read_at: row.read_at ? new Date(row.read_at) : undefined,
      notification_sent: row.notification_sent,
      notification_sent_at: row.notification_sent_at ? new Date(row.notification_sent_at) : undefined,
    };
  }

  // Close the database connection
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export a singleton instance
export const alertsDB = new AlertsDB();
