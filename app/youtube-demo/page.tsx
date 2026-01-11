"use client";

import { useState, useEffect } from 'react';
import MediaCard from '@/components/content/MediaCard';
import YouTubeImage, { extractYouTubeVideoId } from '@/components/content/YouTubeImage';

interface YouTubeDemoVideo {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  url: string;
  thumbnails: any;
}

export default function YouTubeDemoPage() {
  const [videos, setVideos] = useState<YouTubeDemoVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageQuality, setImageQuality] = useState<'maxres' | 'high' | 'medium' | 'low'>('high');

  // Sample YouTube video data for demo
  const sampleVideos: YouTubeDemoVideo[] = [
    {
      id: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
      channel: 'Rick Astley',
      publishedAt: '2009-10-25T06:57:33Z',
      viewCount: '1500000000',
      likeCount: '15000000',
      commentCount: '500000',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnails: {
        maxres: { url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg' },
        high: { url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
        medium: { url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg' },
        default: { url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg' }
      }
    },
    {
      id: '9bZkp7q19f0',
      title: 'PSY - GANGNAM STYLE(강남스타일) M/V',
      channel: 'officialpsy',
      publishedAt: '2012-07-15T07:46:32Z',
      viewCount: '4500000000',
      likeCount: '25000000',
      commentCount: '800000',
      url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
      thumbnails: {
        maxres: { url: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg' },
        high: { url: 'https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg' },
        medium: { url: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg' },
        default: { url: 'https://img.youtube.com/vi/9bZkp7q19f0/default.jpg' }
      }
    },
    {
      id: 'kJQP7kiw5Fk',
      title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
      channel: 'Luis Fonsi',
      publishedAt: '2017-01-13T04:00:00Z',
      viewCount: '8500000000',
      likeCount: '35000000',
      commentCount: '1200000',
      url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      thumbnails: {
        maxres: { url: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg' },
        high: { url: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
        medium: { url: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg' },
        default: { url: 'https://img.youtube.com/vi/kJQP7kiw5Fk/default.jpg' }
      }
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setVideos(sampleVideos);
      setLoading(false);
    }, 1000);
  }, []);

  const formatNumber = (num: string): string => {
    const n = parseInt(num);
    if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">Error loading videos</div>
            <div className="text-gray-600 dark:text-gray-400">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            YouTube High-Quality Images Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Showcasing high-quality YouTube thumbnail images with automatic fallback support
          </p>
          
          {/* Quality Selector */}
          <div className="flex items-center space-x-4 mb-6">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Image Quality:
            </label>
            <select
              value={imageQuality}
              onChange={(e) => setImageQuality(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="maxres">Max Resolution</option>
              <option value="high">High Quality</option>
              <option value="medium">Medium Quality</option>
              <option value="low">Low Quality</option>
            </select>
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <MediaCard
              key={video.id}
              source="youtube"
              title={video.title}
              url={video.url}
              channel={video.channel}
              publishedAt={video.publishedAt}
              views={parseInt(video.viewCount)}
              likes={parseInt(video.likeCount)}
              comments={parseInt(video.commentCount)}
              imageUrls={{
                primary: video.thumbnails.maxres?.url,
                high: video.thumbnails.high?.url,
                medium: video.thumbnails.medium?.url,
                low: video.thumbnails.default?.url,
                fallbacks: {
                  maxres: `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
                  high: `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`,
                  medium: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
                  default: `https://img.youtube.com/vi/${video.id}/default.jpg`
                }
              }}
              imageQuality={imageQuality}
              showStats={true}
              showChannel={true}
              showTags={false}
            />
          ))}
        </div>

        {/* Individual YouTube Image Examples */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Individual YouTube Image Components
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="text-center">
                <YouTubeImage
                  videoId={video.id}
                  title={video.title}
                  channel={video.channel}
                  width={280}
                  height={157}
                  quality={imageQuality}
                  showPlayButton={true}
                  className="mb-2"
                />
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {video.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features List */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Features
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Automatic high-quality thumbnail detection
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Fallback to lower quality if high-quality fails
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              YouTube play button overlay
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Channel name display
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Responsive design with proper aspect ratios
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Error handling with placeholder content
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Support for all YouTube thumbnail qualities
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

