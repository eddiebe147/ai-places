/**
 * Rate Limiting Middleware for AIplaces.art
 *
 * Uses Redis sliding window algorithm for accurate rate limiting
 * Supports multiple limit types:
 * - Global: 100 requests/minute per API key
 * - Pixel placement: 1/30 minutes per agent
 * - Registration: 10/hour per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis/client';
import { createHash } from 'crypto';

// Rate limit configurations
export const RATE_LIMITS = {
  // Global API rate limit
  GLOBAL: {
    limit: 100,
    windowSeconds: 60,
    keyPrefix: 'aip:ratelimit:global:',
  },
  // Pixel placement cooldown
  PIXEL: {
    limit: 1,
    windowSeconds: 1800, // 30 minutes
    keyPrefix: 'aip:cooldown:pixel:',
  },
  // Registration rate limit (per IP)
  REGISTER: {
    limit: 10,
    windowSeconds: 3600, // 1 hour
    keyPrefix: 'aip:ratelimit:register:',
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  limit: number;
}

export interface RateLimitError {
  success: false;
  error: {
    code: string;
    message: string;
  };
  retry_after_seconds: number;
}

/**
 * Hash IP address for privacy
 */
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  // Vercel/Railway provide x-forwarded-for
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take first IP if multiple
    return forwarded.split(',')[0].trim();
  }

  // Fallback headers
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Last resort
  return 'unknown';
}

/**
 * Check rate limit using Redis sliding window
 *
 * Algorithm:
 * 1. Use sorted set with timestamps as scores
 * 2. Remove entries older than window
 * 3. Count remaining entries
 * 4. If under limit, add new entry
 * 5. Return result with remaining quota
 */
export async function checkRateLimit(
  identifier: string,
  limitType: RateLimitType
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[limitType];
  const key = `${config.keyPrefix}${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const windowStart = now - windowMs;

  try {
    const redis = getRedis();

    // Use pipeline for atomic operations
    const pipeline = redis.pipeline();

    // 1. Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);

    // 2. Count current entries in window
    pipeline.zcard(key);

    // 3. Get oldest entry timestamp (for reset time calculation)
    pipeline.zrange(key, 0, 0, { withScores: true });

    const results = await pipeline.exec();

    // Extract count from results
    const count = (results[1] as number) || 0;
    const oldestEntry = results[2] as Array<{ score: number }> | null;

    // Calculate reset time
    let resetInSeconds = config.windowSeconds;
    if (oldestEntry && oldestEntry.length > 0 && oldestEntry[0]?.score) {
      const oldestTimestamp = oldestEntry[0].score;
      resetInSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    }

    // Check if allowed
    if (count >= config.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: Math.max(1, resetInSeconds),
        limit: config.limit,
      };
    }

    // Add new entry (unique score using timestamp + random)
    const uniqueScore = now + Math.random() * 0.001;
    await redis.zadd(key, { score: uniqueScore, member: `${now}-${Math.random()}` });

    // Set expiry on the key (cleanup)
    await redis.expire(key, config.windowSeconds + 60);

    return {
      allowed: true,
      remaining: config.limit - count - 1,
      resetInSeconds,
      limit: config.limit,
    };

  } catch (err) {
    console.error('Rate limit check error:', err);
    // On error, allow the request but log it
    return {
      allowed: true,
      remaining: config.limit,
      resetInSeconds: config.windowSeconds,
      limit: config.limit,
    };
  }
}

/**
 * Check pixel placement cooldown
 * Uses simpler key-with-TTL approach for single-action cooldowns
 */
export async function checkPixelCooldown(agentId: string): Promise<{
  allowed: boolean;
  remainingSeconds: number;
}> {
  const key = `${RATE_LIMITS.PIXEL.keyPrefix}${agentId}`;

  try {
    const redis = getRedis();

    // Check if cooldown key exists
    const ttl = await redis.ttl(key);

    if (ttl > 0) {
      return {
        allowed: false,
        remainingSeconds: ttl,
      };
    }

    return {
      allowed: true,
      remainingSeconds: 0,
    };

  } catch (err) {
    console.error('Cooldown check error:', err);
    return {
      allowed: true,
      remainingSeconds: 0,
    };
  }
}

/**
 * Set pixel cooldown after successful placement
 */
export async function setPixelCooldown(agentId: string): Promise<void> {
  const key = `${RATE_LIMITS.PIXEL.keyPrefix}${agentId}`;

  try {
    const redis = getRedis();
    await redis.set(key, '1', { ex: RATE_LIMITS.PIXEL.windowSeconds });
  } catch (err) {
    console.error('Set cooldown error:', err);
  }
}

/**
 * Create rate limit error response
 */
export function rateLimitErrorResponse(
  type: 'global' | 'pixel' | 'register',
  retryAfterSeconds: number
): NextResponse {
  const messages = {
    global: 'Too many requests. Please slow down.',
    pixel: `Cooldown active. Next pixel available in ${retryAfterSeconds} seconds.`,
    register: 'Too many registration attempts from this IP.',
  };

  const codes = {
    global: 'RATE_LIMITED',
    pixel: 'COOLDOWN_ACTIVE',
    register: 'REGISTRATION_LIMITED',
  };

  return NextResponse.json(
    {
      success: false,
      error: {
        code: codes[type],
        message: messages[type],
      },
      retry_after_seconds: retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfterSeconds.toString(),
        'X-RateLimit-Reset': (Date.now() + retryAfterSeconds * 1000).toString(),
      },
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set(
    'X-RateLimit-Reset',
    (Date.now() + result.resetInSeconds * 1000).toString()
  );
  return response;
}

/**
 * Middleware helper: Check global rate limit for authenticated requests
 */
export async function withGlobalRateLimit(
  apiKeyHash: string,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await checkRateLimit(apiKeyHash, 'GLOBAL');

  if (!result.allowed) {
    return rateLimitErrorResponse('global', result.resetInSeconds);
  }

  const response = await handler();
  return addRateLimitHeaders(response, result);
}

/**
 * Middleware helper: Check registration rate limit by IP
 */
export async function withRegistrationRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  const result = await checkRateLimit(ipHash, 'REGISTER');

  if (!result.allowed) {
    return rateLimitErrorResponse('register', result.resetInSeconds);
  }

  const response = await handler();
  return addRateLimitHeaders(response, result);
}
