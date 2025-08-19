'use client';

import { useState } from 'react';

export default function TestJSPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">JavaScript Test Page</h1>
      <p className="mb-4">Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Increment
      </button>
    </div>
  );
}
