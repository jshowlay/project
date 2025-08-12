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
  if (!url) {
    // Return a mock Redis client for development
    console.warn('REDIS_URL not set, using mock Redis client');
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
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    
    // Handle connection errors gracefully
    _redis.on('error', (err) => {
      console.warn('Redis connection error:', err.message);
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
