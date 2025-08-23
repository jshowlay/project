import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema definitions
const CursorSchema = z.object({
  source: z.string().max(50),
  cursorKey: z.string().max(100),
  cursorValue: z.string(),
  metadata: z.record(z.any()).optional(),
});

const RawEventSchema = z.object({
  source: z.string().max(50),
  externalId: z.string().max(255),
  eventType: z.string().max(50),
  rawData: z.record(z.any()),
});

const DeadLetterSchema = z.object({
  source: z.string().max(50),
  eventType: z.string().max(50),
  errorType: z.string().max(50),
  errorMessage: z.string(),
  rawData: z.record(z.any()).optional(),
  retryCount: z.number().int().min(0).default(0),
  maxRetries: z.number().int().min(1).default(3),
});

// Cursor management
export class CursorManager {
  private source: string;
  private ttlDays: number;

  constructor(source: string, ttlDays: number = 30) {
    this.source = source;
    this.ttlDays = ttlDays;
  }

  async getCursor(cursorKey: string): Promise<string | null> {
    const cursor = await prisma.ingestCursor.findUnique({
      where: {
        source_cursorKey: {
          source: this.source,
          cursorKey,
        },
      },
    });

    if (!cursor || cursor.expiresAt < new Date()) {
      return null;
    }

    return cursor.cursorValue;
  }

  async setCursor(cursorKey: string, cursorValue: string, metadata?: Record<string, any>): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.ttlDays);

    await prisma.ingestCursor.upsert({
      where: {
        source_cursorKey: {
          source: this.source,
          cursorKey,
        },
      },
      update: {
        cursorValue,
        lastUpdated: new Date(),
        expiresAt,
        metadata,
      },
      create: {
        source: this.source,
        cursorKey,
        cursorValue,
        expiresAt,
        metadata,
      },
    });
  }

  async deleteCursor(cursorKey: string): Promise<void> {
    await prisma.ingestCursor.delete({
      where: {
        source_cursorKey: {
          source: this.source,
          cursorKey,
        },
      },
    });
  }

  async listCursors(): Promise<Array<{ cursorKey: string; cursorValue: string; lastUpdated: Date }>> {
    return prisma.ingestCursor.findMany({
      where: {
        source: this.source,
        expiresAt: { gt: new Date() },
      },
      select: {
        cursorKey: true,
        cursorValue: true,
        lastUpdated: true,
      },
      orderBy: { lastUpdated: 'desc' },
    });
  }
}

// Raw event storage
export class RawEventStore {
  private source: string;

  constructor(source: string) {
    this.source = source;
  }

  async storeEvent(
    externalId: string,
    eventType: string,
    rawData: Record<string, any>
  ): Promise<string> {
    const event = await prisma.rawEvent.upsert({
      where: {
        source_externalId: {
          source: this.source,
          externalId,
        },
      },
      update: {
        eventType,
        rawData,
        updatedAt: new Date(),
      },
      create: {
        source: this.source,
        externalId,
        eventType,
        rawData,
      },
    });

    return event.id;
  }

  async markProcessed(eventId: string): Promise<void> {
    await prisma.rawEvent.update({
      where: { id: eventId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  }

  async markError(eventId: string, error: string): Promise<void> {
    await prisma.rawEvent.update({
      where: { id: eventId },
      data: {
        errorCount: { increment: 1 },
        lastError: error,
        updatedAt: new Date(),
      },
    });
  }

  async getUnprocessedEvents(limit: number = 100): Promise<Array<{
    id: string;
    externalId: string;
    eventType: string;
    rawData: Record<string, any>;
    errorCount: number;
  }>> {
    return prisma.rawEvent.findMany({
      where: {
        source: this.source,
        processed: false,
      },
      select: {
        id: true,
        externalId: true,
        eventType: true,
        rawData: true,
        errorCount: true,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async getEventById(eventId: string): Promise<{
    id: string;
    externalId: string;
    eventType: string;
    rawData: Record<string, any>;
    processed: boolean;
    errorCount: number;
    lastError: string | null;
  } | null> {
    return prisma.rawEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        externalId: true,
        eventType: string,
        rawData: true,
        processed: true,
        errorCount: true,
        lastError: true,
      },
    });
  }
}

// Dead letter queue
export class DeadLetterQueue {
  private source: string;
  private ttlDays: number;

  constructor(source: string, ttlDays: number = 7) {
    this.source = source;
    this.ttlDays = ttlDays;
  }

  async addToDeadLetter(
    eventType: string,
    errorType: string,
    errorMessage: string,
    rawData?: Record<string, any>
  ): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.ttlDays);

    const deadLetter = await prisma.ingestDeadLetter.create({
      data: {
        source: this.source,
        eventType,
        errorType,
        errorMessage,
        rawData,
        expiresAt,
      },
    });

    return deadLetter.id;
  }

  async retryDeadLetter(deadLetterId: string): Promise<boolean> {
    const deadLetter = await prisma.ingestDeadLetter.findUnique({
      where: { id: deadLetterId },
    });

    if (!deadLetter) {
      return false;
    }

    if (deadLetter.retryCount >= deadLetter.maxRetries) {
      return false;
    }

    await prisma.ingestDeadLetter.update({
      where: { id: deadLetterId },
      data: {
        retryCount: { increment: 1 },
        nextRetryAt: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes
      },
    });

    return true;
  }

  async getRetryableDeadLetters(): Promise<Array<{
    id: string;
    eventType: string;
    errorType: string;
    errorMessage: string;
    rawData: Record<string, any> | null;
    retryCount: number;
  }>> {
    return prisma.ingestDeadLetter.findMany({
      where: {
        source: this.source,
        retryCount: { lt: 3 },
        nextRetryAt: { lte: new Date() },
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        eventType: true,
        errorType: true,
        errorMessage: true,
        rawData: true,
        retryCount: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteDeadLetter(deadLetterId: string): Promise<void> {
    await prisma.ingestDeadLetter.delete({
      where: { id: deadLetterId },
    });
  }

  async cleanupExpiredDeadLetters(): Promise<number> {
    const result = await prisma.ingestDeadLetter.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }
}

// Database health check
export async function getDatabaseHealth(): Promise<Record<string, any>> {
  const health: Record<string, any> = {};

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    health.connection = 'ok';

    // Get counts
    const [cursorCount, eventCount, deadLetterCount] = await Promise.all([
      prisma.ingestCursor.count(),
      prisma.rawEvent.count(),
      prisma.ingestDeadLetter.count(),
    ]);

    health.counts = {
      cursors: cursorCount,
      rawEvents: eventCount,
      deadLetters: deadLetterCount,
    };

    // Get unprocessed events count
    const unprocessedCount = await prisma.rawEvent.count({
      where: { processed: false },
    });

    health.unprocessedEvents = unprocessedCount;

    // Get expired dead letters count
    const expiredDeadLetters = await prisma.ingestDeadLetter.count({
      where: { expiresAt: { lt: new Date() } },
    });

    health.expiredDeadLetters = expiredDeadLetters;

  } catch (error) {
    health.connection = 'error';
    health.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return health;
}

// Cleanup utilities
export async function cleanupExpiredData(): Promise<{
  cursors: number;
  deadLetters: number;
}> {
  const [cursorResult, deadLetterResult] = await Promise.all([
    prisma.ingestCursor.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
    prisma.ingestDeadLetter.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
  ]);

  return {
    cursors: cursorResult.count,
    deadLetters: deadLetterResult.count,
  };
}

export { prisma };
