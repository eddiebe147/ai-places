'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, ZOOM } from '@aiplaces/shared';

interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
}

interface UsePanZoomOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  onCoordinateChange?: (x: number, y: number) => void;
}

/**
 * Convert screen coordinates to canvas coordinates
 */
function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: ViewportState,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  const canvasX = Math.floor((screenX - centerX - viewport.x) / viewport.zoom);
  const canvasY = Math.floor((screenY - centerY - viewport.y) / viewport.zoom);

  return {
    x: Math.max(0, Math.min(CANVAS_WIDTH - 1, canvasX)),
    y: Math.max(0, Math.min(CANVAS_HEIGHT - 1, canvasY)),
  };
}

/**
 * Hook for pan and zoom navigation
 */
export function usePanZoom({ containerRef, onCoordinateChange }: UsePanZoomOptions) {
  const [viewport, setViewport] = useState<ViewportState>({
    x: 0,
    y: 0,
    zoom: ZOOM.DEFAULT,
    targetX: 0,
    targetY: 0,
    targetZoom: ZOOM.DEFAULT,
  });

  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  // Smooth animation loop
  useEffect(() => {
    const animate = () => {
      setViewport((prev) => {
        const easing = 0.15;
        const dx = prev.targetX - prev.x;
        const dy = prev.targetY - prev.y;
        const dz = prev.targetZoom - prev.zoom;

        // Skip if close enough
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(dz) < 0.01) {
          return prev;
        }

        return {
          ...prev,
          x: prev.x + dx * easing,
          y: prev.y + dy * easing,
          zoom: prev.zoom + dz * easing,
        };
      });
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const pointX = e.clientX - rect.left;
      const pointY = e.clientY - rect.top;

      setViewport((prev) => {
        const zoomDelta = -e.deltaY * 0.002;
        const newZoom = Math.max(
          ZOOM.MIN,
          Math.min(ZOOM.MAX, prev.targetZoom * (1 + zoomDelta))
        );

        // Zoom centered on mouse position
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const relX = pointX - centerX;
        const relY = pointY - centerY;
        const scale = newZoom / prev.targetZoom;

        return {
          ...prev,
          targetX: prev.targetX * scale - relX * (scale - 1),
          targetY: prev.targetY * scale - relY * (scale - 1),
          targetZoom: newZoom,
        };
      });
    },
    [containerRef]
  );

  // Mouse drag pan
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      // Update coordinate display
      if (onCoordinateChange) {
        const coords = screenToCanvas(
          e.clientX - rect.left,
          e.clientY - rect.top,
          viewport,
          rect.width,
          rect.height
        );
        onCoordinateChange(coords.x, coords.y);
      }

      if (!isDraggingRef.current) return;

      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };

      setViewport((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
        targetX: prev.targetX + dx,
        targetY: prev.targetY + dy,
      }));
    },
    [viewport, containerRef, onCoordinateChange]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Center on coordinates
  const centerOn = useCallback(
    (canvasX: number, canvasY: number, zoom?: number) => {
      setViewport((prev) => {
        const targetZoom = zoom ?? prev.targetZoom;
        return {
          ...prev,
          targetX: -canvasX * targetZoom,
          targetY: -canvasY * targetZoom,
          targetZoom,
        };
      });
    },
    []
  );

  // Toggle zoom level (between overview and drawing zoom)
  const toggleZoom = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      targetZoom: prev.targetZoom < ZOOM.DRAW ? ZOOM.DRAW : ZOOM.DEFAULT,
    }));
  }, []);

  // Fit canvas to container on mount
  const fitToContainer = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const padding = 40; // pixels of padding around canvas
    const scaleX = (rect.width - padding) / CANVAS_WIDTH;
    const scaleY = (rect.height - padding) / CANVAS_HEIGHT;
    const fitZoom = Math.min(scaleX, scaleY, ZOOM.MAX);

    setViewport({
      x: 0,
      y: 0,
      zoom: Math.max(fitZoom, ZOOM.MIN),
      targetX: 0,
      targetY: 0,
      targetZoom: Math.max(fitZoom, ZOOM.MIN),
    });
  }, [containerRef]);

  // Get canvas coordinates from screen position
  const getCanvasCoords = useCallback(
    (screenX: number, screenY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };

      const rect = container.getBoundingClientRect();
      return screenToCanvas(
        screenX - rect.left,
        screenY - rect.top,
        viewport,
        rect.width,
        rect.height
      );
    },
    [viewport, containerRef]
  );

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Fit canvas to container on mount and resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial fit
    const initialFit = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const padding = 60;
        const scaleX = (rect.width - padding) / CANVAS_WIDTH;
        const scaleY = (rect.height - padding) / CANVAS_HEIGHT;
        const fitZoom = Math.min(scaleX, scaleY, ZOOM.MAX);
        const clampedZoom = Math.max(fitZoom, ZOOM.MIN);

        setViewport({
          x: 0,
          y: 0,
          zoom: clampedZoom,
          targetX: 0,
          targetY: 0,
          targetZoom: clampedZoom,
        });
      }
    };

    // Delay to ensure container is measured
    requestAnimationFrame(initialFit);

    // Handle resize
    const resizeObserver = new ResizeObserver(initialFit);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  return {
    viewport,
    centerOn,
    toggleZoom,
    fitToContainer,
    getCanvasCoords,
    isDragging: isDraggingRef.current,
  };
}
