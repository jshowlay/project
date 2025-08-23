import { neon } from '@neondatabase/serverless';

// Database connection
const sql = neon(process.env.DATABASE_URL!);

// Type definitions
export interface SavedTrend {
  id: string;
  user_id: string;
  trend_id: string;
  title: string;
  score: number;
  spark_data: number[];
  saved_at: Date;
}

export interface SaveTrendRequest {
  trend_id: string;
  title: string;
  score: number;
  spark_data: number[];
}

// Table creation SQL
const CREATE_SAVED_TRENDS_TABLE = `
  CREATE TABLE IF NOT EXISTS saved_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    trend_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    spark_data INTEGER[] NOT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, trend_id)
  );

  CREATE INDEX IF NOT EXISTS idx_saved_trends_user_id ON saved_trends(user_id);
  CREATE INDEX IF NOT EXISTS idx_saved_trends_trend_id ON saved_trends(trend_id);
  CREATE INDEX IF NOT EXISTS idx_saved_trends_saved_at ON saved_trends(saved_at DESC);
`;

// Initialize database tables
export async function initializeDatabase() {
  try {
    await sql`${CREATE_SAVED_TRENDS_TABLE}`;
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    throw error;
  }
}

// Database operations
export async function getSavedTrends(userId: string): Promise<SavedTrend[]> {
  try {
    const result = await sql`
      SELECT 
        id,
        user_id,
        trend_id,
        title,
        score,
        spark_data,
        saved_at
      FROM saved_trends 
      WHERE user_id = ${userId}
      ORDER BY saved_at DESC
    `;
    
    return result.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      trend_id: row.trend_id,
      title: row.title,
      score: parseFloat(row.score),
      spark_data: row.spark_data,
      saved_at: new Date(row.saved_at)
    }));
  } catch (error) {
    console.error('Failed to get saved trends:', error);
    throw error;
  }
}

export async function saveTrend(userId: string, trendData: SaveTrendRequest): Promise<SavedTrend> {
  try {
    const result = await sql`
      INSERT INTO saved_trends (user_id, trend_id, title, score, spark_data)
      VALUES (${userId}, ${trendData.trend_id}, ${trendData.title}, ${trendData.score}, ${trendData.spark_data})
      ON CONFLICT (user_id, trend_id) 
      DO UPDATE SET 
        title = EXCLUDED.title,
        score = EXCLUDED.score,
        spark_data = EXCLUDED.spark_data,
        saved_at = NOW()
      RETURNING id, user_id, trend_id, title, score, spark_data, saved_at
    `;
    
    const savedTrend = result[0] as any;
    return {
      id: savedTrend.id,
      user_id: savedTrend.user_id,
      trend_id: savedTrend.trend_id,
      title: savedTrend.title,
      score: parseFloat(savedTrend.score),
      spark_data: savedTrend.spark_data,
      saved_at: new Date(savedTrend.saved_at)
    };
  } catch (error) {
    console.error('Failed to save trend:', error);
    throw error;
  }
}

export async function isTrendSaved(userId: string, trendId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM saved_trends 
      WHERE user_id = ${userId} AND trend_id = ${trendId}
    `;
    
    return (result[0] as any).count > 0;
  } catch (error) {
    console.error('Failed to check if trend is saved:', error);
    throw error;
  }
}

export async function unsaveTrend(userId: string, trendId: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM saved_trends 
      WHERE user_id = ${userId} AND trend_id = ${trendId}
      RETURNING id
    `;
    
    return result.length > 0;
  } catch (error) {
    console.error('Failed to unsave trend:', error);
    throw error;
  }
}

export async function getSavedTrendById(userId: string, trendId: string): Promise<SavedTrend | null> {
  try {
    const result = await sql`
      SELECT 
        id,
        user_id,
        trend_id,
        title,
        score,
        spark_data,
        saved_at
      FROM saved_trends 
      WHERE user_id = ${userId} AND trend_id = ${trendId}
    `;
    
    if (result.length === 0) {
      return null;
    }
    
    const savedTrend = result[0] as any;
    return {
      id: savedTrend.id,
      user_id: savedTrend.user_id,
      trend_id: savedTrend.trend_id,
      title: savedTrend.title,
      score: parseFloat(savedTrend.score),
      spark_data: savedTrend.spark_data,
      saved_at: new Date(savedTrend.saved_at)
    };
  } catch (error) {
    console.error('Failed to get saved trend by ID:', error);
    throw error;
  }
}

// Health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
