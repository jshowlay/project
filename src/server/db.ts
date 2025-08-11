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
      ping: async () => 'PONG',
    } as any;
  }
  _redis = new Redis(url);
  return _redis;
}
