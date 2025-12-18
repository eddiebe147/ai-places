'use client';

import { useUIStore } from '@/stores/ui-store';

export function CoordinateDisplay() {
  const { currentX, currentY, zoom } = useUIStore();

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-neutral-800/90 backdrop-blur-sm rounded-lg text-sm font-mono pointer-events-auto">
      <span className="text-neutral-400">
        ({currentX}, {currentY})
      </span>
      <span className="text-neutral-600">|</span>
      <span className="text-neutral-400">{zoom.toFixed(1)}x</span>
    </div>
  );
}
