import { Adapter, FetchOptions } from './types';
import { TrendItem } from '../types/trends';
import { prisma } from '../server/db';

export const nytimesAdapter: Adapter = {
  SOURCE_ID: 'nytimes',
  
  async fetchTrends(opts?: FetchOptions): Promise<TrendItem[]> {
    const limit = opts?.limit || 50;
    
    // Query recent NYTimes trends from TrendRecord table
    const records = await prisma.trendRecord.findMany({
      where: {
        source: 'nytimes',
        observedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // last 7 days
        }
      },
      orderBy: [
        { score: 'desc' },
        { observedAt: 'desc' }
      ],
      take: limit
    });

    return records.map(record => ({
      id: record.id,
      source: 'nytimes' as const,
      topic: record.topic,
      score: record.score,
      delta24h: record.delta24h,
      url: record.url,
      region: record.region,
      tags: record.tags || [],
      raw: record.raw,
      observedAt: record.observedAt,
      language: record.language
    }));
  }
};
