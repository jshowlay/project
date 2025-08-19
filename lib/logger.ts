import pino from 'pino';

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  base: {
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

// Log levels for different contexts
export const logLevels = {
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
} as const;

// Create child loggers for specific contexts
export function createLogger(context: string) {
  return logger.child({ context });
}

// Utility functions for common logging patterns
export const logUtils = {
  // Log API requests
  apiRequest: (method: string, url: string, duration: number, statusCode: number) => {
    logger.info('API request', {
      method,
      url,
      duration,
      statusCode,
      success: statusCode < 400,
    });
  },

  // Log database operations
  dbOperation: (operation: string, table: string, duration: number, rowCount?: number) => {
    logger.info('Database operation', {
      operation,
      table,
      duration,
      rowCount,
    });
  },

  // Log external API calls
  externalApi: (service: string, endpoint: string, duration: number, success: boolean, error?: string) => {
    logger.info('External API call', {
      service,
      endpoint,
      duration,
      success,
      error,
    });
  },

  // Log ingestion events
  ingestion: (source: string, itemCount: number, duration: number, success: boolean, error?: string) => {
    logger.info('Data ingestion', {
      source,
      itemCount,
      duration,
      success,
      error,
    });
  },

  // Log performance metrics
  performance: (operation: string, duration: number, metadata?: Record<string, any>) => {
    logger.info('Performance metric', {
      operation,
      duration,
      ...metadata,
    });
  },
};

// Error logging with context
export function logError(error: Error, context?: Record<string, any>) {
  logger.error('Error occurred', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
}

// Request logging middleware for Express/Next.js
export function requestLogger(req: any, res: any, next?: any) {
  const startTime = Date.now();
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding: any) {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      contentLength: res.getHeader('content-length'),
    });
    
    originalEnd.call(this, chunk, encoding);
  };

  if (next) next();
}

// Export default logger instance
export default logger;
