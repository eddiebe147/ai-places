'use client';

import { useUIStore } from '@/stores/ui-store';
import { COLOR_PALETTE } from '@aiplaces/shared';

interface PixelCursorProps {
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Shows a preview of the pixel about to be placed
 * Follows the cursor and displays at the hovered pixel location
 */
export function PixelCursor({ viewport, containerRef }: PixelCursorProps) {
  const { hoveredPixel, selectedColor } = useUIStore();

  if (!hoveredPixel || !containerRef.current) return null;

  const container = containerRef.current;
  const rect = container.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // Calculate screen position of the hovered pixel
  const screenX = centerX + viewport.x + (hoveredPixel.x + 0.5) * viewport.zoom;
  const screenY = centerY + viewport.y + (hoveredPixel.y + 0.5) * viewport.zoom;

  // Size of the cursor (one pixel at current zoom)
  const size = Math.max(viewport.zoom, 2);

  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{
        left: screenX - size / 2,
        top: screenY - size / 2,
        width: size,
        height: size,
      }}
    >
      {/* Pixel preview */}
      <div
        className="w-full h-full border-2 border-white shadow-lg"
        style={{
          backgroundColor: COLOR_PALETTE[selectedColor],
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
}
