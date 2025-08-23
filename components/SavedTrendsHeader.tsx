'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SavedTrendsHeaderProps {
  total: number;
  currentPage: number;
  totalPages: number;
}

export default function SavedTrendsHeader({ 
  total, 
  currentPage, 
  totalPages 
}: SavedTrendsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Trends
        </Link>
        
        <div>
          <h1 className="text-2xl font-bold text-white">Saved Trends</h1>
          <p className="text-gray-400 text-sm">
            {total} trend{total !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Link
            href={`/saved?page=${Math.max(1, currentPage - 1)}`}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              currentPage <= 1
                ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                : 'border-gray-600 text-gray-300 hover:bg-gray-800'
            }`}
            aria-disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          
          <span className="px-3 py-2 text-sm text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          
          <Link
            href={`/saved?page=${Math.min(totalPages, currentPage + 1)}`}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              currentPage >= totalPages
                ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                : 'border-gray-600 text-gray-300 hover:bg-gray-800'
            }`}
            aria-disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
