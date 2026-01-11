"use client";

import { useState } from 'react';
import Image from 'next/image';
import YouTubeImage, { extractYouTubeVideoId } from './YouTubeImage';

interface MediaCardProps {
  source: string;
  title: string;
  url?: string;
  imageUrl?: string;
  imageUrls?: any;
  channel?: string;
  publishedAt?: string;
  score?: number;
  views?: number;
  likes?: number;
  comments?: number;
  tags?: string[];
  className?: string;
  onClick?: () => void;
  showStats?: boolean;
  showChannel?: boolean;
  showTags?: boolean;
  imageQuality?: 'maxres' | 'high' | 'medium' | 'low';
}

export default function MediaCard({
  source,
  title,
  url,
  imageUrl,
  imageUrls,
  channel,
  publishedAt,
  score,
  views,
  likes,
  comments,
  tags = [],
  className = '',
  onClick,
  showStats = true,
  showChannel = true,
  showTags = true,
  imageQuality = 'high'
}: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Check if this is a YouTube video
  const isYouTube = source === 'youtube' || (url && url.includes('youtube.com'));
  const videoId = isYouTube && url ? extractYouTubeVideoId(url) : null;

  const formatNumber = (num?: number): string => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative">
        {isYouTube && videoId ? (
          <YouTubeImage
            videoId={videoId}
            imageUrls={imageUrls}
            title={title}
            channel={showChannel ? channel : undefined}
            width={320}
            height={180}
            quality={imageQuality}
            showPlayButton={true}
            className="w-full"
          />
        ) : imageUrl && !imageError ? (
          <div className="relative w-full h-48 bg-gray-100">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized={false}
            />
            {showChannel && channel && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <div className="text-white text-sm font-medium truncate">
                  {channel}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-3xl mb-2">
                {source === 'youtube' ? '📹' : source === 'reddit' ? '📱' : '📄'}
              </div>
              <div className="text-sm capitalize">{source}</div>
            </div>
          </div>
        )}
        
        {/* Source Badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 text-xs font-medium text-white bg-black bg-opacity-70 rounded-md capitalize">
            {source}
          </span>
        </div>
        
        {/* Score Badge */}
        {score !== undefined && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md">
              {score.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-2">
          {title}
        </h3>

        {/* Channel and Date */}
        {(showChannel || publishedAt) && (
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            {showChannel && channel && (
              <span className="truncate">{channel}</span>
            )}
            {publishedAt && (
              <span>{formatDate(publishedAt)}</span>
            )}
          </div>
        )}

        {/* Stats */}
        {showStats && (views || likes || comments) && (
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
            {views && (
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
                {formatNumber(views)}
              </span>
            )}
            {likes && (
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                </svg>
                {formatNumber(likes)}
              </span>
            )}
            {comments && (
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                </svg>
                {formatNumber(comments)}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {showTags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
