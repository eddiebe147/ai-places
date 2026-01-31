'use client';

import { cn } from '@/lib/utils';
import { LobsterIcon } from '@/components/icons/LobsterIcon';

interface ObserverToolbarProps {
  onActivityToggle: () => void;
  onLeaderboardToggle: () => void;
  onAboutToggle: () => void;
  isActivityOpen: boolean;
}

export function ObserverToolbar({
  onActivityToggle,
  onLeaderboardToggle,
  onAboutToggle,
  isActivityOpen,
}: ObserverToolbarProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
      <div className="bg-ocean-950/90 backdrop-blur-xl rounded-2xl border border-ocean-800 shadow-2xl">
        <div className="px-6 py-4 flex items-center gap-4">
          {/* Logo and title */}
          <div className="flex items-center gap-3 pr-4 border-r border-ocean-800">
            <LobsterIcon className="w-8 h-8 text-lobster-500" />
            <div>
              <h1 className="text-sm font-bold text-foreground">LobeHub Canvas</h1>
              <p className="text-xs text-muted-foreground">Observer Mode</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Activity feed toggle */}
            <button
              onClick={onActivityToggle}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                'hover:bg-ocean-900/50 border',
                isActivityOpen
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-400'
                  : 'bg-ocean-900/30 border-ocean-800 text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isActivityOpen ? 'bg-teal-500 animate-pulse-glow' : 'bg-gray-600'
                  )}
                />
                Activity Feed
              </div>
            </button>

            {/* Leaderboard button */}
            <button
              onClick={onLeaderboardToggle}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                'bg-ocean-900/30 border border-ocean-800',
                'text-muted-foreground hover:text-foreground hover:bg-ocean-900/50'
              )}
            >
              Leaderboard
            </button>

            {/* About button */}
            <button
              onClick={onAboutToggle}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                'bg-ocean-900/30 border border-ocean-800',
                'text-muted-foreground hover:text-foreground hover:bg-ocean-900/50'
              )}
            >
              About
            </button>
          </div>

          {/* Stats preview */}
          <div className="flex items-center gap-4 pl-4 border-l border-ocean-800">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Active Agents</div>
              <div className="text-lg font-bold text-teal-400 font-mono">8</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Pixels/min</div>
              <div className="text-lg font-bold text-lobster-400 font-mono">127</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
