import { ttiDb, TTISessionData, TTIEventData, TTIMetricData } from '../server/tti-db';
import { TTIUtils, TraceContext, UserContext, PerformanceTracker } from './tti-utils';

export interface TTIRecordingOptions {
  traceId?: string;
  sessionId?: string;
  userId?: string;
  route?: string;
  component?: string;
  metadata?: Record<string, any>;
}

export class TTIRecorder {
  private traceId: string;
  private sessionId: string;
  private userId?: string;
  private route?: string;
  private component?: string;
  private metadata: Record<string, any>;
  private performanceTracker: PerformanceTracker;
  private isSessionCreated: boolean = false;

  constructor(options: TTIRecordingOptions = {}) {
    this.traceId = options.traceId || TTIUtils.generateTraceId();
    this.sessionId = options.sessionId || TTIUtils.generateSessionId();
    this.userId = options.userId;
    this.route = options.route;
    this.component = options.component;
    this.metadata = TTIUtils.sanitizeMetadata(options.metadata || {});
    this.performanceTracker = new PerformanceTracker();
  }

  getTraceId(): string {
    return this.traceId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getCorrelationHeaders(): Record<string, string> {
    return TTIUtils.getCorrelationHeaders(this.traceId);
  }

  async createSession(userContext: UserContext): Promise<void> {
    if (this.isSessionCreated) return;

    if (!TTIUtils.shouldSample()) {
      TTIUtils.log('Skipping TTI session creation due to sampling', { traceId: this.traceId });
      return;
    }

    try {
      const sessionData: TTISessionData = {
        traceId: this.traceId,
        sessionId: this.sessionId,
        userId: this.userId,
        ipHash: userContext.ip,
        userAgent: userContext.userAgent,
        referrer: userContext.referrer,
        pageUrl: userContext.pageUrl,
        region: userContext.region,
        deviceType: userContext.deviceType,
        browser: userContext.browser,
        os: userContext.os,
      };

      await ttiDb.createSession(sessionData);
      this.isSessionCreated = true;
      TTIUtils.log('TTI session created', { traceId: this.traceId, sessionId: this.sessionId });
    } catch (error) {
      TTIUtils.error('Failed to create TTI session', error);
    }
  }

  async recordEvent(
    eventType: string,
    eventName: string,
    duration?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.isSessionCreated) return;

    try {
      const eventData: TTIEventData = {
        sessionId: this.sessionId,
        traceId: this.traceId,
        eventType,
        eventName,
        timestamp: new Date(),
        duration,
        metadata: TTIUtils.sanitizeMetadata({ ...this.metadata, ...metadata }),
        source: 'client',
        component: this.component,
        route: this.route,
      };

      await ttiDb.recordEvent(eventData);
      TTIUtils.log('TTI event recorded', { eventType, eventName, traceId: this.traceId });
    } catch (error) {
      TTIUtils.error('Failed to record TTI event', error);
    }
  }

  async recordMetric(
    metricName: string,
    metricValue: number,
    unit?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.isSessionCreated) return;

    try {
      const metricData: TTIMetricData = {
        sessionId: this.sessionId,
        traceId: this.traceId,
        metricName,
        metricValue,
        unit,
        timestamp: new Date(),
        metadata: TTIUtils.sanitizeMetadata({ ...this.metadata, ...metadata }),
        source: 'client',
      };

      await ttiDb.recordMetric(metricData);
      TTIUtils.log('TTI metric recorded', { metricName, metricValue, traceId: this.traceId });
    } catch (error) {
      TTIUtils.error('Failed to record TTI metric', error);
    }
  }

  mark(name: string): void {
    this.performanceTracker.mark(name);
  }

  measure(name: string, startMark?: string): number {
    return this.performanceTracker.measure(name, startMark);
  }

  async recordPerformanceMark(name: string, startMark?: string): Promise<void> {
    const duration = this.measure(name, startMark);
    await this.recordEvent('performance', name, duration, { startMark });
  }

  async recordWebVitals(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Record First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('fcp', entry.startTime, 'ms');
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    }

    // Record Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'largest-contentful-paint') {
            this.recordMetric('lcp', entry.startTime, 'ms');
          }
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // Record Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // Record Time to Interactive (TTI) approximation
    if ('PerformanceObserver' in window) {
      const ttiObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-input') {
            this.recordMetric('tti', entry.startTime, 'ms');
          }
        });
      });
      ttiObserver.observe({ entryTypes: ['first-input'] });
    }
  }

  async recordPageLoad(): Promise<void> {
    if (typeof window === 'undefined') return;

    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      await this.recordMetric('domContentLoaded', navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart, 'ms');
      await this.recordMetric('loadComplete', navigationEntry.loadEventEnd - navigationEntry.loadEventStart, 'ms');
      await this.recordMetric('totalPageLoad', navigationEntry.loadEventEnd - navigationEntry.fetchStart, 'ms');
    }
  }

  async recordApiCall(url: string, method: string, duration: number, status?: number): Promise<void> {
    await this.recordEvent('api_call', `${method} ${url}`, duration, {
      url,
      method,
      status,
    });
  }

  async recordError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.recordEvent('error', error.name, undefined, {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  async recordUserInteraction(action: string, target?: string, duration?: number): Promise<void> {
    await this.recordEvent('user_interaction', action, duration, {
      target,
      component: this.component,
    });
  }

  async recordRouteChange(from: string, to: string, duration?: number): Promise<void> {
    await this.recordEvent('route_change', `${from} -> ${to}`, duration, {
      from,
      to,
    });
  }

  async recordResourceLoad(url: string, resourceType: string, duration: number, size?: number): Promise<void> {
    await this.recordEvent('resource_load', `${resourceType}: ${url}`, duration, {
      url,
      resourceType,
      size,
    });
  }

  getPerformanceData(): Record<string, number> {
    return this.performanceTracker.getAllMarks();
  }

  async flush(): Promise<void> {
    // Record final performance data
    const performanceData = this.getPerformanceData();
    for (const [name, duration] of Object.entries(performanceData)) {
      await this.recordMetric(`performance_${name}`, duration, 'ms');
    }
  }
}

// Global TTI recorder instance
let globalTTIRecorder: TTIRecorder | null = null;

export function getTTIRecorder(options?: TTIRecordingOptions): TTIRecorder {
  if (!globalTTIRecorder) {
    globalTTIRecorder = new TTIRecorder(options);
  }
  return globalTTIRecorder;
}

export function resetTTIRecorder(): void {
  globalTTIRecorder = null;
}

// Server-side TTI recording utilities
export class ServerTTIRecorder {
  private traceId: string;
  private sessionId: string;
  private route?: string;
  private component?: string;
  private metadata: Record<string, any>;
  private startTime: number;

  constructor(options: TTIRecordingOptions = {}) {
    this.traceId = options.traceId || TTIUtils.generateTraceId();
    this.sessionId = options.sessionId || TTIUtils.generateSessionId();
    this.route = options.route;
    this.component = options.component;
    this.metadata = TTIUtils.sanitizeMetadata(options.metadata || {});
    this.startTime = Date.now();
  }

  getTraceId(): string {
    return this.traceId;
  }

  getCorrelationHeaders(): Record<string, string> {
    return TTIUtils.getCorrelationHeaders(this.traceId);
  }

  async recordServerEvent(
    eventType: string,
    eventName: string,
    duration?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!TTIUtils.shouldSample()) return;

    try {
      const eventData: TTIEventData = {
        sessionId: this.sessionId,
        traceId: this.traceId,
        eventType,
        eventName,
        timestamp: new Date(),
        duration,
        metadata: TTIUtils.sanitizeMetadata({ ...this.metadata, ...metadata }),
        source: 'server',
        component: this.component,
        route: this.route,
      };

      await ttiDb.recordEvent(eventData);
      TTIUtils.log('Server TTI event recorded', { eventType, eventName, traceId: this.traceId });
    } catch (error) {
      TTIUtils.error('Failed to record server TTI event', error);
    }
  }

  async recordServerMetric(
    metricName: string,
    metricValue: number,
    unit?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!TTIUtils.shouldSample()) return;

    try {
      const metricData: TTIMetricData = {
        sessionId: this.sessionId,
        traceId: this.traceId,
        metricName,
        metricValue,
        unit,
        timestamp: new Date(),
        metadata: TTIUtils.sanitizeMetadata({ ...this.metadata, ...metadata }),
        source: 'server',
      };

      await ttiDb.recordMetric(metricData);
      TTIUtils.log('Server TTI metric recorded', { metricName, metricValue, traceId: this.traceId });
    } catch (error) {
      TTIUtils.error('Failed to record server TTI metric', error);
    }
  }

  async recordApiResponse(duration: number, status: number, route?: string): Promise<void> {
    await this.recordServerEvent('api_response', `${route || this.route}`, duration, {
      status,
      route: route || this.route,
    });
  }

  async recordDatabaseQuery(query: string, duration: number, rowCount?: number): Promise<void> {
    await this.recordServerEvent('database_query', query.substring(0, 100), duration, {
      query: query.substring(0, 200),
      rowCount,
    });
  }

  async recordCacheHit(key: string, duration: number): Promise<void> {
    await this.recordServerEvent('cache_hit', key.substring(0, 100), duration, {
      key: key.substring(0, 200),
    });
  }

  async recordCacheMiss(key: string, duration: number): Promise<void> {
    await this.recordServerEvent('cache_miss', key.substring(0, 100), duration, {
      key: key.substring(0, 200),
    });
  }

  getDuration(): number {
    return Date.now() - this.startTime;
  }
}
