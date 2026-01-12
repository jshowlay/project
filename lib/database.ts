import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.string().default('5432'),
  POSTGRES_DB: z.string().default('trenderai'),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default(''),
});

// Trend data schema
const TrendDataSchema = z.object({
  id: z.string().optional(),
  source: z.enum(['youtube', 'reddit', 'nyt', 'google_trends', 'twitter', 'tiktok']),
  title: z.string(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  published_at: z.date(),
  region: z.string().default('global'),
  category: z.string().optional(),
  score: z.number().default(0),
  metadata: z.record(z.any()).optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
});

export type TrendData = z.infer<typeof TrendDataSchema>;

// Database configuration
const config = envSchema.parse(process.env);

// Create connection pool
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database schema
const CREATE_TABLES_SQL = `
  -- Create trends table
  CREATE TABLE IF NOT EXISTS trends (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    region VARCHAR(10) DEFAULT 'global',
    category VARCHAR(50),
    score INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_trends_source ON trends(source);
  CREATE INDEX IF NOT EXISTS idx_trends_published_at ON trends(published_at);
  CREATE INDEX IF NOT EXISTS idx_trends_region ON trends(region);
  CREATE INDEX IF NOT EXISTS idx_trends_category ON trends(category);
  CREATE INDEX IF NOT EXISTS idx_trends_score ON trends(score);
  CREATE INDEX IF NOT EXISTS idx_trends_url ON trends(url) WHERE url IS NOT NULL;

  -- Create unique constraint to prevent duplicates
  CREATE UNIQUE INDEX IF NOT EXISTS idx_trends_unique 
  ON trends(source, title, published_at);

  -- Create updated_at trigger
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  CREATE TRIGGER update_trends_updated_at 
    BEFORE UPDATE ON trends 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
`;

// Database class with type-safe methods
export class Database {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  // Initialize database schema
  async initialize(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query(CREATE_TABLES_SQL);
      client.release();
      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  // Get database connection
  async getConnection(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  // Execute query with type safety
  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  }

  // Insert trend data with upsert functionality
  async upsertTrend(trend: TrendData): Promise<TrendData> {
    const validatedTrend = TrendDataSchema.parse(trend);
    
    // First try to insert, if it fails due to duplicate, update instead
    const insertQuery = `
      INSERT INTO trends (source, title, description, url, published_at, region, category, score, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const updateQuery = `
      UPDATE trends 
      SET description = $3, url = $4, region = $6, category = $7, score = $8, metadata = $9, updated_at = NOW()
      WHERE source = $1 AND title = $2 AND published_at = $5
      RETURNING *
    `;

    const values = [
      validatedTrend.source,
      validatedTrend.title,
      validatedTrend.description,
      validatedTrend.url,
      validatedTrend.published_at,
      validatedTrend.region,
      validatedTrend.category,
      validatedTrend.score,
      validatedTrend.metadata ? JSON.stringify(validatedTrend.metadata) : null,
    ];

    try {
      const result = await this.query<TrendData>(insertQuery, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        const result = await this.query<TrendData>(updateQuery, values);
        return result.rows[0];
      }
      throw error;
    }
  }

  // Insert multiple trends with batch upsert
  async upsertTrends(trends: TrendData[]): Promise<TrendData[]> {
    if (trends.length === 0) return [];

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const results: TrendData[] = [];
      for (const trend of trends) {
        const result = await this.upsertTrend(trend);
        results.push(result);
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get trends with filtering and pagination
  async getTrends(options: {
    source?: string;
    region?: string;
    category?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'score' | 'published_at' | 'created_at';
    order?: 'ASC' | 'DESC';
  } = {}): Promise<TrendData[]> {
    const {
      source,
      region,
      category,
      limit = 50,
      offset = 0,
      orderBy = 'published_at',
      order = 'DESC'
    } = options;

    let query = 'SELECT * FROM trends WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (source) {
      query += ` AND source = $${paramIndex++}`;
      params.push(source);
    }

    if (region) {
      query += ` AND region = $${paramIndex++}`;
      params.push(region);
    }

    if (category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    query += ` ORDER BY ${orderBy} ${order} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await this.query<TrendData>(query, params);
    return result.rows;
  }

  // Get trend statistics
  async getTrendStats(): Promise<{
    total: number;
    bySource: Record<string, number>;
    byRegion: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const totalResult = await this.query('SELECT COUNT(*) as total FROM trends');
    const sourceResult = await this.query(`
      SELECT source, COUNT(*) as count 
      FROM trends 
      GROUP BY source
    `);
    const regionResult = await this.query(`
      SELECT region, COUNT(*) as count 
      FROM trends 
      GROUP BY region
    `);
    const categoryResult = await this.query(`
      SELECT category, COUNT(*) as count 
      FROM trends 
      WHERE category IS NOT NULL
      GROUP BY category
    `);

    return {
      total: parseInt(totalResult.rows[0].total),
      bySource: Object.fromEntries(
        sourceResult.rows.map(row => [row.source, parseInt(row.count)])
      ),
      byRegion: Object.fromEntries(
        regionResult.rows.map(row => [row.region, parseInt(row.count)])
      ),
      byCategory: Object.fromEntries(
        categoryResult.rows.map(row => [row.category, parseInt(row.count)])
      ),
    };
  }

  // Clean old trends (older than specified days)
  async cleanOldTrends(daysOld: number = 30): Promise<number> {
    const query = `
      DELETE FROM trends 
      WHERE published_at < NOW() - INTERVAL '${daysOld} days'
    `;
    const result = await this.query(query);
    return result.rowCount || 0;
  }

  // Close database connection
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const db = new Database();

// TrendData is already exported above (line 30)
