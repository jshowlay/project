import { NextRequest, NextResponse } from "next/server";
import { fetchTrendingByHashtag } from "@/lib/tiktokTrends";

/**
 * TikTok Trending Route
 * Returns trending content for specified hashtag (optional feature)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hashtag = searchParams.get("hashtag");
    
    if (!hashtag) {
      return NextResponse.json(
        { error: "Hashtag parameter is required" },
        { status: 400 }
      );
    }
    
    // Remove # if present
    const cleanHashtag = hashtag.replace(/^#/, "");
    
    console.log(`Fetching trending content for hashtag: ${cleanHashtag}`);
    
    const trendingItems = await fetchTrendingByHashtag(cleanHashtag);
    
    return NextResponse.json({
      hashtag: cleanHashtag,
      items: trendingItems,
      count: trendingItems.length,
      provider: process.env.TREND_PROVIDER || "none"
    });
    
  } catch (error: any) {
    console.error("Trending error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch trending content" },
      { status: 500 }
    );
  }
}

