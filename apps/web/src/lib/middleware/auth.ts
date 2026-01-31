/**
 * API Key Authentication Middleware for AIplaces.art
 *
 * Validates Bearer tokens in the Authorization header
 * Looks up agent by hashed API key in Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getAdminClient } from '@/lib/supabase/admin';
import { getRedis } from '@/lib/redis/client';

// API key format: aip_[24 base64url chars] = 28 chars after prefix
const API_KEY_PATTERN = /^aip_[A-Za-z0-9_-]{32}$/;

// Cache TTL for agent lookups (5 minutes)
const AGENT_CACHE_TTL = 300;

export interface AuthenticatedAgent {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'banned' | 'revoked';
  description: string | null;
  total_pixels: number;
  last_pixel_at: string | null;
  verified_at: string | null;
}

export interface AuthResult {
  success: true;
  agent: AuthenticatedAgent;
}

export interface AuthError {
  success: false;
  error: {
    code: string;
    message: string;
  };
  status: number;
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  return API_KEY_PATTERN.test(apiKey);
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7).trim();
}

/**
 * Authenticate an agent from API key
 *
 * 1. Extract Bearer token from header
 * 2. Validate format
 * 3. Hash the key
 * 4. Check Redis cache first
 * 5. If not cached, lookup in Supabase
 * 6. Cache result and return agent
 */
export async function authenticateAgent(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  // Extract token
  const apiKey = extractBearerToken(request);

  if (!apiKey) {
    return {
      success: false,
      error: {
        code: 'MISSING_AUTH',
        message: 'Missing Authorization header. Use: Authorization: Bearer <api_key>',
      },
      status: 401,
    };
  }

  // Validate format
  if (!isValidApiKeyFormat(apiKey)) {
    return {
      success: false,
      error: {
        code: 'INVALID_KEY_FORMAT',
        message: 'Invalid API key format. Keys should start with aip_',
      },
      status: 401,
    };
  }

  // Hash the key
  const keyHash = hashApiKey(apiKey);
  const cacheKey = `aip:agent:${keyHash}`;

  try {
    const redis = getRedis();

    // Check cache first
    const cached = await redis.get<AuthenticatedAgent>(cacheKey);
    if (cached) {
      // Still validate status from cache
      if (cached.status === 'banned') {
        return {
          success: false,
          error: {
            code: 'AGENT_BANNED',
            message: 'This agent has been banned',
          },
          status: 403,
        };
      }
      if (cached.status === 'revoked') {
        return {
          success: false,
          error: {
            code: 'KEY_REVOKED',
            message: 'This API key has been revoked',
          },
          status: 401,
        };
      }
      return { success: true, agent: cached };
    }

    // Lookup in Supabase
    const supabase = getAdminClient();
    const { data: agent, error } = await supabase
      .from('agents')
      .select('id, name, status, description, total_pixels, last_pixel_at, verified_at')
      .eq('api_key_hash', keyHash)
      .single();

    if (error || !agent) {
      return {
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API key is invalid or does not exist',
        },
        status: 401,
      };
    }

    // Check status
    if (agent.status === 'banned') {
      return {
        success: false,
        error: {
          code: 'AGENT_BANNED',
          message: 'This agent has been banned',
        },
        status: 403,
      };
    }

    if (agent.status === 'revoked') {
      return {
        success: false,
        error: {
          code: 'KEY_REVOKED',
          message: 'This API key has been revoked',
        },
        status: 401,
      };
    }

    // Cache the agent (even pending agents, just check status on use)
    await redis.set(cacheKey, agent, { ex: AGENT_CACHE_TTL });

    return { success: true, agent: agent as AuthenticatedAgent };

  } catch (err) {
    console.error('Auth middleware error:', err);
    return {
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication service error',
      },
      status: 500,
    };
  }
}

/**
 * Require active agent status
 * Use after authenticateAgent() to ensure agent is verified
 */
export function requireActiveAgent(agent: AuthenticatedAgent): AuthError | null {
  if (agent.status !== 'active') {
    return {
      success: false,
      error: {
        code: 'AGENT_NOT_ACTIVE',
        message: `Agent status is '${agent.status}'. Only active (verified) agents can perform this action.`,
      },
      status: 403,
    };
  }
  return null;
}

/**
 * Create error response from AuthError
 */
export function authErrorResponse(error: AuthError): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: error.error,
    },
    { status: error.status }
  );
}

/**
 * Invalidate agent cache (call after status changes)
 */
export async function invalidateAgentCache(apiKeyHash: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`aip:agent:${apiKeyHash}`);
}
