'use client';

import { useState, useEffect } from 'react';
import { TrendData } from '../../types/trend';

export default function LiveTestPage() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching test data...');
        const response = await fetch('/api/trends?mock=true&limit=5');
        const data = await response.json();
        console.log('Test data received:', data);
        
        setTrends(data.trends || []);
        setLoading(false);
      } catch (err) {
        console.error('Test fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Live Test Page</h1>
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading test data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Live Test Page</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Live Test Page</h1>
      <div className="mb-4">
        <p>Trends loaded: {trends.length}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.map((trend) => (
          <div key={trend.id} className="bg-white border rounded-lg p-4 shadow">
            <h3 className="font-semibold text-lg mb-2">{trend.title}</h3>
            <p className="text-sm text-gray-600 mb-2">
              {trend.source} • {trend.region} • Score: {trend.score}
            </p>
            <p className="text-sm text-gray-500">
              Velocity: {trend.velocity}, Acceleration: {trend.acceleration}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
