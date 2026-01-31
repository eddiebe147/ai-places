'use client';

import { useUIStore } from '@/stores/ui-store';

export function CoordinateDisplay() {
  const { currentX, currentY, zoom } = useUIStore();

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-ocean-950/90 backdrop-blur-xl rounded-lg border border-ocean-800 font-mono pointer-events-auto shadow-lg">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">XY</span>
        <span className="text-sm text-teal-400">
          ({currentX}, {currentY})
        </span>
      </div>
      <span className="text-ocean-700">|</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">ZOOM</span>
        <span className="text-sm text-teal-400">{zoom.toFixed(1)}x</span>
      </div>
    </div>
  );
}
