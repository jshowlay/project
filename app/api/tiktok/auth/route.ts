import { NextRequest, NextResponse } from "next/server";
import { buildTikTokAuthUrl } from "@/lib/tiktok";
import { getOrCreateSid } from "@/lib/session";

/**
 * TikTok OAuth v2 Authentication Route
 * Redirects user to TikTok for authorization
 */
export async function GET(req: NextRequest) {
  try {
    // Validate required environment variables
    if (!process.env.TIKTOK_CLIENT_KEY) {
      return NextResponse.json(
        { error: "TIKTOK_CLIENT_KEY not configured" },
        { status: 500 }
      );
    }

    if (!process.env.TIKTOK_REDIRECT_URI) {
      return NextResponse.json(
        { error: "TIKTOK_REDIRECT_URI not configured" },
        { status: 500 }
      );
    }

    const res = NextResponse.redirect(new URL("/tiktok", req.url));
    
    // Get or create session ID
    const sid = getOrCreateSid(req, res);
    
    // Create state parameter for CSRF protection
    const state = `${sid}:${Date.now()}`;
    
    // Build TikTok authorization URL
    const authUrl = buildTikTokAuthUrl(state);
    
    console.log("Redirecting to TikTok auth:", authUrl);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("TikTok auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

