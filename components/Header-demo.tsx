'use client';

import React, { useState } from 'react';
import Header from './Header';

export default function HeaderDemo() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          Header Component Demo - Saved Feature
        </h1>

        {/* Controls */}
        <div className="bg-gray-800 p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-semibold text-white">Controls</h2>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={isAuthed}
                onChange={(e) => setIsAuthed(e.target.checked)}
                className="rounded"
              />
              <span>User Authenticated</span>
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <label className="text-white">
              Saved Count:
              <input
                type="number"
                min="0"
                max="200"
                value={savedCount}
                onChange={(e) => setSavedCount(parseInt(e.target.value) || 0)}
                className="ml-2 px-3 py-1 rounded bg-gray-700 text-white border border-gray-600"
              />
            </label>
          </div>

          <div className="text-sm text-gray-300">
            <p>Current State: {isAuthed ? 'Authenticated' : 'Not Authenticated'}</p>
            <p>Saved Count: {savedCount}</p>
            <p>Display Count: {savedCount > 99 ? '99+' : savedCount}</p>
          </div>
        </div>

        {/* Header Preview */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Header Preview</h2>
          <div className="border border-gray-600 rounded-lg overflow-hidden">
            <Header 
              isAuthed={isAuthed}
              savedCount={savedCount}
            />
            <div className="p-8 bg-gray-700 text-center text-gray-300">
              <p>Page content would go here</p>
              <p className="text-sm mt-2">
                The header above shows the &quot;Saved&quot; navigation link and bookmark icon 
                only when the user is authenticated.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Explanation */}
        <div className="bg-gray-800 p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-semibold text-white">Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 p-4 rounded">
              <h3 className="font-semibold text-white mb-2">Navigation Link</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• &quot;Saved&quot; appears between &quot;Trends&quot; and &quot;Alerts&quot;</li>
                <li>• Only visible when user is authenticated</li>
                <li>• Links to `/saved` page</li>
                <li>• Works on both desktop and mobile</li>
              </ul>
            </div>

            <div className="bg-gray-700 p-4 rounded">
              <h3 className="font-semibold text-white mb-2">Bookmark Icon</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Shows in header&apos;s right section</li>
                <li>• Only visible when user is authenticated</li>
                <li>• Positioned before Login/Get Started buttons</li>
                <li>• Touch-friendly on mobile</li>
              </ul>
            </div>

            <div className="bg-gray-700 p-4 rounded">
              <h3 className="font-semibold text-white mb-2">Count Badge</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Only shows when count &gt; 0</li>
                <li>• Displays &quot;99+&quot; for counts over 99</li>
                <li>• Positioned at -right-1, -top-1</li>
                <li>• Blue background with white text</li>
              </ul>
            </div>

            <div className="bg-gray-700 p-4 rounded">
              <h3 className="font-semibold text-white mb-2">Accessibility</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Proper ARIA labels with count</li>
                <li>• Focus management</li>
                <li>• Keyboard navigation support</li>
                <li>• Screen reader friendly</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Cases */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Test Cases</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setIsAuthed(false);
                setSavedCount(0);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Not Authenticated (0 saved)
            </button>
            
            <button
              onClick={() => {
                setIsAuthed(true);
                setSavedCount(5);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Authenticated (5 saved)
            </button>
            
            <button
              onClick={() => {
                setIsAuthed(true);
                setSavedCount(150);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Authenticated (150 saved - shows 99+)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
