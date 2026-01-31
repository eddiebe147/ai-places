import { NextRequest, NextResponse } from 'next/server';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_PALETTE, COLOR_NAMES } from '@aiplaces/shared';
import type { ColorIndex } from '@aiplaces/shared';

/**
 * GET /api/v1/canvas/neighbors - Get neighboring pixels around a coordinate
 *
 * Useful for:
 * - Pattern matching and continuation
 * - Detecting edges and boundaries
 * - Strategic pixel placement decisions
 *
 * Query params:
 * - x: Center X coordinate (required)
 * - y: Center Y coordinate (required)
 * - radius: How many pixels around center (default 1, max 5)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const x = parseInt(searchParams.get('x') || '');
    const y = parseInt(searchParams.get('y') || '');
    const radius = Math.min(5, Math.max(1, parseInt(searchParams.get('radius') || '1')));

    if (isNaN(x) || isNaN(y)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_COORDINATES',
            message: 'Both x and y coordinates are required',
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
            message: `Coordinates must be within canvas bounds (0-${CANVAS_WIDTH - 1}, 0-${CANVAS_HEIGHT - 1})`,
          },
        },
        { status: 400 }
      );
    }

    // In production, fetch from Redis. For now, use demo data
    const fullCanvas = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
    fullCanvas.fill(0);

    // Add some demo patterns
    for (let py = 0; py < CANVAS_HEIGHT; py++) {
      for (let px = 0; px < CANVAS_WIDTH; px++) {
        if ((px + py) % 50 === 0) {
          fullCanvas[py * CANVAS_WIDTH + px] = (px + py) % 16;
        }
      }
    }

    // Get center pixel
    const centerColor = fullCanvas[y * CANVAS_WIDTH + x] as ColorIndex;

    // Get neighbors
    const neighbors: Array<{
      x: number;
      y: number;
      color: ColorIndex;
      hex: string;
      name: string;
      direction: string;
      distance: number;
    }> = [];

    const colorCounts: Record<number, number> = {};

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue; // Skip center

        const nx = x + dx;
        const ny = y + dy;

        // Check bounds
        if (nx < 0 || nx >= CANVAS_WIDTH || ny < 0 || ny >= CANVAS_HEIGHT) {
          continue;
        }

        const colorIndex = fullCanvas[ny * CANVAS_WIDTH + nx] as ColorIndex;
        colorCounts[colorIndex] = (colorCounts[colorIndex] || 0) + 1;

        // Determine direction
        let direction = '';
        if (dy < 0) direction += 'N';
        if (dy > 0) direction += 'S';
        if (dx < 0) direction += 'W';
        if (dx > 0) direction += 'E';
        if (!direction) direction = 'C';

        neighbors.push({
          x: nx,
          y: ny,
          color: colorIndex,
          hex: COLOR_PALETTE[colorIndex],
          name: COLOR_NAMES[colorIndex],
          direction,
          distance: Math.max(Math.abs(dx), Math.abs(dy)),
        });
      }
    }

    // Calculate patterns
    const uniqueColors = Object.keys(colorCounts).length;
    const dominantColor = Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)[0];

    const dominantColorIndex = dominantColor ? parseInt(dominantColor[0]) as ColorIndex : 0;

    // Check if center matches neighbors (for pattern detection)
    const matchesDominant = centerColor === dominantColorIndex;
    const isEdge = uniqueColors > 1;
    const isSolid = uniqueColors === 1;

    // Immediate neighbors (distance 1)
    const immediate = neighbors.filter((n) => n.distance === 1);

    return NextResponse.json({
      success: true,
      data: {
        center: {
          x,
          y,
          color: centerColor,
          hex: COLOR_PALETTE[centerColor],
          name: COLOR_NAMES[centerColor],
        },
        radius,
        neighbors,
        immediate: {
          count: immediate.length,
          pixels: immediate,
        },
        analysis: {
          uniqueColors,
          dominantColor: {
            color: dominantColorIndex,
            hex: COLOR_PALETTE[dominantColorIndex],
            name: COLOR_NAMES[dominantColorIndex],
            count: dominantColor ? dominantColor[1] : 0,
          },
          centerMatchesDominant: matchesDominant,
          isEdge,
          isSolid,
          colorDistribution: Object.entries(colorCounts).map(([index, count]) => ({
            color: parseInt(index) as ColorIndex,
            hex: COLOR_PALETTE[parseInt(index) as ColorIndex],
            name: COLOR_NAMES[parseInt(index) as ColorIndex],
            count,
            percentage: ((count / neighbors.length) * 100).toFixed(1),
          })),
        },
      },
    });
  } catch (error) {
    console.error('Canvas neighbors error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch neighbors' },
      },
      { status: 500 }
    );
  }
}
