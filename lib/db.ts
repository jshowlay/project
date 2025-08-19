import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from './logger';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_SIZE || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
});

// Pool event listeners for monitoring
pool.on('connect', (client: PoolClient) => {
  logger.info({
    msg: 'New database connection established',
  });
});

pool.on('error', (err: Error, client: PoolClient) => {
  logger.error({
    msg: 'Unexpected error on idle client',
    error: err.message,
  });
});

pool.on('acquire', (client: PoolClient) => {
  logger.debug({
    msg: 'Client acquired from pool',
  });
});

pool.on('release', (client: PoolClient) => {
  logger.debug({
    msg: 'Client released back to pool',
  });
});

// Query helper with performance monitoring
export async function query<T = any>(
  text: string, 
  params?: any[], 
  client?: PoolClient
): Promise<QueryResult<T>> {
  const startTime = Date.now();
  const queryId = Math.random().toString(36).substring(7);
  
  try {
    logger.debug({
      msg: 'Executing database query',
      queryId, 
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      params 
    });
    
    const result = client ? await client.query(text, params) : await pool.query(text, params);
    
    const duration = Date.now() - startTime;
    logger.debug({
      msg: 'Database query completed',
      queryId, 
      duration, 
      rowCount: result.rowCount 
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({
      msg: 'Database query failed',
      queryId, 
      duration, 
      error: error instanceof Error ? error.message : String(error),
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      params 
    });
    throw error;
  }
}

// Get a client from the pool for transactions
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

// Execute a transaction
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Upsert trend item with conflict resolution
export async function upsertTrendItem(
  item: {
    source: string;
    external_id: string;
    title: string;
    topic?: string;
    url?: string;
    score?: number;
    upvotes?: number;
    downvotes?: number;
    comments?: number;
    views?: number;
  },
  client?: PoolClient
): Promise<void> {
  const text = `
    INSERT INTO trend_items (
      source, external_id, title, topic, url, score, upvotes, downvotes, comments, views, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    ON CONFLICT (source, external_id) 
    DO UPDATE SET 
      title = EXCLUDED.title,
      topic = EXCLUDED.topic,
      url = EXCLUDED.url,
      score = EXCLUDED.score,
      upvotes = EXCLUDED.upvotes,
      downvotes = EXCLUDED.downvotes,
      comments = EXCLUDED.comments,
      views = EXCLUDED.views,
      updated_at = NOW()
  `;
  
  const params = [
    item.source,
    item.external_id,
    item.title,
    item.topic,
    item.url,
    item.score || 0,
    item.upvotes || 0,
    item.downvotes || 0,
    item.comments || 0,
    item.views || 0
  ];
  
  await query(text, params, client);
}

// Get trending items from materialized view
export async function getTrendingItems(
  options: {
    source?: string;
    limit?: number;
    minTrendScore?: number;
    minVelocity?: number;
  } = {}
): Promise<any[]> {
  const { source, limit = 50, minTrendScore = 0, minVelocity = 0 } = options;
  
  let text = `
    SELECT 
      source,
      external_id,
      title,
      topic,
      url,
      score,
      upvotes,
      downvotes,
      comments,
      views,
      trend_score,
      velocity,
      acceleration,
      created_at,
      updated_at
    FROM mv_trends_hourly
    WHERE trend_score >= $1 AND velocity >= $2
  `;
  
  const params: any[] = [minTrendScore, minVelocity];
  
  if (source) {
    text += ' AND source = $3';
    params.push(source);
  }
  
  text += ' ORDER BY trend_score DESC, velocity DESC LIMIT $' + (params.length + 1);
  params.push(limit);
  
  try {
    const result = await query(text, params);
    return result.rows;
  } catch (error) {
    logger.warn({
      msg: 'Failed to get trending items, returning empty array',
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

// Get available sources
export async function getAvailableSources(): Promise<string[]> {
  try {
    const result = await query('SELECT DISTINCT source FROM trend_items ORDER BY source');
    return result.rows.map(row => row.source);
  } catch (error) {
    logger.warn({
      msg: 'Failed to get available sources, returning empty array',
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

// Get trend statistics
export async function getTrendStats(): Promise<{
  totalItems: number;
  totalSources: number;
  lastUpdated: Date;
  topTrending: any[];
}> {
  try {
    const [itemsResult, sourcesResult, topResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM trend_items'),
      query('SELECT COUNT(DISTINCT source) as count FROM trend_items'),
      query(`
        SELECT source, external_id, title, trend_score, velocity 
        FROM mv_trends_hourly 
        ORDER BY trend_score DESC 
        LIMIT 5
      `)
    ]);
    
    return {
      totalItems: parseInt(itemsResult.rows[0].count),
      totalSources: parseInt(sourcesResult.rows[0].count),
      lastUpdated: new Date(),
      topTrending: topResult.rows
    };
  } catch (error) {
    logger.warn({
      msg: 'Failed to get trend stats, returning default values',
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      totalItems: 0,
      totalSources: 0,
      lastUpdated: new Date(),
      topTrending: []
    };
  }
}

// Refresh materialized view
export async function refreshMaterializedView(): Promise<void> {
  await query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trends_hourly');
}

// Close the pool (call this when shutting down the application)
export async function closePool(): Promise<void> {
  await pool.end();
}

// Export the pool for direct access if needed
export { pool };
