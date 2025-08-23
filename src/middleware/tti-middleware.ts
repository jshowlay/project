import { NextRequest, NextResponse } from 'next/server';
import { TTIUtils } from '../lib/tti-utils';
import { ServerTTIRecorder } from '../lib/tti-recorder';

export interface TTIMiddlewareOptions {
  enableTracing?: boolean;
  enableMetrics?: boolean;
  enableErrorTracking?: boolean;
  sampleRate?: number;
  excludePaths?: string[];
  includePaths?: string[];
}

export function createTTIMiddleware(options: TTIMiddlewareOptions = {}) {
  const {
    enableTracing = true,
    enableMetrics = true,
    enableErrorTracking = true,
    sampleRate = 0.1,
    excludePaths = [],
    includePaths = [],
  } = options;

  return async function TTI middleware(request: NextRequest): Promise<NextResponse | undefined> {
    const startTime = Date.now();
    const pathname = request.nextUrl?.pathname || '';

    // Check if path should be excluded
    if (excludePaths.some(path => pathname.startsWith(path))) {
      return;
    }

    // Check if path should be included (if includePaths is specified)
    if (includePaths.length > 0 && !includePaths.some(path => pathname.startsWith(path))) {
      return;
    }

    // Check sampling
    if (Math.random() > sampleRate) {
      return;
    }

    // Extract or generate trace ID
    const traceId = extractTraceId(request);
    
    // Create recorder
    const recorder = new ServerTTIRecorder({
      traceId,
      route: pathname,
      component: 'middleware',
    });

    try {
      // Record request start
      if (enableTracing) {
        await recorder.recordServerEvent('middleware_request_start', request.method, undefined, {
          url: request.url,
          method: request.method,
          pathname,
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
        });
      }

      // Process request
      const response = NextResponse.next();

      // Add correlation headers
      if (TTIUtils.getConfig().correlationEnabled) {
        response.headers.set('X-Trace-ID', traceId);
        response.headers.set('X-Correlation-ID', traceId);
        response.headers.set('X-Request-ID', traceId);
      }

      // Record response metrics
      const duration = Date.now() - startTime;
      
      if (enableMetrics) {
        await recorder.recordServerMetric('middleware_processing_time', duration, 'ms', {
          pathname,
          method: request.method,
        });
      }

      if (enableTracing) {
        await recorder.recordServerEvent('middleware_request_complete', request.method, duration, {
          pathname,
          status: response.status,
        });
      }

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (enableErrorTracking) {
        await recorder.recordServerEvent('middleware_error', 'middleware_error', duration, {
          error: error instanceof Error ? error.message : String(error),
          pathname,
          method: request.method,
        });
      }

      if (enableMetrics) {
        await recorder.recordServerMetric('middleware_error_time', duration, 'ms', {
          pathname,
          method: request.method,
        });
      }

      // Re-throw the error
      throw error;
    }
  };
}

export function extractTraceId(request: NextRequest): string {
  // Try to extract trace ID from headers
  const traceId = request.headers.get('X-Trace-ID') || 
                  request.headers.get('X-Correlation-ID') ||
                  request.headers.get('X-Request-ID') ||
                  request.headers.get('traceparent')?.split('-')[1];

  if (traceId && TTIUtils.isValidTraceId(traceId)) {
    return traceId;
  }

  // Generate new trace ID if none found or invalid
  return TTIUtils.generateTraceId();
}

// Default TTI middleware
export const ttiMiddleware = createTTIMiddleware();

// High-frequency TTI middleware (for API routes)
export const ttiAPIMiddleware = createTTIMiddleware({
  sampleRate: 0.05, // Lower sampling for API routes
  includePaths: ['/api/'],
  excludePaths: ['/api/tti/'], // Don't track TTI endpoints to avoid recursion
});

// Low-frequency TTI middleware (for static assets)
export const ttiStaticMiddleware = createTTIMiddleware({
  sampleRate: 0.01, // Very low sampling for static assets
  includePaths: ['/_next/', '/static/', '/images/', '/favicon.ico'],
});

// Custom middleware for specific paths
export function createPathSpecificTTIMiddleware(
  path: string,
  options: TTIMiddlewareOptions = {}
) {
  return createTTIMiddleware({
    ...options,
    includePaths: [path],
  });
}

// Middleware for authentication routes
export const ttiAuthMiddleware = createTTIMiddleware({
  sampleRate: 0.2, // Higher sampling for auth routes
  includePaths: ['/login', '/signup', '/auth', '/logout'],
});

// Middleware for dashboard routes
export const ttiDashboardMiddleware = createTTIMiddleware({
  sampleRate: 0.15, // Higher sampling for dashboard
  includePaths: ['/dashboard', '/admin', '/analytics'],
});

// Utility function to check if request should be traced
export function shouldTraceRequest(request: NextRequest): boolean {
  const pathname = request.nextUrl?.pathname || '';
  
  // Don't trace TTI endpoints to avoid recursion
  if (pathname.startsWith('/api/tti/')) {
    return false;
  }

  // Don't trace health checks
  if (pathname === '/health' || pathname === '/ping') {
    return false;
  }

  // Don't trace static assets by default
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') || 
      pathname.includes('.')) {
    return false;
  }

  return true;
}

// Utility function to get request metadata
export function getRequestMetadata(request: NextRequest): Record<string, any> {
  return {
    url: request.url,
    method: request.method,
    pathname: request.nextUrl?.pathname,
    search: request.nextUrl?.search,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    origin: request.headers.get('origin'),
    accept: request.headers.get('accept'),
    acceptLanguage: request.headers.get('accept-language'),
    acceptEncoding: request.headers.get('accept-encoding'),
    connection: request.headers.get('connection'),
    host: request.headers.get('host'),
    ip: getClientIP(request),
  };
}

// Utility function to extract client IP
export function getClientIP(request: NextRequest): string | null {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         request.headers.get('x-client-ip') ||
         request.ip ||
         null;
}

// Utility function to create response with TTI headers
export function createTTIResponse(
  body: any,
  status: number = 200,
  headers: Record<string, string> = {},
  traceId?: string
): NextResponse {
  const response = NextResponse.json(body, { status });
  
  // Add TTI headers
  if (TTIUtils.getConfig().correlationEnabled) {
    const ttiTraceId = traceId || TTIUtils.generateTraceId();
    response.headers.set('X-Trace-ID', ttiTraceId);
    response.headers.set('X-Correlation-ID', ttiTraceId);
    response.headers.set('X-Request-ID', ttiTraceId);
  }

  // Add custom headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Utility function to create error response with TTI headers
export function createTTIErrorResponse(
  error: Error | string,
  status: number = 500,
  traceId?: string
): NextResponse {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  const response = NextResponse.json(
    { 
      error: errorMessage,
      status,
      timestamp: new Date().toISOString(),
      ...(errorStack && { stack: errorStack }),
    },
    { status }
  );

  // Add TTI headers
  if (TTIUtils.getConfig().correlationEnabled) {
    const ttiTraceId = traceId || TTIUtils.generateTraceId();
    response.headers.set('X-Trace-ID', ttiTraceId);
    response.headers.set('X-Correlation-ID', ttiTraceId);
    response.headers.set('X-Request-ID', ttiTraceId);
  }

  return response;
}
