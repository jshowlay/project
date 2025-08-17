import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { getVideoList, refreshAccessToken } from "@/lib/tiktok";
import { isTokenExpired } from "@/lib/session";
import { PrismaClient } from "@prisma/client";

// Create Prisma client for TikTok database
const tiktokPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TIKTOK_DATABASE_URL,
    },
  },
});

/**
 * TikTok Videos Import Route
 * Fetches and stores user's videos from TikTok
 */
export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    
    if (!session?.token?.access_token) {
      return NextResponse.json(
        { error: "Not authenticated. Please connect your TikTok account first." },
        { status: 401 }
      );
    }
    
    let accessToken = session.token.access_token;
    
    // Check if token is expired and refresh if possible
    if (isTokenExpired(session.token)) {
      if (session.token.refresh_token) {
        try {
          console.log("Token expired, attempting refresh...");
          const refreshResponse = await refreshAccessToken(session.token.refresh_token);
          
          // Update session with new token
          const expiresAt = Math.floor(Date.now() / 1000) + refreshResponse.expires_in;
          session.token = {
            access_token: refreshResponse.access_token,
            refresh_token: refreshResponse.refresh_token || session.token.refresh_token,
            expires_in: refreshResponse.expires_in,
            expires_at: expiresAt,
          };
          
          accessToken = refreshResponse.access_token;
          console.log("Token refreshed successfully");
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          return NextResponse.json(
            { error: "Authentication expired. Please reconnect your TikTok account." },
            { status: 401 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Authentication expired. Please reconnect your TikTok account." },
          { status: 401 }
        );
      }
    }
    
    // Parse request body
    const { cursor = 0, max_count = 20 } = await req.json().catch(() => ({}));
    
    // Fetch videos from TikTok
    console.log(`Fetching videos from TikTok (cursor: ${cursor}, max: ${max_count})...`);
    const videoData = await getVideoList(accessToken, cursor, max_count);
    
    const videos = videoData?.data?.videos ?? [];
    const nextCursor = videoData?.data?.cursor ?? null;
    const hasMore = videoData?.data?.has_more ?? false;
    
    if (videos.length === 0) {
      return NextResponse.json({
        ok: true,
        imported: 0,
        nextCursor,
        hasMore,
        message: "No videos found"
      });
    }
    
    // Get or create TikTok account
    const userOpenId = session.user?.open_id || "unknown";
    const account = await tiktokPrisma.tikTokAccount.upsert({
      where: { openId: userOpenId },
      create: {
        openId: userOpenId,
        displayName: session.user?.display_name || null,
        avatarUrl: session.user?.avatar_url || null,
      },
      update: {
        displayName: session.user?.display_name || null,
        avatarUrl: session.user?.avatar_url || null,
      },
    });
    
    console.log(`Processing ${videos.length} videos for account: ${account.id}`);
    
    // Import videos into database
    let importedCount = 0;
    for (const video of videos) {
      try {
        await tiktokPrisma.tikTokVideo.upsert({
          where: { id: video.id },
          update: {
            description: video.video_description || null,
            shareUrl: video.share_url || null,
            durationSec: video.duration || null,
            width: video.width || null,
            height: video.height || null,
            likeCount: video.like_count || 0,
            commentCount: video.comment_count || 0,
            shareCount: video.share_count || 0,
            viewCount: video.view_count || 0,
            postedAt: video.create_time ? new Date(video.create_time * 1000) : null,
            hashtags: Array.isArray(video.hashtags) ? JSON.stringify(video.hashtags) : null,
            musicTitle: video.music_title || null,
          },
          create: {
            id: video.id,
            accountId: account.id,
            description: video.video_description || null,
            shareUrl: video.share_url || null,
            durationSec: video.duration || null,
            width: video.width || null,
            height: video.height || null,
            likeCount: video.like_count || 0,
            commentCount: video.comment_count || 0,
            shareCount: video.share_count || 0,
            viewCount: video.view_count || 0,
            postedAt: video.create_time ? new Date(video.create_time * 1000) : null,
            hashtags: Array.isArray(video.hashtags) ? JSON.stringify(video.hashtags) : null,
            musicTitle: video.music_title || null,
          },
        });
        importedCount++;
      } catch (videoError) {
        console.error(`Error importing video ${video.id}:`, videoError);
      }
    }
    
    console.log(`Successfully imported ${importedCount} videos`);
    
    return NextResponse.json({
      ok: true,
      imported: importedCount,
      nextCursor,
      hasMore,
      message: `Imported ${importedCount} videos successfully`
    });
    
  } catch (error: any) {
    console.error("Video import error:", error);
    
    if (error.message?.includes("401")) {
      return NextResponse.json(
        { error: "Authentication failed. Please reconnect your TikTok account." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || "Failed to import videos" },
      { status: 500 }
    );
  }
}

/**
 * Get imported videos for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    
    if (!session?.user?.open_id) {
      return NextResponse.json(
        { error: "Not authenticated. Please connect your TikTok account first." },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // Get account and videos
    const account = await tiktokPrisma.tikTokAccount.findUnique({
      where: { openId: session.user.open_id },
      include: {
        videos: {
          take: limit,
          skip: offset,
          orderBy: { postedAt: "desc" },
        },
      },
    });
    
    if (!account) {
      return NextResponse.json({
        videos: [],
        total: 0,
        message: "No account found"
      });
    }
    
    return NextResponse.json({
      videos: account.videos,
      total: account.videos.length,
      account: {
        id: account.id,
        displayName: account.displayName,
        avatarUrl: account.avatarUrl,
      }
    });
    
  } catch (error: any) {
    console.error("Get videos error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

