import { SavedTrend } from '@/lib/db';

// Base trend interface
export interface Trend {
  id: string;
  title: string;
  score: number;
  sparkData: number[] | SparklineData[];
}

// Sparkline data interface
export interface SparklineData {
  x: number;
  y: number;
}

// Saved trend interface (extends base trend)
export interface SavedTrendWithMetadata extends SavedTrend {
  // Additional metadata for saved trends
  isSaved: boolean;
  savedAtFormatted?: string;
}

// API response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SavedTrendsResponse extends ApiResponse {
  data?: {
    trends: SavedTrendWithMetadata[];
    total: number;
    userId: string;
  };
}

export interface SaveTrendResponse extends ApiResponse {
  data?: {
    trend: SavedTrendWithMetadata;
    isSaved: boolean;
  };
}

export interface CheckSavedResponse extends ApiResponse {
  data?: {
    isSaved: boolean;
    trendId: string;
  };
}

// Save button component props
export interface SaveButtonProps {
  trend: Trend;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
  onSaveChange?: (isSaved: boolean) => void;
  disabled?: boolean;
}

// Save button state
export interface SaveButtonState {
  isSaved: boolean;
  isLoading: boolean;
  error: string | null;
}

// API request interfaces
export interface SaveTrendRequest {
  trend_id: string;
  title: string;
  score: number;
  spark_data: number[];
}

export interface UnsaveTrendRequest {
  trend_id: string;
}

// Saved trends page props
export interface SavedTrendsPageProps {
  initialTrends?: SavedTrendWithMetadata[];
  userId?: string;
}

// Error types
export interface SaveError {
  code: 'NETWORK_ERROR' | 'DATABASE_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: any;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
}

// Pagination interface
export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> extends ApiResponse {
  data?: {
    items: T[];
    pagination: PaginationParams;
  };
}
