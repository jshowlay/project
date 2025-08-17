'use client';

import { useEffect, useState } from 'react';

type User = {
  data?: {
    user?: {
      display_name?: string;
      avatar_url?: string;
      open_id?: string;
    };
  };
  error?: string;
};

type ImportResponse = {
  ok?: boolean;
  imported?: number;
  error?: string;
  nextCursor?: number | null;
  hasMore?: boolean;
  message?: string;
};

type Video = {
  id: string;
  description?: string;
  shareUrl?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  viewCount?: number;
  postedAt?: string;
  hashtags?: string;
  musicTitle?: string;
};

type VideosResponse = {
  videos: Video[];
  total: number;
  account?: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
  };
  error?: string;
};

export default function TikTokPage() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [importing, setImporting] = useState(false);

  // Fetch user info on component mount
  useEffect(() => {
    fetchUser();
    fetchVideos();
  }, []);

  async function fetchUser() {
    try {
      setLoading(true);
      const response = await fetch('/api/tiktok/user');
      const data = await response.json();
      
      if (data.error) {
        setStatus(data.error);
        setUser(null);
      } else {
        setUser(data);
        setStatus("");
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setStatus('Failed to fetch user information');
    } finally {
      setLoading(false);
    }
  }

  async function fetchVideos() {
    try {
      const response = await fetch('/api/tiktok/videos?limit=10');
      const data: VideosResponse = await response.json();
      
      if (data.error) {
        console.error('Error fetching videos:', data.error);
      } else {
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  }

  async function importVideos() {
    try {
      setImporting(true);
      setStatus('Importing videos from TikTok...');
      
      const response = await fetch('/api/tiktok/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ max_count: 20 }),
      });
      
      const data: ImportResponse = await response.json();
      
      if (data.error) {
        setStatus(data.error);
      } else {
        setStatus(data.message || `Imported ${data.imported} videos successfully`);
        // Refresh videos list
        await fetchVideos();
      }
    } catch (error) {
      console.error('Error importing videos:', error);
      setStatus('Failed to import videos');
    } finally {
      setImporting(false);
    }
  }

  function formatNumber(num: number | undefined): string {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  function formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  }

  function parseHashtags(hashtagsJson: string | undefined): string[] {
    if (!hashtagsJson) return [];
    try {
      return JSON.parse(hashtagsJson);
    } catch {
      return [];
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">TikTok Integration</h1>
        <p className="text-gray-400">
          Connect your TikTok account and import your videos for analysis
        </p>
      </div>

      {/* Authentication Section */}
      <div className="bg-gray-900 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Account Connection</h2>
        
        {!user && !loading && (
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              Connect your TikTok account to get started
            </p>
            <a 
              href="/api/tiktok/auth"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
              Connect TikTok
            </a>
          </div>
        )}

        {loading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        )}

        {user && (
          <div className="flex items-center gap-4">
            {user.data?.user?.avatar_url && (
              <img 
                className="w-16 h-16 rounded-full border-2 border-gray-700" 
                src={user.data.user.avatar_url} 
                alt="TikTok avatar"
              />
            )}
            <div>
              <h3 className="text-lg font-medium">
                {user.data?.user?.display_name || 'TikTok User'}
              </h3>
              <p className="text-gray-400 text-sm">
                Connected • ID: {user.data?.user?.open_id}
              </p>
            </div>
            <div className="ml-auto">
              <a 
                href="/api/tiktok/auth"
                className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Re-connect
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {status && (
        <div className={`mb-6 p-4 rounded-lg ${
          status.includes('error') || status.includes('failed') 
            ? 'bg-red-900/20 border border-red-700 text-red-300' 
            : 'bg-green-900/20 border border-green-700 text-green-300'
        }`}>
          {status}
        </div>
      )}

      {/* Video Import Section */}
      {user && (
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Video Import</h2>
          <div className="flex gap-4 mb-6">
            <button 
              onClick={importVideos}
              disabled={importing}
              className="px-6 py-3 bg-amber-500 text-black rounded-xl hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? 'Importing...' : 'Import Recent Videos'}
            </button>
            <button 
              onClick={fetchVideos}
              className="px-6 py-3 border border-gray-600 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Refresh List
            </button>
          </div>
          
          <div className="text-sm text-gray-400">
            <p>• Import your recent TikTok videos for analysis</p>
            <p>• Videos are stored locally in your database</p>
            <p>• You can import up to 20 videos at a time</p>
          </div>
        </div>
      )}

      {/* Imported Videos */}
      {videos.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">
            Imported Videos ({videos.length})
          </h2>
          <div className="grid gap-4">
            {videos.map((video) => (
              <div key={video.id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-sm">
                    {video.description?.substring(0, 100) || 'No description'}
                    {video.description && video.description.length > 100 && '...'}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {formatDate(video.postedAt)}
                  </span>
                </div>
                
                {video.shareUrl && (
                  <a 
                    href={video.shareUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-amber-500 hover:text-amber-400 text-sm"
                  >
                    View on TikTok →
                  </a>
                )}
                
                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                  <span>❤️ {formatNumber(video.likeCount)}</span>
                  <span>💬 {formatNumber(video.commentCount)}</span>
                  <span>📤 {formatNumber(video.shareCount)}</span>
                  <span>👁️ {formatNumber(video.viewCount)}</span>
                </div>
                
                {video.musicTitle && (
                  <p className="text-xs text-gray-500 mt-2">
                    🎵 {video.musicTitle}
                  </p>
                )}
                
                {parseHashtags(video.hashtags).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {parseHashtags(video.hashtags).map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-gray-800 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {user && videos.length === 0 && (
        <div className="bg-gray-900 rounded-xl p-6 text-center">
          <p className="text-gray-400 mb-4">No videos imported yet</p>
          <p className="text-sm text-gray-500">
            Click &quot;Import Recent Videos&quot; to get started
          </p>
        </div>
      )}
    </div>
  );
}

