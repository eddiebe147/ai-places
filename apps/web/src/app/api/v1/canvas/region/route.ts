import { NextRequest, NextResponse } from 'next/server';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_PALETTE, COLOR_NAMES } from '@aiplaces/shared';
import type { ColorIndex } from '@aiplaces/shared';

/**
 * GET /api/v1/canvas/region - Get a specific region of the canvas
 *
 * Useful for:
 * - Agents focusing on a specific area
 * - Reducing data transfer for targeted analysis
 * - Pattern matching in specific regions
 *
 * Query params:
 * - x: Starting X coordinate (required)
 * - y: Starting Y coordinate (required)
 * - width: Region width (default 50, max 100)
 * - height: Region height (default 50, max 100)
 * - format: 'detailed' | 'compact' (default 'detailed')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const x = parseInt(searchParams.get('x') || '0');
    const y = parseInt(searchParams.get('y') || '0');
    const width = Math.min(100, Math.max(1, parseInt(searchParams.get('width') || '50')));
    const height = Math.min(100, Math.max(1, parseInt(searchParams.get('height') || '50')));
    const format = searchParams.get('format') || 'detailed';

    // Validate coordinates
    if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_COORDINATES',
            message: `Coordinates must be within canvas bounds (0-${CANVAS_WIDTH - 1}, 0-${CANVAS_HEIGHT - 1})`,
          },
        },
        { status: 400 }
      );
    }

    // Clamp region to canvas bounds
    const endX = Math.min(x + width, CANVAS_WIDTH);
    const endY = Math.min(y + height, CANVAS_HEIGHT);
    const actualWidth = endX - x;
    const actualHeight = endY - y;

    // For now, create demo data (in production, fetch from Redis)
    const fullCanvas = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
    fullCanvas.fill(0); // White background

    // Add demo pixels (deterministic based on position for consistency)
    for (let py = 0; py < CANVAS_HEIGHT; py++) {
      for (let px = 0; px < CANVAS_WIDTH; px++) {
        // Create some patterns
        if ((px + py) % 50 === 0) {
          fullCanvas[py * CANVAS_WIDTH + px] = (px + py) % 16;
        }
      }
    }

    // Extract region
    const regionPixels: Array<{
      x: number;
      y: number;
      color: ColorIndex;
      hex: string;
      name: string;
    }> = [];

    const colorCounts: Record<number, number> = {};
    let compactGrid = '';

    for (let ry = 0; ry < actualHeight; ry++) {
      let row = '';
      for (let rx = 0; rx < actualWidth; rx++) {
        const px = x + rx;
        const py = y + ry;
        const colorIndex = fullCanvas[py * CANVAS_WIDTH + px] as ColorIndex;

        colorCounts[colorIndex] = (colorCounts[colorIndex] || 0) + 1;

        if (format === 'detailed') {
          regionPixels.push({
            x: px,
            y: py,
            color: colorIndex,
            hex: COLOR_PALETTE[colorIndex],
            name: COLOR_NAMES[colorIndex],
          });
        }

        // Compact format: hex digit per pixel
        row += colorIndex.toString(16);
      }
      compactGrid += row + '\n';
    }

    // Calculate dominant colors
    const dominantColors = Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([index, count]) => ({
        color: parseInt(index) as ColorIndex,
        hex: COLOR_PALETTE[parseInt(index) as ColorIndex],
        name: COLOR_NAMES[parseInt(index) as ColorIndex],
        count,
        percentage: ((count / (actualWidth * actualHeight)) * 100).toFixed(1),
      }));

    const response: any = {
      success: true,
      data: {
        region: {
          x,
          y,
          width: actualWidth,
          height: actualHeight,
        },
        totalPixels: actualWidth * actualHeight,
        dominantColors,
      },
    };

    if (format === 'detailed') {
      response.data.pixels = regionPixels;
    } else {
      response.data.grid = compactGrid.trim();
      response.data.gridFormat = 'Each character is a hex digit (0-f) representing color index';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Canvas region error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch region' },
      },
      { status: 500 }
    );
  }
}
