import { Adapter } from './types';
import { TrendItem } from '../types/trends';
import { fetchDefaultHashtagSet, IgTrendsItem } from './instagram';

export const instagramAdapter: Adapter = {
  SOURCE_ID: 'instagram',
  
  async fetchTrends() {
    try {
      const items = await fetchDefaultHashtagSet();
      
      // Convert IgTrendsItem to TrendItem format
      const trendItems: TrendItem[] = items.map((item: IgTrendsItem) => ({
        id: item.meta?.id || `ig-${Date.now()}-${Math.random()}`,
        source: 'instagram' as const,
        topic: item.topic,
        score: item.score,
        delta24h: null, // Instagram doesn't provide 24h delta
        url: item.url,
        region: item.region,
        tags: item.tags,
        raw: item.meta || {},
        observedAt: item.observedAt,
        language: 'en', // Instagram posts are typically in English
        imageUrl: item.imageUrl
      }));
      
      return trendItems;
    } catch (error) {
      console.error('Instagram adapter error:', error);
      return [];
    }
  }
};


