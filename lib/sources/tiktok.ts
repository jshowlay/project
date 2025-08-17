import { z } from 'zod';
import { TrendData } from '../database';

// TikTok API response schemas
const TikTokVideoSchema = z.object({
  id: z.string(),
  desc: z.string(),
  createTime: z.number(),
  author: z.object({
    id: z.string(),
    uniqueId: z.string(),
    nickname: z.string(),
    avatarThumb: z.string().optional(),
    followerCount: z.number().optional(),
    followingCount: z.number().optional(),
    heartCount: z.number().optional(),
    videoCount: z.number().optional(),
  }),
  video: z.object({
    id: z.string(),
    height: z.number(),
    width: z.number(),
    duration: z.number(),
    ratio: z.string(),
    cover: z.string().optional(),
    originCover: z.string().optional(),
    dynamicCover: z.string().optional(),
    playAddr: z.string().optional(),
    downloadAddr: z.string().optional(),
  }),
  stats: z.object({
    diggCount: z.number(),
    shareCount: z.number(),
    commentCount: z.number(),
    playCount: z.number(),
    collectCount: z.number(),
  }),
  music: z.object({
    id: z.string(),
    title: z.string(),
    author: z.string(),
    duration: z.number(),
    playUrl: z.string().optional(),
  }),
  hashtags: z.array(z.object({
    id: z.string(),
    name: z.string(),
    title: z.string(),
    cover: z.string().optional(),
  })).optional(),
  challenges: z.array(z.object({
    id: z.string(),
    title: z.string(),
    desc: z.string(),
    profileThumb: z.string().optional(),
    profileMedium: z.string().optional(),
    profileLarger: z.string().optional(),
    coverThumb: z.string().optional(),
    coverMedium: z.string().optional(),
    coverLarger: z.string().optional(),
    isCommerce: z.boolean().optional(),
  })).optional(),
});

const TikTokResponseSchema = z.array(TikTokVideoSchema);

export type TikTokVideo = z.infer<typeof TikTokVideoSchema>;

export class TikTokSource {
  private datasetUrl: string;

  constructor() {
    this.datasetUrl = process.env.TIKTOK_DATASET_URL || '';
    
    if (!this.datasetUrl) {
      console.warn('TIKTOK_DATASET_URL not set, TikTok integration will be disabled');
    }
  }

  // Check if TikTok integration is available
  isAvailable(): boolean {
    return !!this.datasetUrl;
  }

  // Get trending videos from external dataset
  async getTrendingVideos(limit: number = 50): Promise<TrendData[]> {
    if (!this.isAvailable()) {
      console.warn('TikTok integration not available - TIKTOK_DATASET_URL not set');
      return [];
    }

    try {
      console.log('Fetching TikTok trending videos from external dataset');
      
      const response = await fetch(this.datasetUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrenderAI/1.0 (Trend Aggregation Bot)',
        },
        timeout: 30000,
      });

      if (!response.ok) {
        throw new Error(`TikTok dataset API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validatedData = TikTokResponseSchema.parse(data);

      return validatedData
        .slice(0, limit)
        .map(video => this.transformVideo(video));
    } catch (error) {
      console.error('Error fetching TikTok trending videos:', error);
      return [];
    }
  }

  // Get videos by hashtag
  async getVideosByHashtag(hashtag: string, limit: number = 50): Promise<TrendData[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const allVideos = await this.getTrendingVideos(200); // Get more videos to filter
      
      return allVideos
        .filter(video => {
          const hashtags = video.metadata?.hashtags || [];
          return hashtags.some(tag => 
            tag.toLowerCase().includes(hashtag.toLowerCase())
          );
        })
        .slice(0, limit);
    } catch (error) {
      console.error(`Error fetching TikTok videos for hashtag ${hashtag}:`, error);
      return [];
    }
  }

  // Get videos by multiple hashtags
  async getVideosByHashtags(hashtags: string[]): Promise<TrendData[]> {
    const allVideos: TrendData[] = [];
    
    for (const hashtag of hashtags) {
      try {
        const videos = await this.getVideosByHashtag(hashtag, 20);
        allVideos.push(...videos);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to fetch videos for hashtag ${hashtag}:`, error);
      }
    }

    return allVideos;
  }

  // Get videos by user
  async getVideosByUser(username: string, limit: number = 50): Promise<TrendData[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const allVideos = await this.getTrendingVideos(200);
      
      return allVideos
        .filter(video => 
          video.metadata?.author?.uniqueId?.toLowerCase() === username.toLowerCase()
        )
        .slice(0, limit);
    } catch (error) {
      console.error(`Error fetching TikTok videos for user ${username}:`, error);
      return [];
    }
  }

  // Transform TikTok video to TrendData format
  private transformVideo(video: TikTokVideo): TrendData {
    const publishedAt = new Date(video.createTime * 1000);
    const stats = video.stats;
    
    // Calculate score based on engagement metrics
    const playScore = Math.min(stats.playCount / 1000, 50);
    const likeScore = stats.diggCount * 10;
    const shareScore = stats.shareCount * 20;
    const commentScore = stats.commentCount * 15;
    const collectScore = stats.collectCount * 25;
    
    const totalScore = playScore + likeScore + shareScore + commentScore + collectScore;

    // Extract hashtags
    const hashtags = video.hashtags?.map(tag => tag.name) || [];
    const challenges = video.challenges?.map(challenge => challenge.title) || [];

    return {
      source: 'tiktok',
      title: video.desc.substring(0, 100) + (video.desc.length > 100 ? '...' : ''),
      description: video.desc,
      url: `https://www.tiktok.com/@${video.author.uniqueId}/video/${video.id}`,
      published_at: publishedAt,
      region: 'global', // TikTok is global
      category: this.getCategoryFromContent(video.desc, hashtags),
      score: Math.max(totalScore, 1),
      created_at: publishedAt,
      updated_at: new Date(),
      metadata: {
        videoId: video.id,
        author: {
          id: video.author.id,
          uniqueId: video.author.uniqueId,
          nickname: video.author.nickname,
          avatarThumb: video.author.avatarThumb,
          followerCount: video.author.followerCount,
          followingCount: video.author.followingCount,
          heartCount: video.author.heartCount,
          videoCount: video.author.videoCount,
        },
        video: {
          height: video.video.height,
          width: video.video.width,
          duration: video.video.duration,
          ratio: video.video.ratio,
          cover: video.video.cover,
          originCover: video.video.originCover,
          dynamicCover: video.video.dynamicCover,
          playAddr: video.video.playAddr,
          downloadAddr: video.video.downloadAddr,
        },
        stats: {
          playCount: stats.playCount,
          diggCount: stats.diggCount,
          shareCount: stats.shareCount,
          commentCount: stats.commentCount,
          collectCount: stats.collectCount,
        },
        music: {
          id: video.music.id,
          title: video.music.title,
          author: video.music.author,
          duration: video.music.duration,
          playUrl: video.music.playUrl,
        },
        hashtags,
        challenges,
      },
    };
  }

  // Get category from video content and hashtags
  private getCategoryFromContent(desc: string, hashtags: string[]): string {
    const contentLower = desc.toLowerCase();
    const hashtagsLower = hashtags.map(h => h.toLowerCase());

    // Check for category keywords in content and hashtags
    const categoryKeywords: Record<string, string[]> = {
      'entertainment': ['funny', 'comedy', 'dance', 'music', 'song', 'lip sync', 'challenge'],
      'lifestyle': ['fashion', 'beauty', 'makeup', 'style', 'outfit', 'hair', 'skincare'],
      'food': ['food', 'recipe', 'cooking', 'baking', 'kitchen', 'chef', 'meal'],
      'fitness': ['workout', 'fitness', 'exercise', 'gym', 'training', 'health'],
      'education': ['learn', 'tutorial', 'how to', 'tips', 'advice', 'knowledge'],
      'technology': ['tech', 'gadget', 'review', 'unboxing', 'app', 'software'],
      'travel': ['travel', 'vacation', 'trip', 'destination', 'explore', 'adventure'],
      'pets': ['pet', 'dog', 'cat', 'animal', 'cute', 'puppy', 'kitten'],
      'gaming': ['game', 'gaming', 'stream', 'play', 'win', 'lose'],
      'news': ['news', 'update', 'breaking', 'report', 'story'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (contentLower.includes(keyword) || hashtagsLower.includes(keyword)) {
          return category;
        }
      }
    }

    return 'entertainment'; // Default category for TikTok
  }

  // Get trending hashtags
  async getTrendingHashtags(): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const allVideos = await this.getTrendingVideos(100);
      const hashtagCounts: Record<string, number> = {};

      allVideos.forEach(video => {
        const hashtags = video.metadata?.hashtags || [];
        hashtags.forEach(hashtag => {
          hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
        });
      });

      return Object.entries(hashtagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([hashtag]) => hashtag);
    } catch (error) {
      console.error('Error getting trending hashtags:', error);
      return [];
    }
  }

  // Get videos by trending hashtags
  async getVideosByTrendingHashtags(): Promise<TrendData[]> {
    const trendingHashtags = await this.getTrendingHashtags();
    return this.getVideosByHashtags(trendingHashtags.slice(0, 10));
  }

  // Get high engagement videos
  async getHighEngagementVideos(minLikes: number = 10000): Promise<TrendData[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const allVideos = await this.getTrendingVideos(200);
      
      return allVideos.filter(video => 
        (video.metadata?.stats?.diggCount || 0) >= minLikes
      );
    } catch (error) {
      console.error('Error fetching high engagement videos:', error);
      return [];
    }
  }

  // Get viral videos (high play count)
  async getViralVideos(minPlays: number = 100000): Promise<TrendData[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const allVideos = await this.getTrendingVideos(200);
      
      return allVideos.filter(video => 
        (video.metadata?.stats?.playCount || 0) >= minPlays
      );
    } catch (error) {
      console.error('Error fetching viral videos:', error);
      return [];
    }
  }
}

export const tiktokSource = new TikTokSource();
