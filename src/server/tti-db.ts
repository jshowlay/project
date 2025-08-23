import { PrismaClient } from '@prisma/client';
import { logger } from '../../lib/logger';

const prisma = new PrismaClient();

export interface TTISessionData {
  traceId: string;
  sessionId: string;
  userId?: string;
  ipHash?: string;
  userAgent?: string;
  referrer?: string;
  pageUrl: string;
  region?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
}

export interface TTIEventData {
  sessionId: string;
  traceId: string;
  eventType: string;
  eventName: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
  source: 'client' | 'server' | 'ingestion';
  component?: string;
  route?: string;
}

export interface TTIMetricData {
  sessionId: string;
  traceId: string;
  metricName: string;
  metricValue: number;
  unit?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  source: 'client' | 'server' | 'ingestion';
}

export class TTIDatabase {
  private static instance: TTIDatabase;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = prisma;
  }

  public static getInstance(): TTIDatabase {
    if (!TTIDatabase.instance) {
      TTIDatabase.instance = new TTIDatabase();
    }
    return TTIDatabase.instance;
  }

  async createSession(data: TTISessionData): Promise<string> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour TTL

      const session = await this.prisma.tTISession.create({
        data: {
          traceId: data.traceId,
          sessionId: data.sessionId,
          userId: data.userId,
          ipHash: data.ipHash,
          userAgent: data.userAgent,
          referrer: data.referrer,
          pageUrl: data.pageUrl,
          region: data.region,
          deviceType: data.deviceType,
          browser: data.browser,
          os: data.os,
          expiresAt,
        },
      });

      logger.info('TTI session created', { traceId: data.traceId, sessionId: data.sessionId });
      return session.id;
    } catch (error) {
      logger.error('Failed to create TTI session', { error, data });
      throw error;
    }
  }

  async recordEvent(data: TTIEventData): Promise<string> {
    try {
      const event = await this.prisma.tTIEvent.create({
        data: {
          sessionId: data.sessionId,
          traceId: data.traceId,
          eventType: data.eventType,
          eventName: data.eventName,
          timestamp: data.timestamp,
          duration: data.duration,
          metadata: data.metadata,
          source: data.source,
          component: data.component,
          route: data.route,
        },
      });

      logger.debug('TTI event recorded', { 
        traceId: data.traceId, 
        eventType: data.eventType, 
        eventName: data.eventName 
      });
      return event.id;
    } catch (error) {
      logger.error('Failed to record TTI event', { error, data });
      throw error;
    }
  }

  async recordMetric(data: TTIMetricData): Promise<string> {
    try {
      const metric = await this.prisma.tTIMetric.create({
        data: {
          sessionId: data.sessionId,
          traceId: data.traceId,
          metricName: data.metricName,
          metricValue: data.metricValue,
          unit: data.unit,
          timestamp: data.timestamp,
          metadata: data.metadata,
          source: data.source,
        },
      });

      logger.debug('TTI metric recorded', { 
        traceId: data.traceId, 
        metricName: data.metricName, 
        metricValue: data.metricValue 
      });
      return metric.id;
    } catch (error) {
      logger.error('Failed to record TTI metric', { error, data });
      throw error;
    }
  }

  async getSessionByTraceId(traceId: string) {
    try {
      return await this.prisma.tTISession.findUnique({
        where: { traceId },
        include: {
          events: true,
          metrics: true,
        },
      });
    } catch (error) {
      logger.error('Failed to get TTI session', { error, traceId });
      throw error;
    }
  }

  async getSessionMetrics(sessionId: string, metricNames?: string[]) {
    try {
      const where: any = { sessionId };
      if (metricNames && metricNames.length > 0) {
        where.metricName = { in: metricNames };
      }

      return await this.prisma.tTIMetric.findMany({
        where,
        orderBy: { timestamp: 'asc' },
      });
    } catch (error) {
      logger.error('Failed to get session metrics', { error, sessionId });
      throw error;
    }
  }

  async getRoutePerformance(route: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await this.prisma.tTIMetric.groupBy({
        by: ['metricName'],
        where: {
          route,
          timestamp: { gte: startDate },
        },
        _count: { metricValue: true },
        _avg: { metricValue: true },
        _min: { metricValue: true },
        _max: { metricValue: true },
      });
    } catch (error) {
      logger.error('Failed to get route performance', { error, route });
      throw error;
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.prisma.tTISession.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      logger.info('Cleaned up expired TTI sessions', { count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup expired sessions', { error });
      throw error;
    }
  }

  async refreshAggregates(): Promise<void> {
    try {
      await this.prisma.$executeRaw`SELECT refresh_tti_aggregates()`;
      logger.info('TTI aggregates refreshed');
    } catch (error) {
      logger.error('Failed to refresh TTI aggregates', { error });
      throw error;
    }
  }

  async getAggregates(date: Date, metricName?: string) {
    try {
      const where: any = { date };
      if (metricName) {
        where.metricName = metricName;
      }

      return await this.prisma.tTIAggregate.findMany({
        where,
        orderBy: [{ hour: 'asc' }, { metricName: 'asc' }],
      });
    } catch (error) {
      logger.error('Failed to get TTI aggregates', { error, date });
      throw error;
    }
  }
}

export const ttiDb = TTIDatabase.getInstance();
