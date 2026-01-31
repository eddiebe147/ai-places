'use client';

import { useEffect, useCallback } from 'react';
import {
  useWeekStore,
  formatCountdown,
  isResetUrgent,
  isResetCritical,
} from '@/stores/week-store';
import { cn } from '@/lib/utils';

interface WeekCountdownProps {
  className?: string;
}

export function WeekCountdown({ className }: WeekCountdownProps) {
  const {
    config,
    timeUntilReset,
    isLoaded,
    isResetting,
    error,
    lastResetStats,
    tick,
    fetchConfig,
    clearLastReset,
  } = useWeekStore();

  // Fetch config on mount
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Tick every second
  useEffect(() => {
    if (!config || isResetting) return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [config, isResetting, tick]);

  // Clear reset notification after 10 seconds
  useEffect(() => {
    if (lastResetStats) {
      const timeout = setTimeout(() => {
        clearLastReset();
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [lastResetStats, clearLastReset]);

  // Loading state
  if (!isLoaded) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 bg-neutral-800/80 rounded-lg',
          className
        )}
      >
        <div className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse" />
        <span className="text-xs text-neutral-500 font-mono">Loading...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-lg',
          className
        )}
      >
        <span className="text-xs text-red-400">Week sync error</span>
      </div>
    );
  }

  // Reset in progress
  if (isResetting) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-lg animate-pulse',
          className
        )}
      >
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-spin" />
        <span className="text-xs text-purple-300 font-medium">
          Canvas resetting...
        </span>
      </div>
    );
  }

  // Just reset notification
  if (lastResetStats) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg',
          className
        )}
      >
        <span className="text-xs text-green-400 font-medium">
          New week started!
        </span>
        <span className="text-xs text-green-300">
          {lastResetStats.totalPixelsPlaced.toLocaleString()} pixels archived
        </span>
      </div>
    );
  }

  if (!config) return null;

  const isUrgent = isResetUrgent(timeUntilReset);
  const isCritical = isResetCritical(timeUntilReset);

  // Derive urgency-based colors
  const urgencyColors = getUrgencyColors(isCritical, isUrgent);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
        urgencyColors.bg,
        className
      )}
    >
      <span className={cn('text-xs font-medium', urgencyColors.text)}>
        Week {config.weekNumber}
      </span>

      <span className="text-neutral-600">|</span>

      <div className="flex items-center gap-1.5">
        <ClockIcon className={cn('w-3.5 h-3.5', urgencyColors.icon)} />
        <span className={cn('text-xs font-mono font-medium', urgencyColors.countdown)}>
          {formatCountdown(timeUntilReset)}
        </span>
      </div>
    </div>
  );
}

interface UrgencyColors {
  bg: string;
  text: string;
  icon: string;
  countdown: string;
}

function getUrgencyColors(isCritical: boolean, isUrgent: boolean): UrgencyColors {
  if (isCritical) {
    return {
      bg: 'bg-red-500/20 animate-pulse',
      text: 'text-red-400',
      icon: 'text-red-400',
      countdown: 'text-red-300',
    };
  }
  if (isUrgent) {
    return {
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      icon: 'text-orange-400',
      countdown: 'text-orange-300',
    };
  }
  return {
    bg: 'bg-neutral-800/80',
    text: 'text-neutral-400',
    icon: 'text-neutral-500',
    countdown: 'text-neutral-300',
  };
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
        clipRule="evenodd"
      />
    </svg>
  );
}
