'use client';

import { useState, useEffect } from 'react';

export default function TestTrendsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
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
    }

    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
  if (!data) return <div className="p-8">No data</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Trends API Test</h1>
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">KPIs:</h2>
        <pre className="bg-gray-800 p-4 rounded text-sm">
          {JSON.stringify(data.kpis, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Trends ({data.trends.length}):</h2>
        <div className="space-y-2">
          {data.trends.map((trend: any) => (
            <div key={trend.id} className="bg-gray-800 p-4 rounded">
              <h3 className="font-semibold">{trend.title}</h3>
              <p className="text-sm text-gray-400">{trend.description}</p>
              <p className="text-xs text-gray-500">Score: {trend.score} | Classification: {trend.classification}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
