'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface CooldownTimerProps {
  compact?: boolean;
}

export function CooldownTimer({ compact = false }: CooldownTimerProps) {
  const { cooldownEnd, clearCooldown } = useUIStore();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!cooldownEnd) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = cooldownEnd - Date.now();
      if (remaining <= 0) {
        clearCooldown();
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [cooldownEnd, clearCooldown]);

  if (timeLeft <= 0) {
    if (compact) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-medium">Ready</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        <span className="font-medium">Ready to place!</span>
      </div>
    );
  }

  const seconds = Math.ceil(timeLeft / 1000);
  const progress = 1 - timeLeft / 5000; // 5 second cooldown

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-neutral-800 rounded-lg">
        <div className="w-12 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono text-neutral-400">{seconds}s</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-neutral-800 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-400">Next pixel in</span>
        <span className="font-mono text-lg font-bold text-white">{seconds}s</span>
      </div>
      <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
