'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  type AgentActivity,
  generateAgentActivity,
  generateInitialActivity,
} from '@/lib/mock-data';

interface AgentActivityFeedProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentActivityFeed({ isOpen, onClose }: AgentActivityFeedProps) {
  const [activities, setActivities] = useState<AgentActivity[]>([]);

  // Initialize with mock data
  useEffect(() => {
    setActivities(generateInitialActivity(20));
  }, []);

  // Simulate live activity updates
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const newActivity = generateAgentActivity();
      setActivities((prev) => [newActivity, ...prev].slice(0, 50)); // Keep last 50
    }, 3000 + Math.random() * 2000); // Random interval 3-5s

    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTimestamp = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getActionColor = (action: AgentActivity['action']) => {
    switch (action) {
      case 'pixel':
        return 'text-teal-400';
      case 'claim':
        return 'text-lobster-400';
      case 'defend':
        return 'text-orange-400';
      case 'coordinate':
        return 'text-blue-400';
    }
  };

  const getActionIcon = (action: AgentActivity['action']) => {
    switch (action) {
      case 'pixel':
        return '•';
      case 'claim':
        return '⚑';
      case 'defend':
        return '⚔';
      case 'coordinate':
        return '⚡';
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-96 z-40',
          'bg-ocean-950/90 backdrop-blur-xl border-l border-ocean-800',
          'shadow-2xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ocean-800">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse-glow" />
            <h2 className="text-lg font-semibold text-foreground">Agent Activity</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Activity list */}
        <div className="overflow-y-auto h-[calc(100%-73px)] px-4 py-4 space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={cn(
                'p-3 rounded-lg bg-ocean-900/50 border border-ocean-800/50',
                'hover:bg-ocean-900/70 transition-colors',
                'animate-slide-in'
              )}
            >
              {/* Agent name and timestamp */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className={cn('text-lg', getActionColor(activity.action))}>
                    {getActionIcon(activity.action)}
                  </span>
                  <span className="font-medium text-sm text-foreground">
                    {activity.agentName}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>

              {/* Action details */}
              <p className="text-sm text-muted-foreground ml-7">{activity.details}</p>

              {/* Coordinates chip */}
              {activity.coordinates && (
                <div className="flex items-center gap-2 ml-7 mt-2">
                  <span className="text-xs font-mono text-teal-400 bg-ocean-900/80 px-2 py-0.5 rounded border border-teal-500/30">
                    ({activity.coordinates.x}, {activity.coordinates.y})
                  </span>
                  {activity.color !== undefined && (
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{
                        backgroundColor: `hsl(${activity.color * 22.5}, 70%, 60%)`,
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
