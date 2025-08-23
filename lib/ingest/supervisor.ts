import { v4 as uuidv4 } from 'uuid';
import { BaseSourceConnector, ConnectorFactory, IngestResult } from './connectors/base';
import { getResilienceHealth, processBatch } from './resilience';
import { getDatabaseHealth, cleanupExpiredData } from './database';

// Import connectors
import './connectors/youtube';
import { YouTubeConnector } from './connectors/youtube';

// Register connectors
ConnectorFactory.register('youtube', YouTubeConnector);

// TTI tracking
interface TTIMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  eventsProcessed: number;
  eventsStored: number;
  errors: number;
  sources: Record<string, {
    duration: number;
    eventsProcessed: number;
    eventsStored: number;
    errors: number;
  }>;
}

export class IngestSupervisor {
  private connectors: Map<string, BaseSourceConnector> = new Map();
  private logger: any;
  private enableTTITracking: boolean;

  constructor(logger?: any) {
    this.logger = logger || console;
    this.enableTTITracking = process.env.INGEST_ENABLE_TTI_TRACKING === 'true';
    this.initializeConnectors();
  }

  private initializeConnectors(): void {
    const availableSources = ConnectorFactory.getAvailableSources();
    
    for (const source of availableSources) {
      const connector = ConnectorFactory.create(source);
      if (connector && connector.isEnabled()) {
        this.connectors.set(source, connector);
        this.logger.info(`Initialized connector for ${source}`);
      } else if (connector) {
        this.logger.warn(`Connector for ${source} is disabled`);
      }
    }

    this.logger.info(`Initialized ${this.connectors.size} connectors: ${Array.from(this.connectors.keys()).join(', ')}`);
  }

  async runIngestion(sources?: string[]): Promise<{
    success: boolean;
    results: Record<string, IngestResult>;
    metrics: TTIMetrics;
    health: Record<string, any>;
  }> {
    const startTime = Date.now();
    const traceId = uuidv4();
    
    this.logger.info(`Starting ingestion run ${traceId}`, {
      traceId,
      sources: sources || 'all',
      connectorCount: this.connectors.size,
    });

    const metrics: TTIMetrics = {
      startTime,
      endTime: 0,
      duration: 0,
      eventsProcessed: 0,
      eventsStored: 0,
      errors: 0,
      sources: {},
    };

    const results: Record<string, IngestResult> = {};
    const targetSources = sources || Array.from(this.connectors.keys());

    try {
      // Process sources in parallel with batching
      const sourceResults = await processBatch(
        targetSources,
        async (source) => {
          const connector = this.connectors.get(source);
          if (!connector) {
            return { source, result: null, error: 'Connector not found' };
          }

          const sourceStartTime = Date.now();
          
          try {
            const result = await connector.ingest();
            const sourceEndTime = Date.now();
            
            metrics.sources[source] = {
              duration: sourceEndTime - sourceStartTime,
              eventsProcessed: result.eventsProcessed,
              eventsStored: result.eventsStored,
              errors: result.errors.length,
            };

            return { source, result, error: null };
          } catch (error) {
            const sourceEndTime = Date.now();
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            metrics.sources[source] = {
              duration: sourceEndTime - sourceStartTime,
              eventsProcessed: 0,
              eventsStored: 0,
              errors: 1,
            };

            return { source, result: null, error: errorMessage };
          }
        },
        3, // Process 3 sources at a time
        1000 // 1 second delay between batches
      );

      // Aggregate results
      for (const { source, result, error } of sourceResults) {
        if (result) {
          results[source] = result;
          metrics.eventsProcessed += result.eventsProcessed;
          metrics.eventsStored += result.eventsStored;
          metrics.errors += result.errors.length;
        } else {
          results[source] = {
            success: false,
            eventsProcessed: 0,
            eventsStored: 0,
            errors: [{ type: 'CONNECTOR_ERROR', message: error || 'Unknown error' }],
          };
          metrics.errors++;
        }
      }

      // Cleanup expired data
      const cleanupResult = await cleanupExpiredData();
      this.logger.info('Cleanup completed', cleanupResult);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Ingestion supervisor error:', errorMessage);
      metrics.errors++;
    }

    // Finalize metrics
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;

    // Track TTI metrics if enabled
    if (this.enableTTITracking) {
      await this.trackTTIMetrics(traceId, metrics);
    }

    // Get health status
    const health = await this.getHealth();

    this.logger.info(`Ingestion run ${traceId} completed`, {
      traceId,
      duration: metrics.duration,
      eventsProcessed: metrics.eventsProcessed,
      eventsStored: metrics.eventsStored,
      errors: metrics.errors,
    });

    return {
      success: metrics.errors === 0,
      results,
      metrics,
      health,
    };
  }

  private async trackTTIMetrics(traceId: string, metrics: TTIMetrics): Promise<void> {
    try {
      // This would integrate with your existing TTI tracking system
      // For now, we'll just log the metrics
      this.logger.info('TTI Metrics', {
        traceId,
        eventType: 'ingestion_complete',
        duration: metrics.duration,
        eventsProcessed: metrics.eventsProcessed,
        eventsStored: metrics.eventsStored,
        errors: metrics.errors,
        source: 'ingestion',
        component: 'supervisor',
      });
    } catch (error) {
      this.logger.error('Failed to track TTI metrics:', error);
    }
  }

  async getHealth(): Promise<Record<string, any>> {
    const health: Record<string, any> = {
      supervisor: {
        connectorCount: this.connectors.size,
        availableSources: Array.from(this.connectors.keys()),
        enableTTITracking: this.enableTTITracking,
      },
      connectors: {},
      resilience: getResilienceHealth(),
    };

    // Get health from each connector
    for (const [source, connector] of Array.from(this.connectors.entries())) {
      try {
        health.connectors[source] = await connector.getHealth();
      } catch (error) {
        health.connectors[source] = {
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Get database health
    try {
      health.database = await getDatabaseHealth();
    } catch (error) {
      health.database = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return health;
  }

  async getConnector(source: string): Promise<BaseSourceConnector | null> {
    return Promise.resolve(this.connectors.get(source) || null);
  }

  async testConnector(source: string): Promise<{
    success: boolean;
    result?: IngestResult;
    error?: string;
  }> {
    const connector = this.connectors.get(source);
    if (!connector) {
      return { success: false, error: 'Connector not found' };
    }

    try {
      const result = await connector.ingest();
      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  async cleanup(): Promise<void> {
    for (const connector of Array.from(this.connectors.values())) {
      try {
        await connector.cleanup();
      } catch (error) {
        this.logger.error(`Cleanup failed for connector:`, error);
      }
    }
  }
}

// Singleton instance
let supervisorInstance: IngestSupervisor | null = null;

export function getIngestSupervisor(logger?: any): IngestSupervisor {
  if (!supervisorInstance) {
    supervisorInstance = new IngestSupervisor(logger);
  }
  return supervisorInstance;
}
