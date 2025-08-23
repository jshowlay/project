import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

export interface TTIConfig {
  enabled: boolean;
  sampleRate: number;
  maxTraceAgeHours: number;
  anonymizeIps: boolean;
  storageTtlDays: number;
  debugMode: boolean;
  correlationEnabled: boolean;
}

export interface TraceContext {
  traceId: string;
  sessionId: string;
  userId?: string;
  timestamp: Date;
}

export interface UserContext {
  ip?: string;
  userAgent?: string;
  referrer?: string;
  pageUrl: string;
  region?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
}

export class TTIUtils {
  private static config: TTIConfig = {
    enabled: process.env.TTI_ENABLED === 'true',
    sampleRate: parseFloat(process.env.TTI_SAMPLE_RATE || '0.1'),
    maxTraceAgeHours: parseInt(process.env.TTI_MAX_TRACE_AGE_HOURS || '24'),
    anonymizeIps: process.env.TTI_ANONYMIZE_IPS === 'true',
    storageTtlDays: parseInt(process.env.TTI_STORAGE_TTL_DAYS || '30'),
    debugMode: process.env.TTI_DEBUG_MODE === 'true',
    correlationEnabled: process.env.TTI_CORRELATION_ENABLED === 'true',
  };

  static getConfig(): TTIConfig {
    return { ...this.config };
  }

  static updateConfig(newConfig: Partial<TTIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  static shouldSample(): boolean {
    if (!this.config.enabled) return false;
    return Math.random() < this.config.sampleRate;
  }

  static generateTraceId(): string {
    return uuidv4();
  }

  static generateSessionId(): string {
    return uuidv4();
  }

  static hashIp(ip: string): string {
    if (!this.config.anonymizeIps) return ip;
    return CryptoJS.SHA256(ip).toString();
  }

  static parseUserAgent(userAgent: string): { browser: string; os: string; deviceType: string } {
    const ua = userAgent.toLowerCase();
    
    let browser = 'unknown';
    let os = 'unknown';
    let deviceType = 'desktop';

    // Browser detection
    if (ua.includes('chrome')) browser = 'chrome';
    else if (ua.includes('firefox')) browser = 'firefox';
    else if (ua.includes('safari')) browser = 'safari';
    else if (ua.includes('edge')) browser = 'edge';
    else if (ua.includes('opera')) browser = 'opera';

    // OS detection
    if (ua.includes('windows')) os = 'windows';
    else if (ua.includes('mac os')) os = 'macos';
    else if (ua.includes('linux')) os = 'linux';
    else if (ua.includes('android')) os = 'android';
    else if (ua.includes('ios')) os = 'ios';

    // Device type detection
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
      deviceType = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'tablet';
    }

    return { browser, os, deviceType };
  }

  static extractRegionFromIp(ip: string): string {
    // Simple region extraction - in production, use a proper IP geolocation service
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return 'local';
    }
    return 'unknown';
  }

  static createTraceContext(userId?: string): TraceContext {
    return {
      traceId: this.generateTraceId(),
      sessionId: this.generateSessionId(),
      userId,
      timestamp: new Date(),
    };
  }

  static parseUserContext(
    ip?: string,
    userAgent?: string,
    referrer?: string,
    pageUrl?: string
  ): UserContext {
    const parsed = userAgent ? this.parseUserAgent(userAgent) : { browser: 'unknown', os: 'unknown', deviceType: 'desktop' };
    
    return {
      ip: ip ? this.hashIp(ip) : undefined,
      userAgent,
      referrer,
      pageUrl: pageUrl || '',
      region: ip ? this.extractRegionFromIp(ip) : undefined,
      deviceType: parsed.deviceType,
      browser: parsed.browser,
      os: parsed.os,
    };
  }

  static isValidTraceId(traceId: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(traceId);
  }

  static isValidSessionId(sessionId: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(sessionId);
  }

  static calculateDuration(startTime: number, endTime?: number): number {
    const end = endTime || performance.now();
    return Math.round(end - startTime);
  }

  static formatDuration(duration: number): string {
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  }

  static isExpired(timestamp: Date, maxAgeHours: number = 24): boolean {
    const now = new Date();
    const maxAge = new Date(timestamp.getTime() + maxAgeHours * 60 * 60 * 1000);
    return now > maxAge;
  }

  static sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      // Remove sensitive fields
      if (['password', 'token', 'key', 'secret', 'auth'].some(sensitive => 
        key.toLowerCase().includes(sensitive)
      )) {
        continue;
      }
      
      // Limit string lengths
      if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '...';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  static getCorrelationHeaders(traceId: string): Record<string, string> {
    if (!this.config.correlationEnabled) return {};
    
    return {
      'X-Trace-ID': traceId,
      'X-Correlation-ID': traceId,
    };
  }

  static log(message: string, data?: Record<string, any>): void {
    if (this.config.debugMode) {
      console.log(`[TTI] ${message}`, data || '');
    }
  }

  static error(message: string, error?: any): void {
    if (this.config.debugMode) {
      console.error(`[TTI] ${message}`, error || '');
    }
  }
}

// Performance measurement utilities
export class PerformanceTracker {
  private startTime: number;
  private marks: Map<string, number> = new Map();

  constructor() {
    this.startTime = performance.now();
  }

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark?: string): number {
    const endTime = performance.now();
    const startTime = startMark ? this.marks.get(startMark) || this.startTime : this.startTime;
    return Math.round(endTime - startTime);
  }

  getDuration(): number {
    return this.measure('total');
  }

  getAllMarks(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name, time] of this.marks) {
      result[name] = Math.round(time - this.startTime);
    }
    return result;
  }
}
