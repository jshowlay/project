import { TrendItem, SourceId } from '../types/trends';
export type FetchOptions = { regions?: string[]; limit?: number; signal?: AbortSignal };
export interface Adapter {
  SOURCE_ID: SourceId;
  fetchTrends(opts?: FetchOptions): Promise<TrendItem[]>;
}
