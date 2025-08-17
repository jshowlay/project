/**
 * TikTok OAuth v2 and Display API SDK
 * Handles authentication, token management, and API calls
 */

export const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
export const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
export const TIKTOK_USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";
export const TIKTOK_VIDEO_LIST_URL = "https://open.tiktokapis.com/v2/video/list/";

export type TikTokTokenResponse = {
  access_token: string;
  expires_in: number; // seconds
  refresh_token?: string;
  refresh_expires_in?: number;
  token_type: "Bearer";
  scope?: string;
};

export type TikTokUserInfo = {
  data: {
    user: {
      open_id: string;
      union_id?: string;
      display_name?: string;
      avatar_url?: string;
      profile_deep_link?: string;
      bio_description?: string;
    };
  };
};

export type TikTokVideoList = {
  data: {
    videos: Array<{
      id: string;
      video_description?: string;
      share_url?: string;
      duration?: number;
      width?: number;
      height?: number;
      like_count?: number;
      comment_count?: number;
      share_count?: number;
      view_count?: number;
      create_time?: number; // Unix timestamp
      hashtags?: string[];
      music_title?: string;
    }>;
    cursor?: number;
    has_more?: boolean;
  };
};

/**
 * Build TikTok OAuth authorization URL
 */
export function buildTikTokAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: process.env.TIKTOK_SCOPES || "user.info.basic,video.list",
    response_type: "code",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    state,
  });
  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<TikTokTokenResponse> {
  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    code,
    grant_type: "authorization_code",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
  });

  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Token exchange failed: ${res.status} - ${errorText}`);
  }

  return (await res.json()) as TikTokTokenResponse;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refresh_token: string): Promise<TikTokTokenResponse> {
  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    refresh_token,
    grant_type: "refresh_token",
  });

  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Refresh failed: ${res.status} - ${errorText}`);
  }

  return (await res.json()) as TikTokTokenResponse;
}

/**
 * Get user information from TikTok
 */
export async function getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
  const url = new URL(TIKTOK_USER_INFO_URL);
  url.searchParams.set("fields", [
    "open_id",
    "union_id",
    "display_name",
    "avatar_url",
    "profile_deep_link",
    "bio_description",
  ].join(","));

  const res = await fetch(url, { 
    headers: { Authorization: `Bearer ${accessToken}` } 
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`user/info failed: ${res.status} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Get user's video list from TikTok
 */
export async function getVideoList(
  accessToken: string, 
  cursor = 0, 
  maxCount = 20
): Promise<TikTokVideoList> {
  const res = await fetch(TIKTOK_VIDEO_LIST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ max_count: maxCount, cursor }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`video/list failed: ${res.status} - ${errorText}`);
  }

  return await res.json();
}

