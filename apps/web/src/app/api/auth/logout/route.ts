/**
 * Logout API route
 * Clears the session from Redis and removes the cookie
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('xplace_session_token')?.value;

  if (token) {
    try {
      // Delete the session from Redis
      await redis.del(`xplace:session:${token}`);
      console.log('[Auth] Session deleted from Redis');
    } catch (error) {
      console.error('[Auth] Failed to delete session from Redis:', error);
    }
  }

  // Create response and clear the cookie
  const response = NextResponse.json({ success: true });
  response.cookies.delete('xplace_session_token');

  return response;
}
