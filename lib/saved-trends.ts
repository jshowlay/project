import { Pool } from 'pg';
import { z } from 'zod';

// Environment validation
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
});

const config = envSchema.parse(process.env);

// Create connection pool
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: { rejectUnauthorized: false } // Neon friendly
});

// TypeScript types
export interface SavedTrend {
  id: number;
  user_id: string;
  trend_id: string;
  trend_source: string;
  trend_topic: string;
  trend_title?: string;
  trend_url?: string;
  trend_image_url?: string;
  trend_score: number;
  trend_velocity: number;
  trend_acceleration: number;
  trend_region: string;
  trend_tags: string[];
  trend_observed_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SaveTrendData {
  user_id: string;
  trend_id: string;
  trend_source: string;
  trend_topic: string;
  trend_title?: string;
  trend_url?: string;
  trend_image_url?: string;
  trend_score: number;
  trend_velocity: number;
  trend_acceleration: number;
  trend_region: string;
  trend_tags: string[];
  trend_observed_at: Date;
}

export interface PaginatedSavedTrends {
  trends: SavedTrend[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Database operations
export class SavedTrendsDB {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Save a trend for a user
   */
  async saveTrend(data: SaveTrendData): Promise<SavedTrend> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO saved_trends (
          user_id, trend_id, trend_source, trend_topic, trend_title, 
          trend_url, trend_image_url, trend_score, trend_velocity, 
          trend_acceleration, trend_region, trend_tags, trend_observed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (user_id, trend_id, trend_source) 
        DO UPDATE SET 
          trend_title = EXCLUDED.trend_title,
          trend_url = EXCLUDED.trend_url,
          trend_image_url = EXCLUDED.trend_image_url,
          trend_score = EXCLUDED.trend_score,
          trend_velocity = EXCLUDED.trend_velocity,
          trend_acceleration = EXCLUDED.trend_acceleration,
          trend_region = EXCLUDED.trend_region,
          trend_tags = EXCLUDED.trend_tags,
          trend_observed_at = EXCLUDED.trend_observed_at,
          updated_at = NOW()
        RETURNING *
      `;

      const values = [
        data.user_id,
        data.trend_id,
        data.trend_source,
        data.trend_topic,
        data.trend_title,
        data.trend_url,
        data.trend_image_url,
        data.trend_score,
        data.trend_velocity,
        data.trend_acceleration,
        data.trend_region,
        JSON.stringify(data.trend_tags),
        data.trend_observed_at
      ];

      const result = await client.query(query, values);
      return this.mapRowToSavedTrend(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Remove a saved trend
   */
  async removeSavedTrend(userId: string, trendId: string, trendSource: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = `
        DELETE FROM saved_trends 
        WHERE user_id = $1 AND trend_id = $2 AND trend_source = $3
      `;
      
      const result = await client.query(query, [userId, trendId, trendSource]);
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Check if a trend is saved by a user
   */
  async isTrendSaved(userId: string, trendId: string, trendSource: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM saved_trends 
          WHERE user_id = $1 AND trend_id = $2 AND trend_source = $3
        )
      `;
      
      const result = await client.query(query, [userId, trendId, trendSource]);
      return result.rows[0].exists;
    } finally {
      client.release();
    }
  }

  /**
   * Get saved trend details
   */
  async getSavedTrend(userId: string, trendId: string, trendSource: string): Promise<SavedTrend | null> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM saved_trends 
        WHERE user_id = $1 AND trend_id = $2 AND trend_source = $3
      `;
      
      const result = await client.query(query, [userId, trendId, trendSource]);
      return result.rows.length > 0 ? this.mapRowToSavedTrend(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  /**
   * Get paginated list of saved trends for a user
   */
  async getSavedTrends(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedSavedTrends> {
    const client = await this.pool.connect();
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total FROM saved_trends WHERE user_id = $1
      `;
      const countResult = await client.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const query = `
        SELECT * FROM saved_trends 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      
      const result = await client.query(query, [userId, limit, offset]);
      const trends = result.rows.map(row => this.mapRowToSavedTrend(row));

      return {
        trends,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get saved trends with trend details joined
   */
  async getSavedTrendsWithDetails(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedSavedTrends> {
    // For now, just return saved trends without joining with TrendRecord
    // We can enhance this later once we understand the TrendRecord schema better
    return this.getSavedTrends(userId, page, limit);
  }

  /**
   * Helper method to map database row to SavedTrend object
   */
  private mapRowToSavedTrend(row: any): SavedTrend {
    return {
      id: row.id,
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
      trend_tags: Array.isArray(row.trend_tags) ? row.trend_tags : 
                  (typeof row.trend_tags === 'string' ? JSON.parse(row.trend_tags) : []),
      trend_observed_at: new Date(row.trend_observed_at),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const savedTrendsDB = new SavedTrendsDB();
