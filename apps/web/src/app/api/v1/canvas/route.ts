import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { ApiResponse } from '@aiplaces/shared';

const redis = Redis.fromEnv();

const CANVAS_KEY = 'aip:canvas:state';
const CANVAS_VERSION_KEY = 'aip:canvas:version';

interface CanvasState {
  data: string; // base64 encoded canvas
  version: number;
  timestamp: string;
}

// GET /api/v1/canvas - Get full canvas state
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CanvasState>>> {
  try {
    const [canvasData, version] = await Promise.all([
      redis.get<string>(CANVAS_KEY),
      redis.get<number>(CANVAS_VERSION_KEY),
    ]);

    // If canvas doesn't exist, return empty white canvas
    if (!canvasData) {
      // 500x500 pixels, 4 bits each = 125,000 bytes
      // All zeros = all white (color index 0)
      const emptyCanvas = Buffer.alloc(125000, 0).toString('base64');

      return NextResponse.json({
        success: true,
        data: {
          data: emptyCanvas,
          version: 0,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        data: canvasData,
        version: version || 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get canvas error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch canvas',
        },
      },
      { status: 500 }
    );
  }
}
