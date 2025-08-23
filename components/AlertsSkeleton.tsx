export default function AlertsSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
          <div className="w-32 h-8 bg-gray-300 rounded"></div>
        </div>
        <div className="w-24 h-8 bg-gray-300 rounded"></div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rules Section Skeleton */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-24 h-6 bg-gray-300 rounded"></div>
            <div className="w-20 h-8 bg-gray-300 rounded"></div>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-32 h-4 bg-gray-300 rounded"></div>
                      <div className="w-16 h-4 bg-gray-300 rounded"></div>
                    </div>
                    <div className="w-48 h-3 bg-gray-300 rounded mb-2"></div>
                    <div className="space-y-1">
                      <div className="w-40 h-3 bg-gray-300 rounded"></div>
                      <div className="w-36 h-3 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inbox Section Skeleton */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-20 h-6 bg-gray-300 rounded"></div>
            <div className="flex space-x-2">
              <div className="w-24 h-8 bg-gray-300 rounded"></div>
              <div className="w-28 h-8 bg-gray-300 rounded"></div>
            </div>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gray-300 rounded"></div>
                      <div className="w-16 h-4 bg-gray-300 rounded"></div>
                      <div className="w-12 h-4 bg-gray-300 rounded"></div>
                    </div>
                    <div className="w-40 h-4 bg-gray-300 rounded mb-1"></div>
                    <div className="w-32 h-3 bg-gray-300 rounded mb-2"></div>
                    <div className="space-y-1">
                      <div className="w-36 h-3 bg-gray-300 rounded"></div>
                      <div className="w-24 h-3 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
