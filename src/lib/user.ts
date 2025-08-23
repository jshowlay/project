import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const USER_ID_COOKIE = 'trenderai_user_id';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

export interface UserInfo {
  id: string;
  isAnonymous: boolean;
}

/**
 * Get or create a user ID from cookies
 * Uses anonymous user tracking with secure httpOnly cookies
 */
export function getUserId(): string {
  const cookieStore = cookies();
  let userId = cookieStore.get(USER_ID_COOKIE)?.value;

  if (!userId) {
    userId = `anon_${uuidv4()}`;
    // Note: In a real implementation, you would set the cookie here
    // For now, we'll return the generated ID and let the API handle cookie setting
  }

  return userId;
}

/**
 * Set user ID cookie (called from API routes)
 */
export function setUserIdCookie(userId: string): void {
  const cookieStore = cookies();
  
  cookieStore.set(USER_ID_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  });
}

/**
 * Get user information
 */
export function getUserInfo(): UserInfo {
  const userId = getUserId();
  return {
    id: userId,
    isAnonymous: userId.startsWith('anon_')
  };
}

/**
 * Generate a new anonymous user ID
 */
export function generateAnonymousUserId(): string {
  return `anon_${uuidv4()}`;
}

/**
 * Check if a user ID is anonymous
 */
export function isAnonymousUser(userId: string): boolean {
  return userId.startsWith('anon_');
}

/**
 * Extract user ID from request headers (for API routes)
 */
export function getUserIdFromRequest(request: Request): string {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return generateAnonymousUserId();
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies[USER_ID_COOKIE] || generateAnonymousUserId();
}
