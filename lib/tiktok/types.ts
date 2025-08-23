import { z } from 'zod';

// TikTok API Response Types (from Apify actor)
export const TikTokAuthorSchema = z.object({
  id: z.string(),
  uniqueId: z.string(),
  nickname: z.string().optional(),
  avatarThumb: z.string().optional(),
  avatarMedium: z.string().optional(),
  avatarLarger: z.string().optional(),
  signature: z.string().optional(),
  verified: z.boolean().optional(),
  followerCount: z.number().optional(),
  followingCount: z.number().optional(),
  heartCount: z.number().optional(),
  videoCount: z.number().optional(),
  diggCount: z.number().optional(),
});

export const TikTokMusicSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  author: z.string().optional(),
  duration: z.number().optional(),
  playUrl: z.string().optional(),
});

export const TikTokVideoSchema = z.object({
  id: z.string(),
  desc: z.string().optional(),
  createTime: z.number().optional(),
  author: TikTokAuthorSchema,
  music: TikTokMusicSchema.optional(),
  video: z.object({
    id: z.string().optional(),
    height: z.number().optional(),
    width: z.number().optional(),
    duration: z.number().optional(),
    ratio: z.string().optional(),
    coverUrl: z.string().optional(),
    originCover: z.string().optional(),
    dynamicCover: z.string().optional(),
    playAddr: z.string().optional(),
    downloadAddr: z.string().optional(),
    format: z.string().optional(),
    bitrate: z.number().optional(),
  }).optional(),
  stats: z.object({
    diggCount: z.number().optional(),
    shareCount: z.number().optional(),
    commentCount: z.number().optional(),
    playCount: z.number().optional(),
    collectCount: z.number().optional(),
  }).optional(),
  hashtags: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    title: z.string().optional(),
    cover: z.string().optional(),
  })).optional(),
  mentions: z.array(z.object({
    id: z.string().optional(),
    uniqueId: z.string(),
    nickname: z.string().optional(),
  })).optional(),
  isPrivate: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
});

// Internal TikTok Post Type (normalized)
export const TikTokPostSchema = z.object({
  postId: z.string(),
  authorId: z.string(),
  authorUsername: z.string(),
  authorDisplayName: z.string().optional(),
  authorAvatar: z.string().optional(),
  authorVerified: z.boolean().default(false),
  authorFollowers: z.number().optional(),
  authorFollowing: z.number().optional(),
  authorLikes: z.number().optional(),
  
  description: z.string().optional(),
  hashtags: z.array(z.string()),
  mentions: z.array(z.string()),
  musicTitle: z.string().optional(),
  musicAuthor: z.string().optional(),
  
  videoUrl: z.string().optional(),
  videoDuration: z.number().optional(),
  videoWidth: z.number().optional(),
  videoHeight: z.number().optional(),
  videoBitrate: z.number().optional(),
  videoFormat: z.string().optional(),
  
  likeCount: z.number().default(0),
  commentCount: z.number().default(0),
  shareCount: z.number().default(0),
  viewCount: z.number().default(0),
  bookmarkCount: z.number().default(0),
  
  postedAt: z.date(),
  crawledAt: z.date().default(() => new Date()),
  
  sourceType: z.enum(['trending', 'hashtag', 'user']),
  sourceValue: z.string(),
  
  rawData: z.record(z.any()).optional(),
  
  region: z.string().optional(),
  language: z.string().optional(),
  isPrivate: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
});

// Source Configuration Types
export const TikTokSourceSchema = z.object({
  type: z.enum(['trending', 'hashtag', 'user']),
  value: z.string(),
  maxPosts: z.number().default(50),
  enabled: z.boolean().default(true),
});

// Ingest Event Types
export const IngestEventSchema = z.object({
  id: z.string(),
  source: z.literal('tiktok'),
  eventType: z.enum(['trending', 'hashtag', 'user']),
  sourceValue: z.string().optional(),
  
  startedAt: z.date(),
  completedAt: z.date().optional(),
  duration: z.number().optional(),
  
  itemsRequested: z.number().default(0),
  itemsReceived: z.number().default(0),
  itemsProcessed: z.number().default(0),
  itemsSkipped: z.number().default(0),
  itemsFailed: z.number().default(0),
  
  success: z.boolean().default(false),
  errorMessage: z.string().optional(),
  errorStack: z.string().optional(),
  
  config: z.record(z.any()).optional(),
});

// Hourly Aggregation Types
export const TikTokHourlySchema = z.object({
  id: z.string(),
  date: z.date(),
  hour: z.number().min(0).max(23),
  
  totalPosts: z.number().default(0),
  totalLikes: z.number().default(0),
  totalComments: z.number().default(0),
  totalShares: z.number().default(0),
  totalViews: z.number().default(0),
  totalBookmarks: z.number().default(0),
  
  trendingPosts: z.number().default(0),
  hashtagPosts: z.number().default(0),
  userPosts: z.number().default(0),
  
  topHashtags: z.array(z.object({
    hashtag: z.string(),
    count: z.number(),
  })).optional(),
  
  topAuthors: z.array(z.object({
    username: z.string(),
    posts: z.number(),
    likes: z.number(),
  })).optional(),
  
  avgLikes: z.number().optional(),
  avgComments: z.number().optional(),
  avgShares: z.number().optional(),
  avgViews: z.number().optional(),
  engagementRate: z.number().optional(),
});

// Configuration Types
export const TikTokConfigSchema = z.object({
  apifyToken: z.string(),
  apifyActorId: z.string().default('apify/actor-tiktok-scraper'),
  apifyUserId: z.string().optional(),
  
  sources: z.array(TikTokSourceSchema),
  
  maxPostsPerSource: z.number().default(50),
  minPostAgeHours: z.number().default(1),
  maxPostAgeHours: z.number().default(24),
  rateLimitDelayMs: z.number().default(1000),
  maxRetries: z.number().default(3),
  retryDelayMs: z.number().default(5000),
  
  enableHourlyAggregation: z.boolean().default(true),
  cleanupOldDataDays: z.number().default(30),
  enableDeadLetterQueue: z.boolean().default(true),
  
  apiTimeoutMs: z.number().default(30000),
  maxConcurrentRequests: z.number().default(3),
  enableRawDataStorage: z.boolean().default(true),
  enableDebugLogging: z.boolean().default(false),
});

// Type exports
export type TikTokAuthor = z.infer<typeof TikTokAuthorSchema>;
export type TikTokMusic = z.infer<typeof TikTokMusicSchema>;
export type TikTokVideo = z.infer<typeof TikTokVideoSchema>;
export type TikTokPost = z.infer<typeof TikTokPostSchema>;
export type TikTokSource = z.infer<typeof TikTokSourceSchema>;
export type IngestEvent = z.infer<typeof IngestEventSchema>;
export type TikTokHourly = z.infer<typeof TikTokHourlySchema>;
export type TikTokConfig = z.infer<typeof TikTokConfigSchema>;

// Utility types
export type SourceType = 'trending' | 'hashtag' | 'user';
export type IngestResult = {
  success: boolean;
  postsProcessed: number;
  postsSkipped: number;
  postsFailed: number;
  error?: string;
  duration: number;
};

// Apify API Response Types
export const ApifyRunSchema = z.object({
  id: z.string(),
  status: z.enum(['RUNNING', 'SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']),
  createdAt: z.string(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  meta: z.object({
    origin: z.string().optional(),
    parentRunId: z.string().optional(),
  }).optional(),
});

export const ApifyDatasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  itemCount: z.number(),
  createdAt: z.string(),
  modifiedAt: z.string(),
  accessedAt: z.string(),
  itemCount: z.number(),
  cleanItemCount: z.number(),
  datasetItems: z.array(TikTokVideoSchema),
});

export type ApifyRun = z.infer<typeof ApifyRunSchema>;
export type ApifyDataset = z.infer<typeof ApifyDatasetSchema>;
