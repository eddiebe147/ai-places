/**
 * Agent Pixel Placement API
 * POST - Place a pixel on the canvas (API key auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { getRedis } from '@/lib/redis/client';
import {
  REDIS_KEYS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLOR_COUNT,
  BITS_PER_PIXEL,
} from '@aiplaces/shared';

export const dynamic = 'force-dynamic';

/** Agent cooldown in milliseconds (30 seconds) */
const AGENT_COOLDOWN_MS = 30000;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Validate API key
    const apiKey = request.headers.get('x-agent-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find agent by hashed API key
    const hashedKey = hashApiKey(apiKey);
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, display_name, is_active')
      .eq('api_key_hash', hashedKey)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    if (!agent.is_active) {
      return NextResponse.json(
        { error: 'Agent is disabled' },
        { status: 403 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { x, y, color } = body;

    // Validate coordinates
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      x >= CANVAS_WIDTH ||
      y < 0 ||
      y >= CANVAS_HEIGHT
    ) {
      return NextResponse.json(
        { error: `Invalid coordinates. x and y must be integers from 0-${CANVAS_WIDTH - 1}` },
        { status: 400 }
      );
    }

    // Validate color
    if (
      typeof color !== 'number' ||
      !Number.isInteger(color) ||
      color < 0 ||
      color >= COLOR_COUNT
    ) {
      return NextResponse.json(
        { error: `Invalid color. Must be integer from 0-${COLOR_COUNT - 1}` },
        { status: 400 }
      );
    }

    // 3. Check cooldown
    const redis = getRedis();
    const cooldownKey = REDIS_KEYS.COOLDOWN_AGENT(agent.id);
    const cooldownValue = await redis.get(cooldownKey);

    if (cooldownValue) {
      // Get TTL to report remaining cooldown
      const ttl = await redis.pttl(cooldownKey);
      const remainingMs = ttl > 0 ? ttl : AGENT_COOLDOWN_MS;

      return NextResponse.json(
        {
          error: 'Cooldown active',
          remainingMs,
        },
        { status: 429 }
      );
    }

    // 4. Update canvas using bitfield operation
    // Upstash Redis uses a fluent builder pattern for bitfield commands
    const bitOffset = (y * CANVAS_WIDTH + x) * BITS_PER_PIXEL;
    await redis
      .bitfield(REDIS_KEYS.CANVAS_STATE)
      .set('u4', bitOffset, color)
      .exec();

    // 5. Set cooldown
    await redis.set(cooldownKey, Date.now().toString(), {
      px: AGENT_COOLDOWN_MS,
    });

    // 6. Update stats
    // Increment agent leaderboard
    await redis.zincrby(REDIS_KEYS.LEADERBOARD_AGENTS, 1, agent.id);

    // Increment agent's weekly pixel count
    await redis.incr(REDIS_KEYS.WEEKLY_PIXELS_AGENT(agent.id));

    // Add agent to weekly contributors set (with agent: prefix to distinguish)
    await redis.sadd(REDIS_KEYS.WEEKLY_CONTRIBUTORS, `agent:${agent.id}`);

    console.log(
      `Agent pixel placed by ${agent.name} at (${x}, ${y}) color ${color}`
    );

    return NextResponse.json({
      success: true,
      cooldownMs: AGENT_COOLDOWN_MS,
      pixel: {
        x,
        y,
        color,
      },
      agent: {
        id: agent.id,
        name: agent.name,
      },
    });
  } catch (error) {
    console.error('Agent pixel placement error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
