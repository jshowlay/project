import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'sqlite:///./trender.db',
    },
  },
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

let _redis: Redis | null = null;
export function redis() {
  if (_redis) return _redis;
  const url = process.env.REDIS_URL;
  if (!url || url.includes('localhost:6379')) {
    // Return a mock Redis client for development
    console.warn('REDIS_URL not set or pointing to localhost, using mock Redis client');
    return {
      get: async () => null,
      set: async () => 'OK',
      setex: async () => 'OK',
      ping: async () => 'PONG',
    } as any;
  }
  
  try {
    _redis = new Redis(url, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 1, // Reduce retries to fail faster
      lazyConnect: true,
      connectTimeout: 5000, // 5 second timeout
    });
    
    // Handle connection errors gracefully
    _redis.on('error', (err) => {
      console.warn('Redis connection error:', err.message);
      _redis = null; // Reset on error to allow fallback
    });
    
    return _redis;
  } catch (error) {
    console.warn('Failed to connect to Redis, using mock client:', error);
    return {
      get: async () => null,
      set: async () => 'OK',
      setex: async () => 'OK',
      ping: async () => 'PONG',
    } as any;
  }
}
