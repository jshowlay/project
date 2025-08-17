import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/tiktok";
import { getOrCreateSid, setSession } from "@/lib/session";

/**
 * TikTok OAuth v2 Callback Route
 * Handles the authorization response from TikTok
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");
    
    const res = NextResponse.redirect(new URL("/tiktok", req.url));
    const sid = getOrCreateSid(req, res);
    
    // Handle OAuth errors
    if (error) {
      console.error("TikTok OAuth error:", error);
      setSession(sid, { error: `OAuth error: ${error}` });
      return res;
    }
    
    // Validate required parameters
    if (!code) {
      console.error("Missing authorization code");
      setSession(sid, { error: "Missing authorization code" });
      return res;
    }
    
    if (!state) {
      console.error("Missing state parameter");
      setSession(sid, { error: "Missing state parameter" });
      return res;
    }
    
    // Validate state parameter (basic CSRF protection)
    const [sessionId, timestamp] = state.split(":");
    if (sessionId !== sid) {
      console.error("Invalid state parameter");
      setSession(sid, { error: "Invalid state parameter" });
      return res;
    }
    
    // Exchange code for access token
    console.log("Exchanging code for token...");
    const tokenResponse = await exchangeCodeForToken(code);
    
    // Calculate token expiration time
    const expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;
    
    // Store token in session
    setSession(sid, {
      token: {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        expires_at: expiresAt,
      },
      error: undefined, // Clear any previous errors
    });
    
    console.log("Token exchange successful, redirecting to TikTok page");
    return res;
    
  } catch (error: any) {
    console.error("Token exchange error:", error);
    
    const res = NextResponse.redirect(new URL("/tiktok", req.url));
    const sid = getOrCreateSid(req, res);
    
    setSession(sid, { 
      error: error?.message || "Token exchange failed" 
    });
    
    return res;
  }
}

