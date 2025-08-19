export interface TrendSignals {
  velocity: number;
  acceleration: number;
  convergence: number;
  searchIntent: number;
  creatorIndex: number;
  engagementEfficiency: number;
  geoSpread: number;
}

export interface TrendData {
  id: string;
  title: string;
  source: string;
  region: string;
  score: number;
  velocity: number;
  acceleration: number;
  imageUrl?: string;
  url?: string;
  lastSeenAt: string;
  signals: TrendSignals;
  tags?: string[];
}

export interface LiveTrendsResponse {
  trends: TrendData[];
  total: number;
  lastUpdated: string;
}

export interface StreamMessage {
  type: 'trends' | 'heartbeat' | 'error';
  data?: TrendData[];
  message?: string;
  timestamp: string;
}

export interface FilterOptions {
  query: string;
  sources: string[];
  region: string;
  sinceMins: number;
  minScore: number;
}

export interface TrendCardProps {
  trend: TrendData;
  isNew?: boolean;
}

export interface FilterBarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableSources: string[];
}

export interface LivePageState {
  trends: TrendData[];
  loading: boolean;
  error: string | null;
  lastUpdate: string;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}
