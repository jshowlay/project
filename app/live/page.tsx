'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TrendData, FilterOptions, LivePageState } from '../../types/trend';
import TrendCard from '../../components/TrendCard';

const TIME_OPTIONS = [
  { label: '15m', value: 15 },
  { label: '1h', value: 60 },
  { label: '6h', value: 360 },
  { label: '24h', value: 1440 }
];

const DEFAULT_SOURCES = ['twitter', 'reddit', 'instagram', 'youtube', 'tiktok', 'newsapi'];

export default function LivePage() {
  const [state, setState] = useState<LivePageState>({
    trends: [],
    loading: true,
    error: null,
    lastUpdate: '',
    connectionStatus: 'connecting'
  });

  const [filters, setFilters] = useState<FilterOptions>({
    query: '',
    sources: [],
    region: '',
    sinceMins: 60,
    minScore: 0
  });

  const [availableSources, setAvailableSources] = useState<string[]>(DEFAULT_SOURCES);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter trends based on current filters
  const filteredTrends = useMemo(() => {
    let filtered = state.trends;

    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(trend =>
        trend.title.toLowerCase().includes(query) ||
        trend.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filters.sources.length > 0) {
      filtered = filtered.filter(trend => filters.sources.includes(trend.source));
    }

    if (filters.region) {
      filtered = filtered.filter(trend =>
        trend.region.toLowerCase().includes(filters.region.toLowerCase())
      );
    }

    if (filters.minScore > 0) {
      filtered = filtered.filter(trend => trend.score >= filters.minScore);
    }

    return filtered;
  }, [state.trends, filters]);

  // Initialize SSE connection
  const connectSSE = useCallback(() => {
    console.log('Connecting to SSE...');
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const params = new URLSearchParams({
      sinceMins: filters.sinceMins.toString(),
      minScore: filters.minScore.toString(),
      limit: '50',
      mock: 'true' // Force mock data for now
    });

    if (filters.query) params.append('q', filters.query);
    if (filters.sources.length > 0) params.append('sources', filters.sources.join(','));
    if (filters.region) params.append('region', filters.region);

    const eventSource = new EventSource(`/api/stream?${params.toString()}`);
    eventSourceRef.current = eventSource;

    setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setState(prev => ({ ...prev, connectionStatus: 'connected' }));
    };

    eventSource.onmessage = (event) => {
      try {
        console.log('SSE message received:', event.data);
        const message = JSON.parse(event.data);
        
        if (message.type === 'trends' && message.data) {
          console.log('Trends data received:', message.data.length, 'items');
          setState(prev => ({
            ...prev,
            trends: message.data,
            lastUpdate: message.timestamp,
            loading: false,
            error: null
          }));
        } else if (message.type === 'heartbeat') {
          console.log('Heartbeat received');
          setState(prev => ({ ...prev, lastUpdate: message.timestamp }));
        } else if (message.type === 'error') {
          console.error('SSE error:', message.message);
          setState(prev => ({
            ...prev,
            error: message.message || 'Stream error',
            connectionStatus: 'disconnected'
          }));
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      
      // Attempt to reconnect after 5 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connectSSE();
      }, 5000);
    };

    return eventSource;
  }, [filters]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('Loading initial data...');
        const params = new URLSearchParams({
          sinceMins: filters.sinceMins.toString(),
          minScore: filters.minScore.toString(),
          limit: '50',
          mock: 'true' // Force mock data for now
        });

        if (filters.query) params.append('q', filters.query);
        if (filters.sources.length > 0) params.append('sources', filters.sources.join(','));
        if (filters.region) params.append('region', filters.region);

        const response = await fetch(`/api/trends?${params.toString()}`);
        const data = await response.json();
        console.log('Initial data loaded:', data.trends?.length || 0, 'items');

        setState(prev => ({
          ...prev,
          trends: data.trends || [],
          lastUpdate: data.lastUpdated || new Date().toISOString(),
          loading: false
        }));
      } catch (error) {
        console.error('Error loading initial data:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to load initial data',
          loading: false
        }));
      }
    };

    loadInitialData();
  }, []);

  // Reconnect SSE when filters change
  useEffect(() => {
    connectSSE();
  }, [connectSSE]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const toggleSource = (source: string) => {
    setFilters(prev => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source]
    }));
  };

  const getConnectionStatusColor = () => {
    switch (state.connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (state.connectionStatus) {
      case 'connected': return 'Live';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  console.log('Render state:', { 
    trendsCount: state.trends.length, 
    filteredCount: filteredTrends.length, 
    loading: state.loading, 
    error: state.error,
    connectionStatus: state.connectionStatus 
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Live Trends
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Real-time trending topics and signals
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor().replace('text-', 'bg-')}`} />
                <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
                  {getConnectionStatusText()}
                </span>
              </div>
              
              {state.lastUpdate && (
                <div className="text-sm text-gray-500">
                  Last update: {new Date(state.lastUpdate).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => handleFilterChange({ query: e.target.value })}
                placeholder="Search trends..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Region
              </label>
              <input
                type="text"
                value={filters.region}
                onChange={(e) => handleFilterChange({ region: e.target.value })}
                placeholder="e.g., US, UK, CA"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Range
              </label>
              <select
                value={filters.sinceMins}
                onChange={(e) => handleFilterChange({ sinceMins: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {TIME_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.minScore}
                onChange={(e) => handleFilterChange({ minScore: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Source Filters */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sources
            </label>
            <div className="flex flex-wrap gap-2">
              {availableSources.map(source => (
                <button
                  key={source}
                  onClick={() => toggleSource(source)}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${filters.sources.includes(source)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {state.error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {state.error}
                </div>
              </div>
            </div>
          </div>
        )}

        {state.loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading trends...</span>
          </div>
        ) : filteredTrends.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No trends found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredTrends.length} trending topics
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrends.map((trend, index) => (
                <TrendCard
                  key={trend.id}
                  trend={trend}
                  isNew={index < 3} // Mark first 3 as new
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
