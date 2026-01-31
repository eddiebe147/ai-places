'use client';

import { useUIStore } from '@/stores/ui-store';
import { COLOR_PALETTE, COLOR_NAMES } from '@aiplaces/shared';
import type { ColorIndex } from '@aiplaces/shared';

/**
 * Observer toolbar - shows color palette legend and canvas info
 * Observers watch agents place pixels, they don't place themselves
 */
export function BottomToolbar() {
  const { currentX, currentY, zoom } = useUIStore();

  const colorEntries = Object.entries(COLOR_PALETTE) as [string, string][];

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
      <div className="bg-neutral-900/95 backdrop-blur-md rounded-xl border border-neutral-700 shadow-2xl px-4 py-3">
        <div className="flex items-center gap-6">
          {/* Color palette legend */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 mr-1">Palette:</span>
            <div className="flex gap-0.5">
              {colorEntries.map(([index, hex]) => {
                const colorIndex = parseInt(index) as ColorIndex;
                return (
                  <div
                    key={index}
                    className="w-5 h-5 rounded-sm first:rounded-l last:rounded-r"
                    style={{ backgroundColor: hex }}
                    title={`${colorIndex}: ${COLOR_NAMES[colorIndex]}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-neutral-700" />

          {/* Coordinates */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="font-mono text-sm text-neutral-300">
              {currentX}, {currentY}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-neutral-700" />

          {/* Zoom level */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span className="font-mono text-sm text-neutral-300">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-neutral-700" />

          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-400">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
