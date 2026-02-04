'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type EventCounts = {
  pointerdown: number;
  pointermove: number;
  pointerup: number;
  touchstart: number;
  touchmove: number;
  touchend: number;
  wheel: number;
};

export default function GestureDebugPage() {
  const [counts, setCounts] = useState<EventCounts>({
    pointerdown: 0,
    pointermove: 0,
    pointerup: 0,
    touchstart: 0,
    touchmove: 0,
    touchend: 0,
    wheel: 0,
  });
  const [lastEvent, setLastEvent] = useState<string>('none');
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [activePointers, setActivePointers] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const userAgent = useMemo(() => {
    if (typeof navigator === 'undefined') return '';
    return navigator.userAgent;
  }, []);

  useEffect(() => {
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    const updatePos = (x: number, y: number) => setLastPos({ x, y });

    const onPointerDown = (e: PointerEvent) => {
      setCounts((prev) => ({ ...prev, pointerdown: prev.pointerdown + 1 }));
      setLastEvent(`pointerdown (${e.pointerType})`);
      updatePos(e.clientX, e.clientY);
      setActivePointers((prev) => prev + 1);
      if (area.setPointerCapture) {
        try { area.setPointerCapture(e.pointerId); } catch {}
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      setCounts((prev) => ({ ...prev, pointermove: prev.pointermove + 1 }));
      setLastEvent(`pointermove (${e.pointerType})`);
      updatePos(e.clientX, e.clientY);
    };
    const onPointerUp = (e: PointerEvent) => {
      setCounts((prev) => ({ ...prev, pointerup: prev.pointerup + 1 }));
      setLastEvent(`pointerup (${e.pointerType})`);
      updatePos(e.clientX, e.clientY);
      setActivePointers((prev) => Math.max(0, prev - 1));
      if (area.hasPointerCapture?.(e.pointerId)) {
        try { area.releasePointerCapture(e.pointerId); } catch {}
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      setCounts((prev) => ({ ...prev, touchstart: prev.touchstart + 1 }));
      setLastEvent('touchstart');
      if (e.touches[0]) updatePos(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      setCounts((prev) => ({ ...prev, touchmove: prev.touchmove + 1 }));
      setLastEvent('touchmove');
      if (e.touches[0]) updatePos(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      setCounts((prev) => ({ ...prev, touchend: prev.touchend + 1 }));
      setLastEvent('touchend');
      if (e.changedTouches[0]) updatePos(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    };

    const onWheel = (e: WheelEvent) => {
      setCounts((prev) => ({ ...prev, wheel: prev.wheel + 1 }));
      setLastEvent('wheel');
      updatePos(e.clientX, e.clientY);
    };

    area.addEventListener('pointerdown', onPointerDown, { passive: false });
    area.addEventListener('pointermove', onPointerMove, { passive: false });
    area.addEventListener('pointerup', onPointerUp, { passive: false });
    area.addEventListener('pointercancel', onPointerUp, { passive: false });

    area.addEventListener('touchstart', onTouchStart, { passive: false });
    area.addEventListener('touchmove', onTouchMove, { passive: false });
    area.addEventListener('touchend', onTouchEnd, { passive: false });
    area.addEventListener('touchcancel', onTouchEnd, { passive: false });

    area.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      area.removeEventListener('pointerdown', onPointerDown);
      area.removeEventListener('pointermove', onPointerMove);
      area.removeEventListener('pointerup', onPointerUp);
      area.removeEventListener('pointercancel', onPointerUp);
      area.removeEventListener('touchstart', onTouchStart);
      area.removeEventListener('touchmove', onTouchMove);
      area.removeEventListener('touchend', onTouchEnd);
      area.removeEventListener('touchcancel', onTouchEnd);
      area.removeEventListener('wheel', onWheel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-lg font-semibold">Gesture Debug</h1>
        <p className="text-sm text-neutral-400">
          This page shows whether pointer/touch events are firing on iOS. Drag inside the box.
        </p>
        <div className="text-xs text-neutral-500 break-words">{userAgent}</div>

        <div
          ref={areaRef}
          className="h-[55vh] w-full rounded-xl border border-white/10 bg-neutral-900 flex items-center justify-center"
          style={{ touchAction: 'none' }}
        >
          <span className="text-sm text-neutral-400">Touch and drag here</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-white/10 p-3">
            <div className="text-neutral-500">Last event</div>
            <div className="font-mono">{lastEvent}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <div className="text-neutral-500">Last position</div>
            <div className="font-mono">
              {lastPos ? `${Math.round(lastPos.x)}, ${Math.round(lastPos.y)}` : '—'}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <div className="text-neutral-500">Active pointers</div>
            <div className="font-mono">{activePointers}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <div className="text-neutral-500">Counts</div>
            <div className="font-mono text-xs leading-5">
              pointerdown: {counts.pointerdown}
              <br />
              pointermove: {counts.pointermove}
              <br />
              pointerup: {counts.pointerup}
              <br />
              touchstart: {counts.touchstart}
              <br />
              touchmove: {counts.touchmove}
              <br />
              touchend: {counts.touchend}
              <br />
              wheel: {counts.wheel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
