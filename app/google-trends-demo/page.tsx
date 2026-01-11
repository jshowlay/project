"use client";

import { useState, useEffect } from 'react';

interface TrendData {
  topic: string;
  score: number;
  delta24h?: number;
  region?: string;
  tags?: string[];
  url?: string;
  observedAt: string;
  source: string;
}

interface GoogleTrendsResponse {
  success: boolean;
  type: string;
  query?: string;
  geo: string;
  limit: number;
  trends: TrendData[];
  count: number;
  timestamp: string;
}

export default function GoogleTrendsDemoPage() {
  const [trendingTopics, setTrendingTopics] = useState<TrendData[]>([]);
  const [queryResults, setQueryResults] = useState<TrendData[]>([]);
  const [relatedQueries, setRelatedQueries] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('artificial intelligence');
  const [geo, setGeo] = useState('US');
  const [error, setError] = useState<string | null>(null);

  // Fetch trending topics on component mount
  useEffect(() => {
    fetchTrendingTopics();
  }, [geo]);

  const fetchTrendingTopics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/google-trends?type=trending&geo=${geo}&limit=10`);
      const data: GoogleTrendsResponse = await response.json();
      
      if (data.success) {
        setTrendingTopics(data.trends);
      } else {
        setError(data.error || 'Failed to fetch trending topics');
      }
    } catch (err) {
      setError('Network error while fetching trending topics');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueryResults = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/google-trends?type=query&q=${encodeURIComponent(query)}&geo=${geo}`);
      const data: GoogleTrendsResponse = await response.json();
      
      if (data.success) {
        setQueryResults(data.trends);
      } else {
        setError(data.error || 'Failed to fetch query results');
      }
    } catch (err) {
      setError('Network error while fetching query results');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedQueries = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/google-trends?type=related&q=${encodeURIComponent(query)}&geo=${geo}`);
      const data: GoogleTrendsResponse = await response.json();
      
      if (data.success) {
        setRelatedQueries(data.trends);
      } else {
        setError(data.error || 'Failed to fetch related queries');
      }
    } catch (err) {
      setError('Network error while fetching related queries');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDelta = (delta?: number): string => {
    if (delta === undefined || delta === null) return 'N/A';
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}%`;
  };

  const getDeltaColor = (delta?: number): string => {
    if (delta === undefined || delta === null) return 'text-gray-500';
    return delta >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const TrendCard = ({ trend }: { trend: TrendData }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
          {trend.topic}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {trend.region}
        </span>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-blue-600">
            {trend.score}
          </span>
          <span className="text-xs text-gray-500">score</span>
        </div>
        
        <div className="text-right">
          <div className={`text-sm font-medium ${getDeltaColor(trend.delta24h)}`}>
            {formatDelta(trend.delta24h)}
          </div>
          <div className="text-xs text-gray-500">24h change</div>
        </div>
      </div>
      
      {trend.tags && trend.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {trend.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      {trend.url && (
        <a
          href={trend.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View on Google Trends →
        </a>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Google Trends Data Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Interactive demo of Google Trends data integration with mock data
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Query
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter search term..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Region
              </label>
              <select
                value={geo}
                onChange={(e) => setGeo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
              </select>
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                onClick={fetchQueryResults}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Search'}
              </button>
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                onClick={fetchRelatedQueries}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Related'}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Trending Topics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Trending Topics ({geo})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trendingTopics.map((trend, index) => (
              <TrendCard key={index} trend={trend} />
            ))}
          </div>
        </div>

        {/* Query Results */}
        {queryResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Search Results for "{query}"
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {queryResults.map((trend, index) => (
                <TrendCard key={index} trend={trend} />
              ))}
            </div>
          </div>
        )}

        {/* Related Queries */}
        {relatedQueries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Related Queries for "{query}"
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {relatedQueries.map((trend, index) => (
                <TrendCard key={index} trend={trend} />
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Data Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {trendingTopics.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Trending Topics
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {queryResults.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Search Results
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {relatedQueries.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Related Queries
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {geo}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Region
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

