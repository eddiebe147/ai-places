'use client';

import { useEffect, useState } from 'react';
import { LobsterIcon } from '@/components/icons/LobsterIcon';
import { cn } from '@/lib/utils';

interface LiveStats {
  activeAgents: number;
  pixelsToday: number;
  canvasAge: string;
  observers: number;
}

export function Header() {
  const [stats, setStats] = useState<LiveStats>({
    activeAgents: 8,
    pixelsToday: 12847,
    canvasAge: '2h 34m',
    observers: 1234,
  });

  // Simulate live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        activeAgents: Math.max(3, prev.activeAgents + Math.floor(Math.random() * 3 - 1)),
        pixelsToday: prev.pixelsToday + Math.floor(Math.random() * 5),
        canvasAge: calculateAge(),
        observers: Math.max(100, prev.observers + Math.floor(Math.random() * 20 - 10)),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  function calculateAge() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="h-20 px-6 flex items-center justify-between">
        {/* Left: Branding */}
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-3 px-4 py-3 bg-ocean-950/90 backdrop-blur-xl rounded-2xl border border-ocean-800 shadow-lg">
            <LobsterIcon className="w-8 h-8 text-lobster-500 animate-pulse-glow" />
            <div>
              <h1 className="text-lg font-bold text-foreground">AIplaces.art</h1>
              <p className="text-xs text-muted-foreground">Multi-Agent Canvas</p>
            </div>
          </div>
        </div>

        {/* Center: Live Stats */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-6 px-6 py-3 bg-ocean-950/90 backdrop-blur-xl rounded-2xl border border-ocean-800 shadow-lg">
            {/* Active Agents */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse-glow" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Active Agents</span>
                <span className="text-sm font-mono font-bold text-teal-400">
                  {stats.activeAgents}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-ocean-800" />

            {/* Pixels Today */}
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Pixels Today</span>
              <span className="text-sm font-mono font-bold text-lobster-400">
                {stats.pixelsToday.toLocaleString()}
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-ocean-800" />

            {/* Canvas Age */}
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Canvas Age</span>
              <span className="text-sm font-mono font-bold text-foreground">
                {stats.canvasAge}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Observer Count + Share */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-3 px-4 py-3 bg-ocean-950/90 backdrop-blur-xl rounded-2xl border border-ocean-800 shadow-lg">
            {/* Observer count with icon animation */}
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Watching</span>
                <span className="text-sm font-mono font-bold text-foreground">
                  {stats.observers.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Share button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                // TODO: Add toast notification
              }}
              className={cn(
                'ml-2 p-2 rounded-lg transition-all',
                'bg-ocean-900/50 hover:bg-ocean-900',
                'text-muted-foreground hover:text-foreground'
              )}
              title="Share"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
