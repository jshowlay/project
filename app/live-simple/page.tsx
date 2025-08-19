'use client';

import { useState, useEffect } from 'react';
import { TrendData } from '../../types/trend';

export default function LiveSimplePage() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data for simple live page...');
        const response = await fetch('/api/trends?mock=true&limit=10');
        const data = await response.json();
        console.log('Data received:', data);
        
        setTrends(data.trends || []);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  console.log('Render state:', { trendsCount: trends.length, loading, error });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Live Trends (Simple)
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <div className="text-red-800 dark:text-red-200">
              Error: {error}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading trends...</span>
          </div>
        ) : trends.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No trends found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try refreshing the page.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {trends.length} trending topics
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trends.map((trend) => (
                <div key={trend.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                    {trend.title}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span className="font-medium">{trend.source}</span>
                    <span className="mx-2">•</span>
                    <span>{trend.region}</span>
                    <span className="mx-2">•</span>
                    <span>Score: {trend.score}</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    <div>Velocity: {trend.velocity}</div>
                    <div>Acceleration: {trend.acceleration}</div>
                  </div>
                  {trend.tags && trend.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {trend.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
