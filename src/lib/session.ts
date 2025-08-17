/**
 * Simple session management for development
 * In production, replace with Redis or database-based sessions
 */

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

// In-memory session store (dev-only)
const sessionStore = new Map<string, any>();

export interface SessionData {
  token?: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    expires_at: number; // Unix timestamp when token expires
  };
  error?: string;
  user?: {
    open_id: string;
    display_name?: string;
    avatar_url?: string;
  };
}

/**
 * Get or create session ID from cookies
 */
export function getOrCreateSid(req: NextRequest, res: NextResponse): string {
  const cookieName = "tiktok_sid";
  const cookie = req.cookies.get(cookieName)?.value;
  
  if (cookie && sessionStore.has(cookie)) {
    return cookie;
  }
  
  const sid = randomUUID();
  sessionStore.set(sid, {});
  
  // Set cookie in response
  res.cookies.set(cookieName, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  
  return sid;
}

/**
 * Get session data by session ID
 */
export function getSession(sid: string): SessionData | null {
  return sessionStore.get(sid) || null;
}

/**
 * Set session data by session ID
 */
export function setSession(sid: string, data: Partial<SessionData>): void {
  const existing = sessionStore.get(sid) || {};
  sessionStore.set(sid, { ...existing, ...data });
}

/**
 * Clear session data
 */
export function clearSession(sid: string): void {
  sessionStore.delete(sid);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: SessionData['token']): boolean {
  if (!token || !token.expires_at) return true;
  return Date.now() >= token.expires_at * 1000;
}

/**
 * Get session from request cookies
 */
export function getSessionFromRequest(req: NextRequest): SessionData | null {
  const sid = req.cookies.get("tiktok_sid")?.value;
  if (!sid) return null;
  return getSession(sid);
}

