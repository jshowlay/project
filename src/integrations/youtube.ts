import { Adapter } from './types';
import { TrendItem } from '../types/trends';
import { normalizeTo100, clamp, safeNumber } from './scoring';
import { request } from 'undici';

const API = 'https://www.googleapis.com/youtube/v3';
const key = process.env.YOUTUBE_API_KEY;

// YouTube thumbnail quality options
const THUMBNAIL_QUALITIES = {
  default: 'default',
  medium: 'medium', 
  high: 'high',
  standard: 'standard',
  maxres: 'maxresdefault'
} as const;

type ThumbnailQuality = keyof typeof THUMBNAIL_QUALITIES;

interface YouTubeThumbnails {
  default?: { url: string; width: number; height: number };
  medium?: { url: string; width: number; height: number };
  high?: { url: string; width: number; height: number };
  standard?: { url: string; width: number; height: number };
  maxres?: { url: string; width: number; height: number };
}

interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: YouTubeThumbnails;
    tags?: string[];
    defaultAudioLanguage?: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

/**
 * Get the best available thumbnail URL from YouTube thumbnails
 * Prioritizes maxres > standard > high > medium > default
 */
function getBestThumbnailUrl(thumbnails: YouTubeThumbnails): string {
  // Try to get the highest quality thumbnail available
  const qualityOrder: ThumbnailQuality[] = ['maxres', 'standard', 'high', 'medium', 'default'];
  
  for (const quality of qualityOrder) {
    if (thumbnails[quality]?.url) {
      return thumbnails[quality].url;
    }
  }
  
  // Fallback to a default YouTube thumbnail pattern
  return 'https://img.youtube.com/vi/default/maxresdefault.jpg';
}

/**
 * Get multiple thumbnail URLs for different use cases
 */
function getAllThumbnailUrls(thumbnails: YouTubeThumbnails, videoId: string) {
  const urls = {
    high: thumbnails.maxres?.url || thumbnails.standard?.url || thumbnails.high?.url,
    medium: thumbnails.medium?.url || thumbnails.high?.url,
    low: thumbnails.default?.url,
    // Fallback URLs using YouTube's standard patterns
    fallback: {
      maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      default: `https://img.youtube.com/vi/${videoId}/default.jpg`
    }
  };
  
  return urls;
}

async function listMostPopular(regionCode='US') {
  if (!key) throw new Error('YOUTUBE_API_KEY missing');
  
  // Request additional parts to get more detailed thumbnail information
  const { body } = await request(
    `${API}/videos?part=snippet,statistics,contentDetails&chart=mostPopular&maxResults=25&regionCode=${regionCode}&key=${key}`
  );
  const json = await body.json() as any;
  return json.items ?? [];
}

export const youtubeAdapter: Adapter = {
  SOURCE_ID: 'youtube',
  async fetchTrends() {
    const items: TrendItem[] = [];
    const vids = await listMostPopular('US') as YouTubeVideo[];
    const rawScores = vids.map((v: YouTubeVideo) => 
      safeNumber(v?.statistics?.viewCount) + safeNumber(v?.statistics?.likeCount) * 50
    );
    const norm = normalizeTo100(rawScores);
    
    vids.forEach((v: YouTubeVideo, i: number) => {
      const videoId = v.id;
      const thumbnails = v.snippet.thumbnails;
      const bestThumbnailUrl = getBestThumbnailUrl(thumbnails);
      const allThumbnailUrls = getAllThumbnailUrls(thumbnails, videoId);
      
      items.push({
        source: 'youtube' as const,
        topic: String(v?.snippet?.title ?? '').slice(0, 280),
        score: clamp(norm[i]),
        delta24h: null,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        region: 'US',
        tags: (v?.snippet?.tags ?? []).slice(0, 5),
        raw: { 
          id: videoId, 
          channel: v?.snippet?.channelTitle,
          thumbnails: thumbnails,
          snippet: v?.snippet,
          statistics: v?.statistics,
          // Enhanced image data
          images: {
            primary: bestThumbnailUrl,
            high: allThumbnailUrls.high,
            medium: allThumbnailUrls.medium,
            low: allThumbnailUrls.low,
            fallbacks: allThumbnailUrls.fallback
          },
          // Additional metadata for image processing
          metadata: {
            publishedAt: v?.snippet?.publishedAt,
            duration: null, // Could be added from contentDetails if needed
            categoryId: null, // Could be added if needed
            defaultAudioLanguage: v?.snippet?.defaultAudioLanguage
          }
        },
        observedAt: new Date(v?.snippet?.publishedAt ?? Date.now()),
        language: v?.snippet?.defaultAudioLanguage ?? null
      });
    });
    
    return items;
  }
};
