'use client';

import { memo } from 'react';
import { TrendData } from '../types/trend';
import Image from 'next/image';

interface TrendCardProps {
  trend: TrendData;
  isNew?: boolean;
}

const TrendCard = memo(({ trend, isNew = false }: TrendCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getVelocityColor = (velocity: number) => {
    if (velocity >= 80) return 'text-red-400';
    if (velocity >= 60) return 'text-orange-400';
    if (velocity >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getAccelerationIcon = (acceleration: number) => {
    if (acceleration > 20) return '↗️';
    if (acceleration < -20) return '↘️';
    return '→';
  };

  const getAccelerationColor = (acceleration: number) => {
    if (acceleration > 20) return 'text-green-400';
    if (acceleration < -20) return 'text-red-400';
    return 'text-gray-400';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className={`
      relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200
      border border-gray-200 dark:border-gray-700 overflow-hidden
      ${isNew ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
    `}>
      {/* New indicator */}
      {isNew && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            NEW
          </span>
        </div>
      )}

      {/* Image */}
      {trend.imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={trend.imageUrl}
            alt={trend.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2 mb-1">
              {trend.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{trend.source}</span>
              <span>•</span>
              <span>{trend.region}</span>
              <span>•</span>
              <span>{formatTimeAgo(trend.lastSeenAt)}</span>
            </div>
          </div>
          
          {/* Score indicator */}
          <div className="flex flex-col items-center ml-3">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm
              ${getScoreColor(trend.score)}
            `}>
              {trend.score}
            </div>
            <span className="text-xs text-gray-500 mt-1">Score</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Velocity</span>
              <span className={`text-sm font-semibold ${getVelocityColor(trend.velocity)}`}>
                {trend.velocity}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-1">
              <div 
                className={`h-1 rounded-full ${getVelocityColor(trend.velocity).replace('text-', 'bg-')}`}
                style={{ width: `${trend.velocity}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Acceleration</span>
              <span className={`text-sm font-semibold ${getAccelerationColor(trend.acceleration)}`}>
                {getAccelerationIcon(trend.acceleration)} {Math.abs(trend.acceleration)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-1">
              <div 
                className={`h-1 rounded-full ${getAccelerationColor(trend.acceleration).replace('text-', 'bg-')}`}
                style={{ width: `${Math.min(Math.abs(trend.acceleration), 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        {trend.tags && trend.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {trend.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
            {trend.tags.length > 3 && (
              <span className="text-gray-500 text-xs px-2 py-1">
                +{trend.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Signals: {Object.keys(trend.signals).length}</span>
          </div>
          
          {trend.url && (
            <a
              href={trend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded transition-colors"
            >
              View →
            </a>
          )}
        </div>
      </div>
    </div>
  );
});

TrendCard.displayName = 'TrendCard';

export default TrendCard;
