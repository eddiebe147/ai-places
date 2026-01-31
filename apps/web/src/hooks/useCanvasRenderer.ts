'use client';

import { useRef, useEffect, useCallback } from 'react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLOR_RGBA_LOOKUP,
} from '@aiplaces/shared';
import type { PixelUpdate } from '@aiplaces/shared';

const TOTAL_PIXELS = CANVAS_WIDTH * CANVAS_HEIGHT;

interface UseCanvasRendererOptions {
  onReady?: () => void;
}

/**
 * Hook for efficient canvas rendering using requestAnimationFrame
 */
export function useCanvasRenderer(options: UseCanvasRendererOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const data32Ref = useRef<Uint32Array | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isDirtyRef = useRef(false);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
    });

    if (!ctx) return;

    ctxRef.current = ctx;
    imageDataRef.current = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
    data32Ref.current = new Uint32Array(imageDataRef.current.data.buffer);

    // Fill with white (color index 0) initially
    const whiteRGBA = COLOR_RGBA_LOOKUP[0]; // White in ABGR format
    for (let i = 0; i < TOTAL_PIXELS; i++) {
      data32Ref.current[i] = whiteRGBA;
    }
    ctx.putImageData(imageDataRef.current, 0, 0);

    // Disable image smoothing for crisp pixels
    ctx.imageSmoothingEnabled = false;

    options.onReady?.();
  }, [options]);

  // Animation frame loop for batched rendering
  useEffect(() => {
    const render = () => {
      if (isDirtyRef.current && ctxRef.current && imageDataRef.current) {
        ctxRef.current.putImageData(imageDataRef.current, 0, 0);
        isDirtyRef.current = false;
      }
      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Render initial state from color indices
  const renderInitialState = useCallback((colorIndices: Uint8Array | ArrayLike<number>) => {
    if (!data32Ref.current) return;

    // Handle both Uint8Array and Immer proxied arrays
    for (let i = 0; i < TOTAL_PIXELS; i++) {
      const colorIndex = colorIndices[i] ?? 0;
      data32Ref.current[i] = COLOR_RGBA_LOOKUP[colorIndex] ?? COLOR_RGBA_LOOKUP[0];
    }
    isDirtyRef.current = true;
  }, []);

  // Queue single pixel update
  const queuePixelUpdate = useCallback((update: PixelUpdate) => {
    if (!data32Ref.current) return;

    const offset = update.y * CANVAS_WIDTH + update.x;
    if (offset >= 0 && offset < TOTAL_PIXELS) {
      data32Ref.current[offset] = COLOR_RGBA_LOOKUP[update.color];
      isDirtyRef.current = true;
    }
  }, []);

  // Queue batch of pixel updates
  const queueBatchUpdate = useCallback((updates: PixelUpdate[]) => {
    if (!data32Ref.current) return;

    for (const update of updates) {
      const offset = update.y * CANVAS_WIDTH + update.x;
      if (offset >= 0 && offset < TOTAL_PIXELS) {
        data32Ref.current[offset] = COLOR_RGBA_LOOKUP[update.color];
      }
    }
    isDirtyRef.current = true;
  }, []);

  return {
    canvasRef,
    renderInitialState,
    queuePixelUpdate,
    queueBatchUpdate,
  };
}
