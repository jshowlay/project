'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import useSWR from 'swr';
import {
  RefreshCw,
  Settings,
  Play,
  Pause,
  Filter,
  TrendingUp,
  BarChart3,
  Clock,
  Users,
  Zap
} from 'lucide-react';
import TrendRow from './TrendRow';
import DeltaBadge from './DeltaBadge';

interface Trend {
  id: string;
  title: string;
  description: string;
  source: string;
  momentum: number;
  volume: number;
  sentiment: number;
  growth_rate: number;
  engagement_rate: number;
  reach: number;
  mentions: number;
  hashtags: string[];
  related_topics: string[];
  created_at: string;
  updated_at: string;
}

interface TrendsResponse {
  success: boolean;
  data: {
    trends: Trend[];
    metadata: {
      total: number;
      limit: number;
      offset: number;
      minutes: number;
      baseline_hours: number;
      sources: string[];
      sort_by: string;
      sort_order: string;
      timestamp: string;
    };
  };
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const timeRanges = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 }
];

const sortOptions = [
  { label: 'Momentum', value: 'momentum', icon: TrendingUp },
  { label: 'Volume', value: 'volume', icon: BarChart3 },
  { label: 'Growth Rate', value: 'growth_rate', icon: TrendingUp },
  { label: 'Sentiment', value: 'sentiment', icon: Users },
  { label: 'Engagement', value: 'engagement_rate', icon: Zap }
];

const sourceOptions = [
  { label: 'All Sources', value: '' },
  { label: 'Twitter', value: 'twitter' },
  { label: 'Reddit', value: 'reddit' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'LinkedIn', value: 'linkedin' }
];

export default function LiveRadar() {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [sortBy, setSortBy] = useState('momentum');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSource, setSelectedSource] = useState('');
  const [limit, setLimit] = useState(20);
  const [showControls, setShowControls] = useState(false);
  const [previousTrends, setPreviousTrends] = useState<Trend[]>([]);

  // Build API URL
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      minutes: timeRange.toString(),
      baseline_hours: '24',
      limit: limit.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
      debug: 'false'
    });

    if (selectedSource) {
      params.append('sources', selectedSource);
    }

    return `/api/trends?${params.toString()}`;
  }, [timeRange, sortBy, sortOrder, selectedSource, limit]);

  // Fetch data with SWR
  const { data, error, mutate, isLoading } = useSWR<TrendsResponse>(
    apiUrl,
    fetcher,
    {
      refreshInterval: isAutoRefresh ? 15000 : 0, // 15 seconds
      revalidateOnFocus: false,
      revalidateOnReconnect: true
    }
  );

  // Track previous trends for rank changes
  useEffect(() => {
    if (data?.data?.trends) {
      setPreviousTrends(prev => {
        const current = data.data.trends;
        return prev.length > 0 ? prev : current;
      });
    }
  }, [data?.data?.trends]);

  // Manual refresh
  const handleRefresh = () => {
    mutate();
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh);
  };

  // Get rank changes
  const getRankChanges = (currentTrends: Trend[]) => {
    const rankChanges = new Map<string, number>();
    
    currentTrends.forEach((trend, currentIndex) => {
      const previousIndex = previousTrends.findIndex(t => t.id === trend.id);
      if (previousIndex !== -1) {
        const change = previousIndex - currentIndex;
        if (change !== 0) {
          rankChanges.set(trend.id, change);
        }
      }
    });

    return rankChanges;
  };

  // Get new trends
  const getNewTrends = (currentTrends: Trend[]) => {
    const previousIds = new Set(previousTrends.map(t => t.id));
    return currentTrends.filter(trend => !previousIds.has(trend.id));
  };

  const trends = data?.data?.trends || [];
  const rankChanges = getRankChanges(trends);
  const newTrends = getNewTrends(trends);
  const newTrendIds = new Set(newTrends.map(t => t.id));

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-lg mb-4">Failed to load trends</div>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Live Trends</h2>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              isLoading ? 'bg-yellow-400' : 'bg-green-400'
            )} />
            <span className="text-sm text-gray-300">
              {isLoading ? 'Updating...' : 'Live'}
            </span>
          </div>

          {/* Last updated */}
          {data?.data?.metadata?.timestamp && (
            <span className="text-sm text-gray-400">
              Updated: {new Date(data.data.metadata.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <button
            onClick={toggleAutoRefresh}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isAutoRefresh
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
            )}
          >
            {isAutoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            Auto-refresh
          </button>

          {/* Manual refresh */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors"
          >
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          </button>

          {/* Controls toggle */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Order
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortOrder('desc')}
                    className={clsx(
                      'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      sortOrder === 'desc'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    )}
                  >
                    Desc
                  </button>
                  <button
                    onClick={() => setSortOrder('asc')}
                    className={clsx(
                      'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      sortOrder === 'asc'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    )}
                  >
                    Asc
                  </button>
                </div>
              </div>

              {/* Source Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Source
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  {sourceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Limit Slider */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Results Limit: {limit}
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      {data?.data?.metadata && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{data.data.metadata.total}</div>
            <div className="text-sm text-gray-300">Total Trends</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{timeRange}m</div>
            <div className="text-sm text-gray-300">Time Window</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{newTrends.length}</div>
            <div className="text-sm text-gray-300">New Trends</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{rankChanges.size}</div>
            <div className="text-sm text-gray-300">Rank Changes</div>
          </div>
        </div>
      )}

      {/* Trends List */}
      <LayoutGroup>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {isLoading && trends.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
                <div className="text-gray-300">Loading trends...</div>
              </motion.div>
            ) : trends.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="text-gray-300">No trends found</div>
              </motion.div>
            ) : (
              trends.map((trend, index) => (
                <TrendRow
                  key={trend.id}
                  trend={trend}
                  rank={index + 1}
                  previousRank={previousTrends.findIndex(t => t.id === trend.id) + 1}
                  isNew={newTrendIds.has(trend.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
  );
}
