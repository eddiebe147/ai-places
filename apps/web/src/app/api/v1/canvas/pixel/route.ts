import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';
import { AgentPixelPlacement, PixelPlacementResponse, ApiResponse } from '@aiplaces/shared';

const redis = Redis.fromEnv();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CANVAS_KEY = 'aip:canvas:state';
const CANVAS_VERSION_KEY = 'aip:canvas:version';
const COOLDOWN_PREFIX = 'aip:cooldown:';
const COOLDOWN_SECONDS = 1800; // 30 minutes

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const MAX_COLOR = 15;

// GET /api/v1/canvas/pixel?x=0&y=0 - Get single pixel
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ x: number; y: number; color: number }>>> {
  try {
    const { searchParams } = new URL(request.url);
    const x = parseInt(searchParams.get('x') || '');
    const y = parseInt(searchParams.get('y') || '');

    if (isNaN(x) || isNaN(y) || x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_COORDINATES',
            message: `Coordinates must be within 0-${CANVAS_WIDTH - 1} range`,
          },
        },
        { status: 400 }
      );
    }

    // Calculate bit offset (4 bits per pixel)
    const pixelIndex = y * CANVAS_WIDTH + x;
    const byteOffset = Math.floor(pixelIndex / 2);
    const isHighNibble = pixelIndex % 2 === 0;

    const canvasData = await redis.get<string>(CANVAS_KEY);
    if (!canvasData) {
      return NextResponse.json({
        success: true,
        data: { x, y, color: 0 }, // Default white
      });
    }

    const buffer = Buffer.from(canvasData, 'base64');
    const byte = buffer[byteOffset] || 0;
    const color = isHighNibble ? (byte >> 4) & 0x0f : byte & 0x0f;

    return NextResponse.json({
      success: true,
      data: { x, y, color },
    });
  } catch (error) {
    console.error('Get pixel error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch pixel',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/canvas/pixel - Place a pixel
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PixelPlacementResponse>>> {
  try {
    // TODO: Use auth middleware
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing or invalid Authorization header',
          },
        },
        { status: 401 }
      );
    }

    // TODO: Replace with actual auth middleware - hash and lookup
    const apiKey = authHeader.slice(7);
    const { data: agent, error: authError } = await supabase
      .from('agents')
      .select('id, name, status')
      .eq('api_key_hash', apiKey) // Should be hashed lookup
      .single();

    if (authError || !agent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_API_KEY',
            message: 'API key is invalid or has been revoked',
          },
        },
        { status: 401 }
      );
    }

    if (agent.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AGENT_NOT_ACTIVE',
            message: `Agent status is '${agent.status}'. Only active agents can place pixels.`,
          },
        },
        { status: 403 }
      );
    }

    // Check cooldown
    const cooldownKey = `${COOLDOWN_PREFIX}${agent.id}`;
    const cooldownTtl = await redis.ttl(cooldownKey);

    if (cooldownTtl > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'COOLDOWN_ACTIVE',
            message: `Cooldown active. Next pixel available in ${cooldownTtl} seconds.`,
          },
          retry_after_seconds: cooldownTtl,
        },
        { status: 429 }
      );
    }

    // Parse and validate body
    const body: AgentPixelPlacement = await request.json();
    const { x, y, color } = body;

    if (typeof x !== 'number' || typeof y !== 'number' || typeof color !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'x, y, and color must be numbers',
          },
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(color)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'x, y, and color must be integers',
          },
        },
        { status: 400 }
      );
    }

    if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_COORDINATES',
            message: `Coordinates must be within 0-${CANVAS_WIDTH - 1} range`,
            details: { x, y, max: CANVAS_WIDTH - 1 },
          },
        },
        { status: 400 }
      );
    }

    if (color < 0 || color > MAX_COLOR) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_COLOR',
            message: `Color must be between 0 and ${MAX_COLOR}`,
            details: { color, max: MAX_COLOR },
          },
        },
        { status: 400 }
      );
    }

    // Get current canvas or create empty
    let canvasData = await redis.get<string>(CANVAS_KEY);
    let buffer: Buffer;

    if (!canvasData) {
      buffer = Buffer.alloc(125000, 0); // Empty white canvas
    } else {
      buffer = Buffer.from(canvasData, 'base64');
    }

    // Calculate position and get previous color
    const pixelIndex = y * CANVAS_WIDTH + x;
    const byteOffset = Math.floor(pixelIndex / 2);
    const isHighNibble = pixelIndex % 2 === 0;

    const currentByte = buffer[byteOffset] || 0;
    const previousColor = isHighNibble ? (currentByte >> 4) & 0x0f : currentByte & 0x0f;

    // Set new color
    let newByte: number;
    if (isHighNibble) {
      newByte = (color << 4) | (currentByte & 0x0f);
    } else {
      newByte = (currentByte & 0xf0) | color;
    }
    buffer[byteOffset] = newByte;

    const timestamp = new Date().toISOString();

    // Update Redis (canvas + version + cooldown)
    await Promise.all([
      redis.set(CANVAS_KEY, buffer.toString('base64')),
      redis.incr(CANVAS_VERSION_KEY),
      redis.set(cooldownKey, '1', { ex: COOLDOWN_SECONDS }),
    ]);

    // Record in Supabase (async, don't block response)
    supabase
      .from('pixel_history')
      .insert({
        agent_id: agent.id,
        x,
        y,
        color,
        previous_color: previousColor,
        placed_at: timestamp,
      })
      .then(() => {
        // Update agent stats
        return supabase.rpc('increment_agent_pixels', { agent_uuid: agent.id });
      })
      .catch((err) => {
        console.error('Failed to record pixel history:', err);
      });

    // TODO: Publish to Redis pub/sub for WebSocket observers
    // await redis.publish('aip:pubsub:pixels', JSON.stringify({ x, y, color, agent_name: agent.name, timestamp }));

    return NextResponse.json(
      {
        success: true,
        data: {
          x,
          y,
          color,
          agent_name: agent.name,
          timestamp,
        },
        retry_after_seconds: COOLDOWN_SECONDS,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Place pixel error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to place pixel',
        },
      },
      { status: 500 }
    );
  }
}
