"use client";

import { useState } from 'react';
import Image from 'next/image';

interface YouTubeImageUrls {
  primary?: string;
  high?: string;
  medium?: string;
  low?: string;
  fallbacks?: {
    maxres?: string;
    high?: string;
    medium?: string;
    default?: string;
  };
}

interface YouTubeImageProps {
  videoId: string;
  imageUrls?: YouTubeImageUrls;
  title?: string;
  channel?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: 'maxres' | 'high' | 'medium' | 'low';
  showPlayButton?: boolean;
  onClick?: () => void;
}

export default function YouTubeImage({
  videoId,
  imageUrls,
  title,
  channel,
  className = '',
  width = 320,
  height = 180,
  priority = false,
  quality = 'high',
  showPlayButton = true,
  onClick
}: YouTubeImageProps) {
  const [imageError, setImageError] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(quality);

  // Get the best available image URL based on quality preference
  const getImageUrl = (): string => {
    if (imageUrls) {
      // Try to get from the provided imageUrls first
      const qualityOrder = ['maxres', 'high', 'medium', 'low'];
      for (const q of qualityOrder) {
        if (q === 'maxres' && imageUrls.fallbacks?.maxres) return imageUrls.fallbacks.maxres;
        if (q === 'high' && imageUrls.high) return imageUrls.high;
        if (q === 'medium' && imageUrls.medium) return imageUrls.medium;
        if (q === 'low' && imageUrls.low) return imageUrls.low;
      }
    }

    // Fallback to YouTube's standard URL patterns
    const fallbackUrls = {
      maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      low: `https://img.youtube.com/vi/${videoId}/default.jpg`
    };

    return fallbackUrls[currentQuality] || fallbackUrls.high;
  };

  const handleImageError = () => {
    setImageError(true);
    // Try lower quality if current one fails
    const qualityOrder = ['maxres', 'high', 'medium', 'low'];
    const currentIndex = qualityOrder.indexOf(currentQuality);
    if (currentIndex < qualityOrder.length - 1) {
      setCurrentQuality(qualityOrder[currentIndex + 1] as any);
    }
  };

  const imageUrl = getImageUrl();

  return (
    <div 
      className={`relative overflow-hidden rounded-lg bg-gray-100 ${className}`}
      style={{ width, height }}
      onClick={onClick}
    >
      {!imageError ? (
        <Image
          src={imageUrl}
          alt={title || `YouTube video ${videoId}`}
          width={width}
          height={height}
          className="object-cover w-full h-full"
          priority={priority}
          onError={handleImageError}
          unoptimized={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📹</div>
            <div className="text-sm">Video thumbnail</div>
          </div>
        </div>
      )}
      
      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-white ml-1" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
      
      {channel && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="text-white text-sm font-medium truncate">
            {channel}
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to extract video ID from YouTube URL
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*&v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Utility function to get YouTube thumbnail URLs
export function getYouTubeThumbnailUrls(videoId: string): YouTubeImageUrls {
  return {
    fallbacks: {
      maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      default: `https://img.youtube.com/vi/${videoId}/default.jpg`
    }
  };
}

