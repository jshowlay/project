import { z } from 'zod';
import { ResilientHttpClient, withRetry } from '../resilience';
import { CursorManager, RawEventStore, DeadLetterQueue } from '../database';

// Common event types
export enum EventType {
  POST = 'post',
  COMMENT = 'comment',
  VIDEO = 'video',
  ARTICLE = 'article',
  TREND = 'trend',
  SEARCH = 'search',
}

// Base event schema
export const BaseEventSchema = z.object({
  id: z.string(),
  source: z.string(),
  eventType: z.nativeEnum(EventType),
  title: z.string().optional(),
  content: z.string().optional(),
  url: z.string().url().optional(),
  author: z.string().optional(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

// Ingest result
export interface IngestResult {
  success: boolean;
  eventsProcessed: number;
  eventsStored: number;
  errors: Array<{
    type: string;
    message: string;
    eventId?: string;
  }>;
  cursor?: string;
  metadata?: Record<string, any>;
}

// Source connector interface
export abstract class BaseSourceConnector {
  protected source: string;
  protected httpClient: ResilientHttpClient;
  protected cursorManager: CursorManager;
  protected eventStore: RawEventStore;
  protected deadLetterQueue: DeadLetterQueue;
  protected logger: any;

  constructor(
    source: string,
    rateLimitRps?: number,
    logger?: any
  ) {
    this.source = source;
    this.httpClient = new ResilientHttpClient(source, rateLimitRps);
    this.cursorManager = new CursorManager(source);
    this.eventStore = new RawEventStore(source);
    this.deadLetterQueue = new DeadLetterQueue(source);
    this.logger = logger || console;
  }

  // Abstract methods that must be implemented by subclasses
  abstract getSourceName(): string;
  abstract isEnabled(): boolean;
  abstract ingest(cursor?: string): Promise<IngestResult>;

  // Common methods with default implementations
  async getCursor(cursorKey: string = 'default'): Promise<string | null> {
    return this.cursorManager.getCursor(cursorKey);
  }

  async setCursor(cursorKey: string = 'default', cursorValue: string, metadata?: Record<string, any>): Promise<void> {
    await this.cursorManager.setCursor(cursorKey, cursorValue, metadata);
  }

  async storeEvent(
    externalId: string,
    eventType: EventType,
    rawData: Record<string, any>
  ): Promise<string> {
    return this.eventStore.storeEvent(externalId, eventType, rawData);
  }

  async markEventProcessed(eventId: string): Promise<void> {
    await this.eventStore.markProcessed(eventId);
  }

  async markEventError(eventId: string, error: string): Promise<void> {
    await this.eventStore.markError(eventId, error);
  }

  async addToDeadLetter(
    eventType: EventType,
    errorType: string,
    errorMessage: string,
    rawData?: Record<string, any>
  ): Promise<string> {
    return this.deadLetterQueue.addToDeadLetter(eventType, errorType, errorMessage, rawData);
  }

  // Utility methods
  protected async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T | null> {
    try {
      return await withRetry(operation);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error in ${context}:`, errorMessage);
      
      await this.addToDeadLetter(
        EventType.POST, // Default event type
        'API_ERROR',
        `${context}: ${errorMessage}`
      );
      
      return null;
    }
  }

  protected validateEvent(event: any): event is BaseEvent {
    try {
      BaseEventSchema.parse(event);
      return true;
    } catch (error) {
      this.logger.error('Event validation failed:', error);
      return false;
    }
  }

  protected createEvent(
    id: string,
    eventType: EventType,
    data: Partial<BaseEvent>
  ): BaseEvent {
    return {
      id,
      source: this.source,
      eventType,
      timestamp: new Date(),
      ...data,
    };
  }

  // Health check
  async getHealth(): Promise<Record<string, any>> {
    const health: Record<string, any> = {
      source: this.source,
      enabled: this.isEnabled(),
      cursorCount: (await this.cursorManager.listCursors()).length,
      unprocessedEvents: (await this.eventStore.getUnprocessedEvents()).length,
      retryableDeadLetters: (await this.deadLetterQueue.getRetryableDeadLetters()).length,
    };

    return health;
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // This can be overridden by subclasses for source-specific cleanup
  }
}

// Factory for creating connectors
export class ConnectorFactory {
  private static connectors = new Map<string, typeof BaseSourceConnector>();

  static register(source: string, connectorClass: typeof BaseSourceConnector): void {
    this.connectors.set(source, connectorClass);
  }

  static create(source: string, ...args: any[]): BaseSourceConnector | null {
    const ConnectorClass = this.connectors.get(source);
    if (!ConnectorClass) {
      return null;
    }

    return new ConnectorClass(source, ...args);
  }

  static getAvailableSources(): string[] {
    return Array.from(this.connectors.keys());
  }
}

// Common utilities
export function sanitizeString(str: string, maxLength: number = 255): string {
  return str
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, maxLength);
}

export function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

export function calculateScore(
  likes: number = 0,
  comments: number = 0,
  shares: number = 0,
  views: number = 0
): number {
  // Simple scoring algorithm - can be customized per source
  const engagement = (likes + comments * 2 + shares * 3) / Math.max(views, 1);
  const baseScore = Math.log10(views + 1) * 10;
  return Math.min(100, Math.max(0, baseScore + engagement * 100));
}

export function parseTimestamp(timestamp: string | number | Date): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (typeof timestamp === 'number') {
    // Assume milliseconds if > 1000000000000, seconds otherwise
    const ms = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
    return new Date(ms);
  }
  
  return new Date(timestamp);
}
