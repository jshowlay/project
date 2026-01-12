import { logger, logUtils } from './logger';
import { transaction, upsertTrendItem, refreshMaterializedView } from './db';
import { createDataSources, TrendItem } from './sources';

export interface IngestionResult {
  success: boolean;
  totalItems: number;
  sourcesProcessed: number;
  errors: string[];
  duration: number;
}

export async function runIngestion(): Promise<IngestionResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let totalItems = 0;
  let sourcesProcessed = 0;

  try {
    logger.info('Starting data ingestion process');
    
    // Create data sources
    const sources = createDataSources();
    
    if (sources.length === 0) {
      throw new Error('No data sources are enabled');
    }

    // Process each source
    for (const source of sources) {
      try {
        logger.info(`Processing ${source.constructor.name}`);
        
        // Fetch data from source
        const items = await source.fetchData();
        
        if (items.length === 0) {
          logger.warn(`No items returned from ${source.constructor.name}`);
          continue;
        }

        // Insert/update items in database
        await transaction(async (client) => {
          for (const item of items) {
            await upsertTrendItem(item, client);
          }
        });

        totalItems += items.length;
        sourcesProcessed++;
        
        logUtils.ingestion(
          source.constructor.name,
          items.length,
          Date.now() - startTime,
          true
        );

        logger.info(`Successfully processed ${items.length} items from ${source.constructor.name}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${source.constructor.name}: ${errorMessage}`);
        
        logUtils.ingestion(
          source.constructor.name,
          0,
          Date.now() - startTime,
          false,
          errorMessage
        );
        
        logger.error({
          msg: `Failed to process ${source.constructor.name}`,
          error: errorMessage,
        });
      }
    }

    // Refresh materialized view if we have data
    if (totalItems > 0) {
      try {
        logger.info({ msg: 'Refreshing materialized view' });
        
        // Try CONCURRENTLY first, fallback to regular refresh
        try {
          await refreshMaterializedView();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.toLowerCase().includes('concurrently')) {
            logger.warn({ msg: 'CONCURRENTLY refresh failed, using regular refresh' });
            // Fallback to regular refresh
            const { query } = await import('./db');
            await query('REFRESH MATERIALIZED VIEW mv_trends_hourly');
          } else {
            throw error;
          }
        }
        
        logger.info({ msg: 'Materialized view refreshed successfully' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Materialized view refresh: ${errorMessage}`);
        logger.error({ msg: 'Failed to refresh materialized view', error: errorMessage });
      }
    }

    const duration = Date.now() - startTime;
    
    const result: IngestionResult = {
      success: errors.length === 0,
      totalItems,
      sourcesProcessed,
      errors,
      duration,
    };

    logger.info('Data ingestion completed', {
      success: result.success,
      totalItems: result.totalItems,
      sourcesProcessed: result.sourcesProcessed,
      errors: result.errors.length,
      duration: result.duration,
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error({
      msg: 'Data ingestion failed',
      error: errorMessage,
      duration,
    });
    
    return {
      success: false,
      totalItems,
      sourcesProcessed,
      errors: [errorMessage],
      duration,
    };
  }
}

// Batch processing for large datasets
export async function runBatchIngestion(batchSize: number = 100): Promise<IngestionResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let totalItems = 0;
  let sourcesProcessed = 0;

  try {
    logger.info(`Starting batch data ingestion (batch size: ${batchSize})`);
    
    const sources = createDataSources();
    
    if (sources.length === 0) {
      throw new Error('No data sources are enabled');
    }

    for (const source of sources) {
      try {
        logger.info(`Processing ${source.constructor.name} in batches`);
        
        const items = await source.fetchData();
        
        if (items.length === 0) {
          logger.warn(`No items returned from ${source.constructor.name}`);
          continue;
        }

        // Process items in batches
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          
          await transaction(async (client) => {
            for (const item of batch) {
              await upsertTrendItem(item, client);
            }
          });

          totalItems += batch.length;
          logger.debug(`Processed batch ${Math.floor(i / batchSize) + 1} from ${source.constructor.name} (${batch.length} items)`);
        }

        sourcesProcessed++;
        
        logUtils.ingestion(
          source.constructor.name,
          items.length,
          Date.now() - startTime,
          true
        );

        logger.info(`Successfully processed ${items.length} items from ${source.constructor.name} in batches`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${source.constructor.name}: ${errorMessage}`);
        
        logUtils.ingestion(
          source.constructor.name,
          0,
          Date.now() - startTime,
          false,
          errorMessage
        );
        
        logger.error({
          msg: `Failed to process ${source.constructor.name}`,
          error: errorMessage,
        });
      }
    }

    // Refresh materialized view
    if (totalItems > 0) {
      try {
        logger.info('Refreshing materialized view');
        await refreshMaterializedView();
        logger.info('Materialized view refreshed successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Materialized view refresh: ${errorMessage}`);
        logger.error({
          msg: 'Failed to refresh materialized view',
          error: errorMessage,
        });
      }
    }

    const duration = Date.now() - startTime;
    
    const result: IngestionResult = {
      success: errors.length === 0,
      totalItems,
      sourcesProcessed,
      errors,
      duration,
    };

    logger.info('Batch data ingestion completed', {
      success: result.success,
      totalItems: result.totalItems,
      sourcesProcessed: result.sourcesProcessed,
      errors: result.errors.length,
      duration: result.duration,
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error({
      msg: 'Batch data ingestion failed',
      error: errorMessage,
      duration,
    });
    
    return {
      success: false,
      totalItems,
      sourcesProcessed,
      errors: [errorMessage],
      duration,
    };
  }
}

// Health check for ingestion system
export async function checkIngestionHealth(): Promise<{
  healthy: boolean;
  sources: string[];
  lastRun?: Date;
  errors: string[];
}> {
  try {
    const sources = createDataSources();
    const sourceNames = sources.map(source => source.constructor.name);
    
    // Check if we can connect to database and materialized view exists
    const { query } = await import('./db');
    await query('SELECT 1 FROM mv_trends_hourly LIMIT 1');
    
    return {
      healthy: true,
      sources: sourceNames,
      errors: [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      healthy: false,
      sources: [],
      errors: [errorMessage],
    };
  }
}
