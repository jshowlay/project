'use client';

import { useState, useEffect } from 'react';
import { getClientUserId, setClientUserId } from '../lib/auth-client';

interface SaveButtonProps {
  trendId: string;
  trendSource: string;
  trendTopic: string;
  trendTitle?: string;
  trendUrl?: string;
  trendImageUrl?: string;
  trendScore?: number;
  trendVelocity?: number;
  trendAcceleration?: number;
  trendRegion?: string;
  trendTags?: string[];
  trendObservedAt?: Date;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'text' | 'full';
}

export default function SaveButton({
  trendId,
  trendSource,
  trendTopic,
  trendTitle,
  trendUrl,
  trendImageUrl,
  trendScore = 0,
  trendVelocity = 0,
  trendAcceleration = 0,
  trendRegion = 'US',
  trendTags = [],
  trendObservedAt,
  className = '',
  size = 'md',
  variant = 'icon'
}: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if trend is saved on mount
  useEffect(() => {
    checkSavedStatus();
  }, [trendId, trendSource]);

  const checkSavedStatus = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      setIsChecking(true);
      const userId = getClientUserId();
      
      const response = await fetch(
        `/api/saved/${encodeURIComponent(trendId)}?source=${encodeURIComponent(trendSource)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsSaved(data.data.isSaved);
      } else {
        console.error('Failed to check saved status');
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const userId = getClientUserId();
      
      if (isSaved) {
        // Remove from saved
        const response = await fetch(
          `/api/saved/${encodeURIComponent(trendId)}?source=${encodeURIComponent(trendSource)}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          setIsSaved(false);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to remove trend');
        }
      } else {
        // Save trend
        const response = await fetch('/api/saved', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trend_id: trendId,
            trend_source: trendSource,
            trend_topic: trendTopic,
            trend_title: trendTitle,
            trend_url: trendUrl,
            trend_image_url: trendImageUrl,
            trend_score: trendScore,
            trend_velocity: trendVelocity,
            trend_acceleration: trendAcceleration,
            trend_region: trendRegion,
            trend_tags: trendTags,
            trend_observed_at: trendObservedAt?.toISOString(),
          }),
        });

        if (response.ok) {
          setIsSaved(true);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to save trend');
        }
      }
    } catch (error) {
      console.error('Error saving/removing trend:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  // Variant classes
  const variantClasses = {
    icon: 'rounded-full p-2',
    text: 'rounded-lg',
    full: 'rounded-lg w-full justify-center'
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonClasses = `
    inline-flex items-center gap-2 font-medium transition-all duration-200
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${isSaved 
      ? 'bg-green-600 hover:bg-green-700 text-white' 
      : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
    }
    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
    ${error ? 'border-2 border-red-500' : ''}
    ${className}
  `.trim();

  const iconClasses = `
    ${iconSizeClasses[size]}
    ${isLoading ? 'animate-spin' : ''}
  `.trim();

  if (isChecking) {
    return (
      <button
        className={`${buttonClasses} opacity-50 cursor-not-allowed`}
        disabled
        aria-label="Checking saved status..."
      >
        <svg className={iconSizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {variant !== 'icon' && <span>Loading...</span>}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleSave}
        disabled={isLoading}
        className={buttonClasses}
        aria-label={isSaved ? 'Remove from saved' : 'Save trend'}
        title={isSaved ? 'Remove from saved' : 'Save trend'}
      >
        {isSaved ? (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ) : (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        )}
        
        {variant !== 'icon' && (
          <span>
            {isLoading 
              ? (isSaved ? 'Removing...' : 'Saving...') 
              : (isSaved ? 'Saved' : 'Save')
            }
          </span>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-600 text-white text-xs rounded shadow-lg z-10">
          {error}
        </div>
      )}
    </div>
  );
}
