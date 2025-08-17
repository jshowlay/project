export type SourceId = 'reddit'|'youtube'|'newsapi'|'coingecko'|'alphavantage'|'nytimes'|'instagram'|'twitter';
export interface TrendItem {
  id?: string;
  source: SourceId;
  topic: string;
  score: number;          // 0..100
  delta24h?: number|null;
  url?: string|null;
  region?: string|null;   // ISO code when available
  tags?: string[];
  raw?: unknown;          // trimmed source payload
  observedAt: Date;
  language?: string|null;
  imageUrl?: string|null; // URL to image/thumbnail
}
