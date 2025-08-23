import { NextRequest, NextResponse } from 'next/server';
import { ServerTTIRecorder } from './tti-recorder';
import { TTIUtils } from './tti-utils';

export interface APIHandlerOptions {
  route?: string;
  component?: string;
  enableTracing?: boolean;
  enableMetrics?: boolean;
  enableErrorTracking?: boolean;
}

export type APIHandler = (
  request: NextRequest,
  context?: { params?: any }
) => Promise<NextResponse>;

export function withTTITracking(
  handler: APIHandler,
  options: APIHandlerOptions = {}
): APIHandler {
  return async (request: NextRequest, context?: { params?: any }) => {
    const startTime = Date.now();
    const traceId = extractTraceId(request);
    
    const recorder = new ServerTTIRecorder({
      traceId,
      route: options.route || request.nextUrl?.pathname,
      component: options.component,
    });

    try {
      // Record request start
      if (options.enableTracing !== false) {
        await recorder.recordServerEvent('api_request_start', request.method, undefined, {
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
        });
      }

      // Execute the original handler
      const response = await handler(request, context);

      // Record response metrics
      const duration = Date.now() - startTime;
      
      if (options.enableMetrics !== false) {
        await recorder.recordServerMetric('api_response_time', duration, 'ms', {
          status: response.status,
          method: request.method,
          route: options.route || request.nextUrl?.pathname,
        });
      }

      if (options.enableTracing !== false) {
        await recorder.recordServerEvent('api_request_complete', request.method, duration, {
          status: response.status,
          statusText: response.statusText,
        });
      }

      // Add correlation headers to response
      if (TTIUtils.getConfig().correlationEnabled) {
        const headers = new Headers(response.headers);
        headers.set('X-Trace-ID', traceId);
        headers.set('X-Correlation-ID', traceId);
        
        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (options.enableErrorTracking !== false) {
        await recorder.recordServerEvent('api_request_error', request.method, duration, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          url: request.url,
          method: request.method,
        });
      }

      if (options.enableMetrics !== false) {
        await recorder.recordServerMetric('api_error_time', duration, 'ms', {
          method: request.method,
          route: options.route || request.nextUrl?.pathname,
        });
      }

      // Re-throw the error
      throw error;
    }
  };
}

export function withTTIMiddleware(
  handler: APIHandler,
  options: APIHandlerOptions = {}
): APIHandler {
  return async (request: NextRequest, context?: { params?: any }) => {
    const startTime = Date.now();
    const traceId = extractTraceId(request);
    
    const recorder = new ServerTTIRecorder({
      traceId,
      route: options.route || request.nextUrl?.pathname,
      component: options.component,
    });

    // Add request to TTI context
    const ttiContext = {
      traceId,
      startTime,
      recorder,
      request,
      context,
    };

    // Attach TTI context to request
    (request as any).tti = ttiContext;

    try {
      const response = await handler(request, context);
      
      const duration = Date.now() - startTime;
      
      // Record successful response
      await recorder.recordApiResponse(duration, response.status, options.route);

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record error response
      await recorder.recordServerEvent('api_error', 'handler_error', duration, {
        error: error instanceof Error ? error.message : String(error),
        route: options.route || request.nextUrl?.pathname,
      });

      throw error;
    }
  };
}

export function extractTraceId(request: NextRequest): string {
  // Try to extract trace ID from headers
  const traceId = request.headers.get('X-Trace-ID') || 
                  request.headers.get('X-Correlation-ID') ||
                  request.headers.get('traceparent')?.split('-')[1];

  if (traceId && TTIUtils.isValidTraceId(traceId)) {
    return traceId;
  }

  // Generate new trace ID if none found or invalid
  return TTIUtils.generateTraceId();
}

export function getTTIContext(request: NextRequest): any {
  return (request as any).tti;
}

// Higher-order function for database operations
export function withTTIDatabase<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  options: {
    operationName?: string;
    component?: string;
    enableQueryLogging?: boolean;
  } = {}
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    const recorder = new ServerTTIRecorder({
      component: options.component || 'database',
    });

    try {
      const result = await operation(...args);

      const duration = Date.now() - startTime;
      
      await recorder.recordServerMetric('database_operation_time', duration, 'ms', {
        operation: options.operationName || operation.name,
        success: true,
      });

      if (options.enableQueryLogging) {
        await recorder.recordServerEvent('database_query', options.operationName || operation.name, duration, {
          args: args.map(arg => typeof arg === 'string' ? arg.substring(0, 100) : String(arg).substring(0, 100)),
        });
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      await recorder.recordServerEvent('database_error', options.operationName || operation.name, duration, {
        error: error instanceof Error ? error.message : String(error),
        operation: options.operationName || operation.name,
      });

      throw error;
    }
  };
}

// Higher-order function for external API calls
export function withTTIExternalAPI<T extends any[], R>(
  apiCall: (...args: T) => Promise<R>,
  options: {
    apiName?: string;
    component?: string;
    enableRequestLogging?: boolean;
  } = {}
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    const recorder = new ServerTTIRecorder({
      component: options.component || 'external_api',
    });

    try {
      const result = await apiCall(...args);

      const duration = Date.now() - startTime;
      
      await recorder.recordServerMetric('external_api_time', duration, 'ms', {
        api: options.apiName || apiCall.name,
        success: true,
      });

      if (options.enableRequestLogging) {
        await recorder.recordServerEvent('external_api_call', options.apiName || apiCall.name, duration, {
          args: args.map(arg => typeof arg === 'string' ? arg.substring(0, 100) : String(arg).substring(0, 100)),
        });
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      await recorder.recordServerEvent('external_api_error', options.apiName || apiCall.name, duration, {
        error: error instanceof Error ? error.message : String(error),
        api: options.apiName || apiCall.name,
      });

      throw error;
    }
  };
}

// Utility for creating traced fetch
export function createTracedFetch(baseFetch: typeof fetch = fetch) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const startTime = Date.now();
    const recorder = new ServerTTIRecorder({ component: 'fetch' });
    
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';

    try {
      const response = await baseFetch(input, init);
      
      const duration = Date.now() - startTime;
      
      await recorder.recordServerMetric('fetch_time', duration, 'ms', {
        url: url.substring(0, 200),
        method,
        status: response.status,
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      await recorder.recordServerEvent('fetch_error', `${method} ${url}`, duration, {
        error: error instanceof Error ? error.message : String(error),
        url: url.substring(0, 200),
        method,
      });

      throw error;
    }
  };
}

// Decorator for class methods
export function TTIInstrument(options: APIHandlerOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const recorder = new ServerTTIRecorder({
        component: options.component || target.constructor.name,
      });

      try {
        const result = await method.apply(this, args);
        
        const duration = Date.now() - startTime;
        
        await recorder.recordServerMetric('method_execution_time', duration, 'ms', {
          method: propertyName,
          class: target.constructor.name,
        });

        return result;

      } catch (error) {
        const duration = Date.now() - startTime;
        
        await recorder.recordServerEvent('method_error', propertyName, duration, {
          error: error instanceof Error ? error.message : String(error),
          method: propertyName,
          class: target.constructor.name,
        });

        throw error;
      }
    };

    return descriptor;
  };
}
