'use client';
import { useState, useEffect } from 'react';
import TrendSparkline from '@/components/TrendSparkline';

export default function TestSparklinePage() {
  const [testData, setTestData] = useState<any>(null);

  useEffect(() => {
    // Test the API
    fetch('/api/trends/sparkline?term=Web3')
      .then(r => r.json())
      .then(data => {
        console.log('API test result:', data);
        setTestData(data);
      })
      .catch(err => console.error('API test error:', err));
  }, []);

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-2xl mb-6">Sparkline Test Page</h1>
      
      <div className="space-y-6">
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg mb-2">API Test Result:</h2>
          <pre className="text-xs bg-gray-900 p-2 rounded">
            {testData ? JSON.stringify(testData, null, 2) : 'Loading...'}
          </pre>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg mb-2">TrendSparkline Component Test:</h2>
          <div className="border border-red-500 p-2">
            <TrendSparkline term="Web3" geo="US" width={160} height={36} />
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg mb-2">Static SVG Test:</h2>
          <svg width="160" height="36" className="border border-gray-600">
            <path 
              d="M 0,36 L 16,28 L 32,32 L 48,24 L 64,20 L 80,16 L 96,12 L 112,8 L 128,4 L 144,0" 
              fill="none" 
              stroke="var(--accent)" 
              strokeWidth="2" 
              vectorEffect="non-scaling-stroke" 
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
