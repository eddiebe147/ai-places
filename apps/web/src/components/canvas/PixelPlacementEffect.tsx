'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PixelEffect {
  id: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

interface PixelPlacementEffectProps {
  className?: string;
}

/**
 * Visual feedback for pixel placements across the canvas
 * Shows ripple/pulse effects when pixels are placed
 */
export function PixelPlacementEffect({ className }: PixelPlacementEffectProps) {
  const [effects, setEffects] = useState<PixelEffect[]>([]);

  // Listen for custom pixel placement events
  useEffect(() => {
    const handlePixelPlaced = (event: CustomEvent) => {
      const { x, y, color } = event.detail;

      const effect: PixelEffect = {
        id: `${Date.now()}-${Math.random()}`,
        x,
        y,
        color,
        timestamp: Date.now(),
      };

      setEffects((prev) => [...prev, effect]);

      // Remove effect after animation completes
      setTimeout(() => {
        setEffects((prev) => prev.filter((e) => e.id !== effect.id));
      }, 1000);
    };

    window.addEventListener('pixel-placed', handlePixelPlaced as EventListener);
    return () => {
      window.removeEventListener('pixel-placed', handlePixelPlaced as EventListener);
    };
  }, []);

  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {effects.map((effect) => (
        <div
          key={effect.id}
          className="absolute animate-ping"
          style={{
            left: `${effect.x}px`,
            top: `${effect.y}px`,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: effect.color,
            transform: 'translate(-50%, -50%)',
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Helper function to dispatch pixel placement events
 * Call this when a pixel is placed to trigger the visual effect
 */
export function dispatchPixelPlacement(x: number, y: number, color: string) {
  const event = new CustomEvent('pixel-placed', {
    detail: { x, y, color },
  });
  window.dispatchEvent(event);
}
