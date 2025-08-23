import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Get user ID from request with fallbacks for development
 * In production, this would integrate with your auth system
 */
export async function getUserId(request?: NextRequest): Promise<string> {
  // Development fallback
  if (process.env.NODE_ENV === 'development' && process.env.DEV_USER_ID) {
    return process.env.DEV_USER_ID;
  }

  // Try to get from session cookie if request is provided
  if (request) {
    const sessionId = request.cookies.get('session_id')?.value;
    if (sessionId) {
      return sessionId;
    }
  }

  // Fallback to a default user ID for development
  if (process.env.NODE_ENV === 'development') {
    return 'dev-user-001';
  }

  // In production, this should throw an error or redirect to login
  throw new Error('User not authenticated');
}

/**
 * Get user ID from client-side (browser)
 */
export function getClientUserId(): string {
  // In a real app, this would get from localStorage, cookies, or auth context
  if (typeof window !== 'undefined') {
    // Try to get from localStorage
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      return storedUserId;
    }

    // Try to get from cookies
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('session_id='));
    if (sessionCookie) {
      return sessionCookie.split('=')[1];
    }
  }

  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'dev-user-001';
  }

  throw new Error('User not authenticated');
}

/**
 * Set user ID for client-side
 */
export function setClientUserId(userId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_id', userId);
    // Also set a cookie for server-side access
    document.cookie = `session_id=${userId}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

/**
 * Clear user ID from client-side
 */
export function clearClientUserId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_id');
    document.cookie = 'session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  try {
    getClientUserId();
    return true;
  } catch {
    return false;
  }
}
