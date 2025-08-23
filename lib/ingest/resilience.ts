import Bottleneck from 'bottleneck';
import { z } from 'zod';

// Environment configuration
const config = {
  batchSize: parseInt(process.env.INGEST_BATCH_SIZE || '50'),
  maxRetries: parseInt(process.env.INGEST_MAX_RETRIES || '3'),
  retryDelayMs: parseInt(process.env.INGEST_RETRY_DELAY_MS || '1000'),
  circuitBreakerThreshold: parseInt(process.env.INGEST_CIRCUIT_BREAKER_THRESHOLD || '5'),
  circuitBreakerTimeoutMs: parseInt(process.env.INGEST_CIRCUIT_BREAKER_TIMEOUT_MS || '30000'),
  defaultRateLimitRps: parseInt(process.env.INGEST_RATE_LIMIT_RPS || '10'),
  httpTimeoutMs: parseInt(process.env.INGEST_HTTP_TIMEOUT_MS || '10000'),
  connectTimeoutMs: parseInt(process.env.INGEST_CONNECT_TIMEOUT_MS || '5000'),
  socketTimeoutMs: parseInt(process.env.INGEST_SOCKET_TIMEOUT_MS || '30000'),
  keepAliveMs: parseInt(process.env.INGEST_KEEP_ALIVE_MS || '30000'),
} as const;

// Circuit Breaker State
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreaker {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  threshold: number;
  timeoutMs: number;
}

// Rate Limiter Registry
const rateLimiters = new Map<string, Bottleneck>();

// Circuit Breaker Registry
const circuitBreakers = new Map<string, CircuitBreaker>();

// Get or create rate limiter for a source
export function getRateLimiter(source: string, rps?: number): Bottleneck {
  const key = `${source}_limiter`;
  if (!rateLimiters.has(key)) {
    const limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 1000 / (rps || config.defaultRateLimitRps),
      reservoir: rps || config.defaultRateLimitRps,
      reservoirRefreshAmount: rps || config.defaultRateLimitRps,
      reservoirRefreshInterval: 1000,
    });
    rateLimiters.set(key, limiter);
  }
  return rateLimiters.get(key)!;
}

// Get or create circuit breaker for a source
export function getCircuitBreaker(source: string): CircuitBreaker {
  const key = `${source}_breaker`;
  if (!circuitBreakers.has(key)) {
    const breaker: CircuitBreaker = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      lastFailureTime: 0,
      threshold: config.circuitBreakerThreshold,
      timeoutMs: config.circuitBreakerTimeoutMs,
    };
    circuitBreakers.set(key, breaker);
  }
  return circuitBreakers.get(key)!;
}

// Circuit breaker logic
export function canExecute(source: string): boolean {
  const breaker = getCircuitBreaker(source);
  const now = Date.now();

  switch (breaker.state) {
    case CircuitState.CLOSED:
      return true;
    case CircuitState.OPEN:
      if (now - breaker.lastFailureTime > breaker.timeoutMs) {
        breaker.state = CircuitState.HALF_OPEN;
        return true;
      }
      return false;
    case CircuitState.HALF_OPEN:
      return true;
    default:
      return false;
  }
}

export function recordSuccess(source: string): void {
  const breaker = getCircuitBreaker(source);
  if (breaker.state === CircuitState.HALF_OPEN) {
    breaker.state = CircuitState.CLOSED;
  }
  breaker.failureCount = 0;
}

export function recordFailure(source: string): void {
  const breaker = getCircuitBreaker(source);
  breaker.failureCount++;
  breaker.lastFailureTime = Date.now();

  if (breaker.failureCount >= breaker.threshold) {
    breaker.state = CircuitState.OPEN;
  } else if (breaker.state === CircuitState.HALF_OPEN) {
    breaker.state = CircuitState.OPEN;
  }
}

// Resilient HTTP client
export class ResilientHttpClient {
  private limiter: Bottleneck;
  private source: string;

  constructor(source: string, rps?: number) {
    this.source = source;
    this.limiter = getRateLimiter(source, rps);
  }

  async request<T>(
    url: string,
    options: RequestInit = {},
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    if (!canExecute(this.source)) {
      throw new Error(`Circuit breaker is OPEN for ${this.source}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.httpTimeoutMs);

    try {
      const response = await this.limiter.schedule(async () => {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'User-Agent': 'TrenderAI/1.0 (https://trenderai.com)',
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      });

      const data = await response.json();
      
      if (schema) {
        const parsed = schema.parse(data);
        recordSuccess(this.source);
        return parsed;
      }

      recordSuccess(this.source);
      return data as T;
    } catch (error) {
      recordFailure(this.source);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(url: string, schema?: z.ZodSchema<T>): Promise<T> {
    return this.request<T>(url, { method: 'GET' }, schema);
  }

  async post<T>(url: string, body: any, schema?: z.ZodSchema<T>): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, schema);
  }
}

// Exponential backoff retry wrapper
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = config.maxRetries,
  baseDelay: number = config.retryDelayMs
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Batch processing with rate limiting
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = config.batchSize,
  delayMs: number = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(item => processor(item))
    );
    
    results.push(
      ...batchResults
        .filter((result): result is PromiseFulfilledResult<R> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value)
    );

    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// Health check for resilience components
export function getResilienceHealth(): Record<string, any> {
  const health: Record<string, any> = {
    rateLimiters: {},
    circuitBreakers: {},
    config,
  };

  // Rate limiter health
  for (const [key, limiter] of rateLimiters.entries()) {
    health.rateLimiters[key] = {
      queued: limiter.queued(),
      running: limiter.running(),
      done: limiter.done(),
    };
  }

  // Circuit breaker health
  for (const [key, breaker] of circuitBreakers.entries()) {
    health.circuitBreakers[key] = {
      state: breaker.state,
      failureCount: breaker.failureCount,
      lastFailureTime: breaker.lastFailureTime,
      threshold: breaker.threshold,
      timeoutMs: breaker.timeoutMs,
    };
  }

  return health;
}
