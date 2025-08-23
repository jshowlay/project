import { ttiDb } from '../server/tti-db';
import { TTIUtils } from '../lib/tti-utils';
import { ServerTTIRecorder } from '../lib/tti-recorder';
import { logger } from '../../lib/logger';

export interface IngestionJob {
  id: string;
  source: string;
  data: any;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
}

export class TTIIngestionWorker {
  private isRunning: boolean = false;
  private jobQueue: IngestionJob[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private batchSize: number = 100;
  private processingDelay: number = 1000; // 1 second

  constructor() {
    this.start();
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.processingInterval = setInterval(() => {
      this.processBatch();
    }, this.processingDelay);

    logger.info('TTI ingestion worker started');
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    logger.info('TTI ingestion worker stopped');
  }

  addJob(job: IngestionJob): void {
    this.jobQueue.push(job);
    
    // Sort by priority
    this.jobQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    logger.debug('TTI job added to queue', { jobId: job.id, queueLength: this.jobQueue.length });
  }

  private async processBatch(): Promise<void> {
    if (this.jobQueue.length === 0) return;

    const batch = this.jobQueue.splice(0, this.batchSize);
    const recorder = new ServerTTIRecorder({ component: 'ingestion_worker' });

    try {
      logger.info(`Processing TTI batch of ${batch.length} jobs`);

      const promises = batch.map(job => this.processJob(job, recorder));
      await Promise.allSettled(promises);

      const duration = recorder.getDuration();
      await recorder.recordServerMetric('batch_processing_time', duration, 'ms', {
        batchSize: batch.length,
        successCount: batch.length, // Simplified for now
      });

    } catch (error) {
      logger.error('Error processing TTI batch', error);
      await recorder.recordServerEvent('error', 'batch_processing_failed', undefined, {
        error: error instanceof Error ? error.message : String(error),
        batchSize: batch.length,
      });
    }
  }

  private async processJob(job: IngestionJob, recorder: ServerTTIRecorder): Promise<void> {
    const startTime = Date.now();

    try {
      switch (job.source) {
        case 'web_vitals':
          await this.processWebVitals(job.data);
          break;
        case 'performance_marks':
          await this.processPerformanceMarks(job.data);
          break;
        case 'user_interactions':
          await this.processUserInteractions(job.data);
          break;
        case 'api_calls':
          await this.processApiCalls(job.data);
          break;
        case 'errors':
          await this.processErrors(job.data);
          break;
        case 'resource_loading':
          await this.processResourceLoading(job.data);
          break;
        default:
          logger.warn('Unknown TTI job source', { source: job.source, jobId: job.id });
      }

      const duration = Date.now() - startTime;
      await recorder.recordServerMetric('job_processing_time', duration, 'ms', {
        jobId: job.id,
        source: job.source,
      });

    } catch (error) {
      logger.error('Error processing TTI job', { jobId: job.id, source: job.source, error });
      
      const duration = Date.now() - startTime;
      await recorder.recordServerEvent('error', 'job_processing_failed', duration, {
        jobId: job.id,
        source: job.source,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async processWebVitals(data: any): Promise<void> {
    const { traceId, sessionId, metrics } = data;

    for (const metric of metrics) {
      await ttiDb.recordMetric({
        sessionId,
        traceId,
        metricName: metric.name,
        metricValue: metric.value,
        unit: metric.unit || 'ms',
        timestamp: new Date(metric.timestamp || Date.now()),
        metadata: metric.metadata,
        source: 'ingestion',
      });
    }
  }

  private async processPerformanceMarks(data: any): Promise<void> {
    const { traceId, sessionId, marks } = data;

    for (const mark of marks) {
      await ttiDb.recordEvent({
        sessionId,
        traceId,
        eventType: 'performance_mark',
        eventName: mark.name,
        timestamp: new Date(mark.timestamp || Date.now()),
        duration: mark.duration,
        metadata: mark.metadata,
        source: 'ingestion',
      });
    }
  }

  private async processUserInteractions(data: any): Promise<void> {
    const { traceId, sessionId, interactions } = data;

    for (const interaction of interactions) {
      await ttiDb.recordEvent({
        sessionId,
        traceId,
        eventType: 'user_interaction',
        eventName: interaction.action,
        timestamp: new Date(interaction.timestamp || Date.now()),
        duration: interaction.duration,
        metadata: {
          target: interaction.target,
          component: interaction.component,
          ...interaction.metadata,
        },
        source: 'ingestion',
      });
    }
  }

  private async processApiCalls(data: any): Promise<void> {
    const { traceId, sessionId, calls } = data;

    for (const call of calls) {
      await ttiDb.recordEvent({
        sessionId,
        traceId,
        eventType: 'api_call',
        eventName: `${call.method} ${call.url}`,
        timestamp: new Date(call.timestamp || Date.now()),
        duration: call.duration,
        metadata: {
          url: call.url,
          method: call.method,
          status: call.status,
          ...call.metadata,
        },
        source: 'ingestion',
      });
    }
  }

  private async processErrors(data: any): Promise<void> {
    const { traceId, sessionId, errors } = data;

    for (const error of errors) {
      await ttiDb.recordEvent({
        sessionId,
        traceId,
        eventType: 'error',
        eventName: error.name || 'Unknown Error',
        timestamp: new Date(error.timestamp || Date.now()),
        metadata: {
          message: error.message,
          stack: error.stack,
          ...error.metadata,
        },
        source: 'ingestion',
      });
    }
  }

  private async processResourceLoading(data: any): Promise<void> {
    const { traceId, sessionId, resources } = data;

    for (const resource of resources) {
      await ttiDb.recordEvent({
        sessionId,
        traceId,
        eventType: 'resource_load',
        eventName: `${resource.type}: ${resource.url}`,
        timestamp: new Date(resource.timestamp || Date.now()),
        duration: resource.duration,
        metadata: {
          url: resource.url,
          type: resource.type,
          size: resource.size,
          ...resource.metadata,
        },
        source: 'ingestion',
      });
    }
  }

  // Utility methods for external use
  static async addWebVitalsJob(traceId: string, sessionId: string, metrics: any[]): Promise<void> {
    const worker = getIngestionWorker();
    worker.addJob({
      id: TTIUtils.generateTraceId(),
      source: 'web_vitals',
      data: { traceId, sessionId, metrics },
      timestamp: new Date(),
      priority: 'high',
    });
  }

  static async addPerformanceMarksJob(traceId: string, sessionId: string, marks: any[]): Promise<void> {
    const worker = getIngestionWorker();
    worker.addJob({
      id: TTIUtils.generateTraceId(),
      source: 'performance_marks',
      data: { traceId, sessionId, marks },
      timestamp: new Date(),
      priority: 'medium',
    });
  }

  static async addUserInteractionsJob(traceId: string, sessionId: string, interactions: any[]): Promise<void> {
    const worker = getIngestionWorker();
    worker.addJob({
      id: TTIUtils.generateTraceId(),
      source: 'user_interactions',
      data: { traceId, sessionId, interactions },
      timestamp: new Date(),
      priority: 'medium',
    });
  }

  static async addApiCallsJob(traceId: string, sessionId: string, calls: any[]): Promise<void> {
    const worker = getIngestionWorker();
    worker.addJob({
      id: TTIUtils.generateTraceId(),
      source: 'api_calls',
      data: { traceId, sessionId, calls },
      timestamp: new Date(),
      priority: 'high',
    });
  }

  static async addErrorsJob(traceId: string, sessionId: string, errors: any[]): Promise<void> {
    const worker = getIngestionWorker();
    worker.addJob({
      id: TTIUtils.generateTraceId(),
      source: 'errors',
      data: { traceId, sessionId, errors },
      timestamp: new Date(),
      priority: 'high',
    });
  }

  static async addResourceLoadingJob(traceId: string, sessionId: string, resources: any[]): Promise<void> {
    const worker = getIngestionWorker();
    worker.addJob({
      id: TTIUtils.generateTraceId(),
      source: 'resource_loading',
      data: { traceId, sessionId, resources },
      timestamp: new Date(),
      priority: 'low',
    });
  }
}

// Global ingestion worker instance
let globalIngestionWorker: TTIIngestionWorker | null = null;

export function getIngestionWorker(): TTIIngestionWorker {
  if (!globalIngestionWorker) {
    globalIngestionWorker = new TTIIngestionWorker();
  }
  return globalIngestionWorker;
}

export function stopIngestionWorker(): void {
  if (globalIngestionWorker) {
    globalIngestionWorker.stop();
    globalIngestionWorker = null;
  }
}

// Cleanup on process exit
process.on('SIGTERM', () => {
  stopIngestionWorker();
});

process.on('SIGINT', () => {
  stopIngestionWorker();
});
