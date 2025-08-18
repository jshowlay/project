'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Target, 
  Search, 
  Filter, 
  RefreshCw, 
  Bookmark, 
  Bell, 
  Play,
  BarChart3,
  Clock,
  Globe,
  Users,
  Activity,
  Eye,
  MapPin
} from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TrendSignal {
  velocity: number;
  acceleration: number;
  convergence: number;
  searchIntent: number;
  creatorIndex: number;
  engagementEfficiency: number;
  geoSpread: number;
}

interface TrendData {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  publishedAt: string;
  score: number;
  trendScore: number;
  signals: TrendSignal;
  sparkline: number[];
  classification: 'emerging' | 'breaking' | 'converging' | 'spiky';
  saved: boolean;
  alerted: boolean;
}

interface TrendsResponse {
  trends: TrendData[];
  kpis: {
    topMovers: number;
    breakouts: number;
    converging: number;
    highIntent: number;
  };
  lastUpdated: string;
}

const timeRanges = [
  { label: '1H', value: '1h' },
  { label: '6H', value: '6h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' }
];

const sources = [
  { label: 'All', value: 'all' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Reddit', value: 'reddit' },
  { label: 'Twitter', value: 'twitter' }
];

const signalLabels = [
  { key: 'velocity', label: 'Velocity', icon: TrendingUp, color: 'text-green-400' },
  { key: 'acceleration', label: 'Acceleration', icon: Zap, color: 'text-blue-400' },
  { key: 'convergence', label: 'Convergence', icon: Target, color: 'text-purple-400' },
  { key: 'searchIntent', label: 'Search Intent', icon: Search, color: 'text-yellow-400' },
  { key: 'creatorIndex', label: 'Creator Index', icon: Users, color: 'text-pink-400' },
  { key: 'engagementEfficiency', label: 'Engagement', icon: Activity, color: 'text-orange-400' },
  { key: 'geoSpread', label: 'Geo Spread', icon: Globe, color: 'text-cyan-400' }
];

export default function TrendsPage() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedSource, setSelectedSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trends');
      if (!response.ok) throw new Error('Failed to fetch trends');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchData();
      setLastRefresh(new Date());
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const filteredTrends = data?.trends.filter(trend => {
    if (selectedSource !== 'all' && trend.source !== selectedSource) return false;
    if (searchQuery && !trend.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }) || [];

  const radarData = filteredTrends.map(trend => ({
    name: trend.title,
    x: trend.signals.velocity,
    y: trend.signals.acceleration,
    z: trend.signals.convergence,
    classification: trend.classification
  }));

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'breaking': return '#ef4444';
      case 'emerging': return '#10b981';
      case 'converging': return '#3b82f6';
      case 'spiky': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getSignalColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin-slow w-8 h-8 text-gold" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gold">Trends Dashboard</h1>
              <p className="text-gray-400 text-sm">
                Real-time trend analysis and signal detection
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
                <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  autoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-800">
          <div className="flex flex-wrap items-center gap-4">
            {/* Time Range */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div className="flex bg-gray-800 rounded-lg p-1">
                {timeRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      timeRange === range.value
                        ? 'bg-gold text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm"
              >
                {sources.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 flex-1 min-w-64">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm placeholder-gray-400"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg font-medium hover:bg-gold/90 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* KPIs */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm font-medium">Top Movers</p>
                  <p className="text-2xl font-bold">{data.kpis.topMovers}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-400 text-sm font-medium">Breakouts</p>
                  <p className="text-2xl font-bold">{data.kpis.breakouts}</p>
                </div>
                <Zap className="w-8 h-8 text-red-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm font-medium">Converging</p>
                  <p className="text-2xl font-bold">{data.kpis.converging}</p>
                </div>
                <Target className="w-8 h-8 text-blue-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 text-sm font-medium">High Intent</p>
                  <p className="text-2xl font-bold">{data.kpis.highIntent}</p>
                </div>
                <Search className="w-8 h-8 text-yellow-400" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Trend Radar Chart */}
        <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Trend Radar</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Velocity" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Acceleration" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Scatter data={radarData} fill="#8884d8">
                  {radarData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getClassificationColor(entry.classification)}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trends Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredTrends.map((trend, index) => (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold line-clamp-2">{trend.title}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {/* Toggle save */}}
                        className={`p-2 rounded-lg transition-colors ${
                          trend.saved ? 'text-gold bg-gold/10' : 'text-gray-400 hover:text-gold'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {/* Toggle alert */}}
                        className={`p-2 rounded-lg transition-colors ${
                          trend.alerted ? 'text-red-400 bg-red-400/10' : 'text-gray-400 hover:text-red-400'
                        }`}
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg text-gray-400 hover:text-gold transition-colors">
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm line-clamp-2 mb-3">{trend.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {trend.source}
                    </span>
                    <span>{formatTimeAgo(trend.publishedAt)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trend.classification === 'breaking' ? 'bg-red-500/20 text-red-400' :
                      trend.classification === 'emerging' ? 'bg-green-500/20 text-green-400' :
                      trend.classification === 'converging' ? 'bg-blue-500/20 text-blue-400' :
                      trend.classification === 'spiky' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {trend.classification}
                    </span>
                  </div>
                </div>

                {/* Signal Analysis */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {signalLabels.map((signal) => {
                      const Icon = signal.icon;
                      const value = trend.signals[signal.key as keyof TrendSignal];
                      return (
                        <div key={signal.key} className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${signal.color}`} />
                          <span className="text-sm text-gray-300">{signal.label}</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getSignalColor(value)}`}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{value}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sparkline */}
                  <div className="h-16 bg-gray-800 rounded-lg p-2 mb-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={trend.sparkline.map((value, index) => ({ x: index, y: value }))}>
                        <Scatter dataKey="y" fill="#e5c35a" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gold font-semibold">Score: {trend.score}</span>
                      <span className="text-gray-400">Trend: {trend.trendScore}</span>
                    </div>
                    <button className="px-4 py-2 bg-gold text-black rounded-lg text-sm font-medium hover:bg-gold/90">
                      Do Next
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Methodology */}
        <div className="mt-8 bg-gray-900/50 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Methodology</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-gold mb-2">Signal Analysis</h3>
              <ul className="space-y-1">
                <li><strong>Velocity:</strong> Rate of growth in mentions and engagement</li>
                <li><strong>Acceleration:</strong> Change in velocity over time</li>
                <li><strong>Convergence:</strong> Multiple sources discussing the same topic</li>
                <li><strong>Search Intent:</strong> People actively searching for related terms</li>
                <li><strong>Creator Index:</strong> Influential creators engaging with the trend</li>
                <li><strong>Engagement Efficiency:</strong> Quality of interactions vs volume</li>
                <li><strong>Geo Spread:</strong> Geographic distribution of the trend</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gold mb-2">Classifications</h3>
              <ul className="space-y-1">
                <li><strong>Breaking:</strong> Rapidly growing with high velocity</li>
                <li><strong>Emerging:</strong> New trends with potential for growth</li>
                <li><strong>Converging:</strong> Multiple signals aligning</li>
                <li><strong>Spiky:</strong> Volatile with irregular patterns</li>
                <li><strong>Converging:</strong> Multiple signals aligning</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
