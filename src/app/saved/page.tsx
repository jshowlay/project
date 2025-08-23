import { Metadata } from 'next';
import { Suspense } from 'react';
import SavedTrendsClient from './SavedTrendsClient';

export const metadata: Metadata = {
  title: 'Saved Trends - TrendrAI',
  description: 'View and manage your saved trends. Track your favorite topics and analyze their performance over time.',
  keywords: 'saved trends, bookmarks, favorite trends, trend tracking, analytics',
  openGraph: {
    title: 'Saved Trends - TrendrAI',
    description: 'View and manage your saved trends',
    type: 'website',
  },
};

export default function SavedTrendsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Saved Trends
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your collection of saved trends and favorite topics. 
            Track their performance and analyze patterns over time.
          </p>
        </div>

        {/* Client Component with Suspense */}
        <Suspense fallback={<SavedTrendsSkeleton />}>
          <SavedTrendsClient />
        </Suspense>
      </div>
    </div>
  );
}

// Loading skeleton
function SavedTrendsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-20 bg-gray-200 rounded mb-4"></div>
            <div className="flex justify-between items-center">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
