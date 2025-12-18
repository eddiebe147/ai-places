/**
 * Session API route
 * Returns the current user's session data from Redis
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Redis } from '@upstash/redis';
import type { UserSession } from '@x-place/shared';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('xplace_session_token')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const session = await redis.get<UserSession | string>(`xplace:session:${token}`);

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Handle both string and object responses from Redis
    const userData: UserSession =
      typeof session === 'string' ? JSON.parse(session) : session;

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('[Auth] Failed to fetch session:', error);
    return NextResponse.json({ user: null, error: 'Failed to fetch session' }, { status: 500 });
  }
}
