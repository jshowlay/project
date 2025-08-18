'use client';

import { useState, useEffect } from 'react';

export default function TrendsSimplePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        console.log('Fetching trends data...');
        const response = await fetch('/api/trends');
        console.log('Response status:', response.status);
        if (!response.ok) throw new Error('Failed to fetch trends');
        const result = await response.json();
        console.log('Data received:', result);
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching trends:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin-slow w-8 h-8 text-gold mx-auto mb-4">⏳</div>
            <p>Loading trends...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Data</h1>
          <p className="text-gray-400">No trends data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-gold mb-6">Trends Dashboard</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">KPIs</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-green-400 text-sm">Top Movers</p>
            <p className="text-2xl font-bold">{data.kpis.topMovers}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-red-400 text-sm">Breakouts</p>
            <p className="text-2xl font-bold">{data.kpis.breakouts}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-blue-400 text-sm">Converging</p>
            <p className="text-2xl font-bold">{data.kpis.converging}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-yellow-400 text-sm">High Intent</p>
            <p className="text-2xl font-bold">{data.kpis.highIntent}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Trends ({data.trends.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.trends.map((trend: any) => (
            <div key={trend.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-2">{trend.title}</h3>
              <p className="text-gray-400 text-sm mb-3">{trend.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gold font-semibold">Score: {trend.score}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  trend.classification === 'breaking' ? 'bg-red-500/20 text-red-400' :
                  trend.classification === 'emerging' ? 'bg-green-500/20 text-green-400' :
                  trend.classification === 'converging' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {trend.classification}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
