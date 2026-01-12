'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Heart, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import ScorePill from '@/components/trends/ScorePill';
import Sparkline from '@/components/trends/Sparkline';
import { SavedTrendWithMetadata, ApiResponse } from '@/types/trends';

interface SavedTrendsData {
  trends: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SavedTrendsClient() {
  const [data, setData] = useState<SavedTrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch saved trends
  const fetchSavedTrends = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetch('/api/saved');
      const result: ApiResponse<SavedTrendsData> = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch saved trends');
      }
    } catch (err) {
      console.error('Error fetching saved trends:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchSavedTrends();
  }, []);

  // Handle unsave trend
  const handleUnsave = async (trendId: string) => {
    try {
      const response = await fetch(`/api/saved/${trendId}`, {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        // Remove from local state
        setData(prev => prev ? {
          ...prev,
          trends: prev.trends.filter(trend => trend.trend_id !== trendId),
          total: prev.total - 1
        } : null);
      } else {
        throw new Error(result.error || 'Failed to unsave trend');
      }
    } catch (err) {
      console.error('Error unsaving trend:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsave trend');
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchSavedTrends(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your saved trends...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.trends.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-lg p-8 max-w-md mx-auto shadow-sm">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No saved trends yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start saving trends you&apos;re interested in to see them here.
          </p>
          <Button onClick={() => window.location.href = '/demo/trend-modal'}>
            Explore Trends
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{data.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(data.trends.reduce((sum, trend) => sum + trend.score, 0) / data.trends.length)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Page {data.page} of {data.totalPages}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {data.limit} per page
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Your Saved Trends
        </h2>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.trends.map((trend) => (
          <Card key={trend.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {trend.trend_title || trend.trend_topic}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(trend.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <ScorePill score={trend.trend_score} size="sm" />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Trend Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Source:</span>
                  <Badge variant="outline">{trend.trend_source}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Region:</span>
                  <span className="font-medium">{trend.trend_region}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Score:</span>
                  <span className="font-medium">{trend.trend_score.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2 border-t">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnsave(trend.trend_id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove from saved</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {trend.trend_tags?.length || 0} tags
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
