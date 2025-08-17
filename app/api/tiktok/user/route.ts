import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { getUserInfo, refreshAccessToken } from "@/lib/tiktok";
import { isTokenExpired } from "@/lib/session";

/**
 * TikTok User Info Route
 * Returns authenticated user's profile information
 */
export async function GET(req: NextRequest) {
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
    
    // Fetch user info from TikTok
    console.log("Fetching user info from TikTok...");
    const userInfo = await getUserInfo(accessToken);
    
    // Store user info in session for future use
    session.user = {
      open_id: userInfo.data.user.open_id,
      display_name: userInfo.data.user.display_name,
      avatar_url: userInfo.data.user.avatar_url,
    };
    
    return NextResponse.json(userInfo);
    
  } catch (error: any) {
    console.error("User info error:", error);
    
    if (error.message?.includes("401")) {
      return NextResponse.json(
        { error: "Authentication failed. Please reconnect your TikTok account." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || "Failed to fetch user information" },
      { status: 500 }
    );
  }
}

