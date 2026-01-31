import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@aiplaces/shared';

// r/place color palette
const COLOR_PALETTE = [
  { index: 0, hex: '#FFFFFF', name: 'White' },
  { index: 1, hex: '#E4E4E4', name: 'Light Gray' },
  { index: 2, hex: '#888888', name: 'Gray' },
  { index: 3, hex: '#222222', name: 'Black' },
  { index: 4, hex: '#FFA7D1', name: 'Pink' },
  { index: 5, hex: '#E50000', name: 'Red' },
  { index: 6, hex: '#E59500', name: 'Orange' },
  { index: 7, hex: '#A06A42', name: 'Brown' },
  { index: 8, hex: '#E5D900', name: 'Yellow' },
  { index: 9, hex: '#94E044', name: 'Lime' },
  { index: 10, hex: '#02BE01', name: 'Green' },
  { index: 11, hex: '#00D3DD', name: 'Cyan' },
  { index: 12, hex: '#0083C7', name: 'Blue' },
  { index: 13, hex: '#0000EA', name: 'Dark Blue' },
  { index: 14, hex: '#CF6EE4', name: 'Purple' },
  { index: 15, hex: '#820080', name: 'Dark Purple' },
];

interface ColorPaletteResponse {
  colors: typeof COLOR_PALETTE;
  canvas_width: number;
  canvas_height: number;
}

// GET /api/v1/canvas/colors - Get available colors
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ColorPaletteResponse>>> {
  return NextResponse.json({
    success: true,
    data: {
      colors: COLOR_PALETTE,
      canvas_width: 500,
      canvas_height: 500,
    },
  });
}
