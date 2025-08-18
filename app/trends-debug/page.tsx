'use client';

import { useState, useEffect } from 'react';

export default function TrendsDebugPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string[]>([]);

  const addDebug = (message: string) => {
    setDebug(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    addDebug('Component mounted');
    
    async function fetchData() {
      try {
        addDebug('Starting fetch...');
        setLoading(true);
        
        const response = await fetch('/api/trends');
        addDebug(`Response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        addDebug(`Data received: ${result.trends?.length || 0} trends`);
        
        setData(result);
        setError(null);
        addDebug('Data set successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        addDebug(`Error: ${errorMessage}`);
        setError(errorMessage);
      } finally {
        setLoading(false);
        addDebug('Loading finished');
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-gold mb-6">Trends Debug</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Debug Log</h2>
        <div className="bg-gray-800 p-4 rounded-lg max-h-64 overflow-y-auto">
          {debug.map((log, index) => (
            <div key={index} className="text-sm text-gray-300 mb-1">
              {log}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">State</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
          <p><strong>Error:</strong> {error || 'none'}</p>
          <p><strong>Data:</strong> {data ? `${data.trends?.length || 0} trends` : 'null'}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin-slow w-8 h-8 text-gold mx-auto mb-4">⏳</div>
          <p>Loading trends...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Data Preview</h2>
          <div className="bg-gray-800 p-4 rounded-lg">
            <p><strong>KPIs:</strong></p>
            <pre className="text-sm text-gray-300 mt-2">
              {JSON.stringify(data.kpis, null, 2)}
            </pre>
            <p className="mt-4"><strong>First Trend:</strong></p>
            <pre className="text-sm text-gray-300 mt-2">
              {JSON.stringify(data.trends?.[0], null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
