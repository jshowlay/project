import { Suspense } from 'react';
import { savedTrendsDB } from '../../lib/saved-trends';
import { getUserId } from '../../lib/auth';
import { notFound } from 'next/navigation';
import SavedTrendsGrid from '../../components/SavedTrendsGrid';
import SavedTrendsHeader from '../../components/SavedTrendsHeader';

interface SavedPageProps {
  searchParams: {
    page?: string;
    limit?: string;
  };
}

export default async function SavedPage({ searchParams }: SavedPageProps) {
  try {
    // Get user ID
    const userId = await getUserId();
    
    // Parse pagination parameters
    const page = parseInt(searchParams.page || '1');
    const limit = parseInt(searchParams.limit || '20');
    
    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return notFound();
    }

    // Get saved trends with details
    const result = await savedTrendsDB.getSavedTrendsWithDetails(userId, page, limit);

    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <SavedTrendsHeader 
            total={result.total} 
            currentPage={page} 
            totalPages={result.totalPages}
          />
          
          <Suspense fallback={<SavedTrendsSkeleton />}>
            <SavedTrendsGrid 
              trends={result.trends}
              currentPage={page}
              totalPages={result.totalPages}
            />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading saved trends:', error);
    return notFound();
  }
}

function SavedTrendsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[#1b1b1b] bg-[#0f0f0f] p-4 animate-pulse">
          <div className="h-4 w-20 mb-2 bg-gray-700 rounded" />
          <div className="h-6 w-3/4 mb-2 bg-gray-700 rounded" />
          <div className="h-4 w-40 bg-gray-700 rounded" />
          <div className="mt-3 flex gap-2">
            <div className="h-6 w-16 bg-gray-700 rounded" />
            <div className="h-6 w-16 bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
