'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Filter, Search } from 'lucide-react';

interface TrendItem {
  source: string;
  external_id: string;
  title: string;
  topic?: string;
  url?: string;
  score: number;
  upvotes?: number;
  downvotes?: number;
  comments?: number;
  views?: number;
  trend_score: number;
  velocity: number;
  acceleration: number;
  created_at: string;
  updated_at: string;
}

interface TrendsResponse {
  success: boolean;
  data: {
    items: TrendItem[];
    total: number;
    stats?: {
      totalItems: number;
      totalSources: number;
      lastUpdated: Date;
      topTrending: any[];
    };
    availableSources?: string[];
  };
  meta: {
    source: string;
    limit: number;
    minTrendScore: number;
    minVelocity: number;
    duration: number;
  };
  timestamp: string;
}

export default function TrendsPage() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [minTrendScore, setMinTrendScore] = useState(0);
  const [minVelocity, setMinVelocity] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        limit: '50',
        minTrendScore: minTrendScore.toString(),
        minVelocity: minVelocity.toString(),
        stats: 'true',
      });
      
      if (selectedSource !== 'all') {
        params.append('source', selectedSource);
      }

      const response = await fetch(`/api/trends?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching trends:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [autoRefresh, selectedSource, minTrendScore, minVelocity]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!data?.data.items) return [];
    
    return data.data.items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.topic?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  // Get available sources
  const availableSources = useMemo(() => {
    if (!data?.data.availableSources) return ['all'];
    return ['all', ...data.data.availableSources];
  }, [data]);

  // Format number with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get trend indicator
  const getTrendIndicator = (trendScore: number, velocity: number) => {
    if (trendScore > 50 && velocity > 10) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (trendScore < -20) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    } else {
      return <Activity className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading trending data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Data</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Trending Topics</h1>
          <p className="text-gray-400">
            Real-time trending data from multiple sources
            {data && (
              <span className="ml-2 text-sm">
                • Last updated: {new Date(data.timestamp).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Source</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                {availableSources.map(source => (
                  <option key={source} value={source}>
                    {source === 'all' ? 'All Sources' : source.charAt(0).toUpperCase() + source.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Trend Score */}
            <div>
              <label className="block text-sm font-medium mb-2">Min Trend Score</label>
              <input
                type="number"
                value={minTrendScore}
                onChange={(e) => setMinTrendScore(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="0"
              />
            </div>

            {/* Min Velocity */}
            <div>
              <label className="block text-sm font-medium mb-2">Min Velocity</label>
              <input
                type="number"
                value={minVelocity}
                onChange={(e) => setMinVelocity(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="0"
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-white"
                  placeholder="Search titles..."
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2"
                />
                Auto-refresh
              </label>
            </div>

            <div className="text-sm text-gray-400">
              {filteredItems.length} items • {data?.meta.duration}ms
            </div>
          </div>
        </div>

        {/* Stats */}
        {data?.data.stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Items</p>
                  <p className="text-2xl font-bold">{formatNumber(data.data.stats.totalItems)}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Sources</p>
                  <p className="text-2xl font-bold">{data.data.stats.totalSources}</p>
                </div>
                <Filter className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Showing</p>
                  <p className="text-2xl font-bold">{filteredItems.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Last Updated</p>
                  <p className="text-lg font-bold">
                    {new Date(data.data.stats.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
                <RefreshCw className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Trends Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Trend Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Velocity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Engagement
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredItems.map((item, index) => (
                  <tr key={`${item.source}-${item.external_id}`} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 text-center text-sm text-gray-400">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {getTrendIndicator(item.trend_score, item.velocity)}
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate"
                            >
                              {item.title}
                            </a>
                          </div>
                          {item.topic && (
                            <p className="text-xs text-gray-400 mt-1">{item.topic}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                        {item.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {formatNumber(item.score)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${
                        item.trend_score > 50 ? 'text-green-400' :
                        item.trend_score > 0 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {item.trend_score > 0 ? '+' : ''}{item.trend_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {formatNumber(item.velocity)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      <div className="space-y-1">
                        {item.upvotes && (
                          <div>↑ {formatNumber(item.upvotes)}</div>
                        )}
                        {item.comments && (
                          <div>💬 {formatNumber(item.comments)}</div>
                        )}
                        {item.views && (
                          <div>👁 {formatNumber(item.views)}</div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No trending items found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
