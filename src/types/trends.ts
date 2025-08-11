export type SourceId = 'reddit'|'youtube'|'newsapi'|'coingecko'|'alphavantage';
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
}
