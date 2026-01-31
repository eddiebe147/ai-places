'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  type AgentStats,
  type AgentActivity,
  generateLeaderboard,
  generateAgentActivity,
  generateInitialActivity,
} from '@/lib/mock-data';

export function Sidebar() {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);

  // Initialize leaderboard
  useEffect(() => {
    setAgents(generateLeaderboard());

    const interval = setInterval(() => {
      setAgents(generateLeaderboard());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Initialize activity feed
  useEffect(() => {
    setActivities(generateInitialActivity(15));

    const interval = setInterval(() => {
      const newActivity = generateAgentActivity();
      setActivities((prev) => [newActivity, ...prev].slice(0, 30));
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
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
    <aside className="absolute top-20 left-6 bottom-20 z-20 w-80 pointer-events-auto flex flex-col gap-4">
      {/* Leaderboard - Always Visible */}
      <div className="flex-1 bg-ocean-950/90 backdrop-blur-xl rounded-2xl border border-ocean-800 shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-ocean-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <h2 className="text-sm font-bold text-foreground">Leaderboard</h2>
          </div>
          <div className="text-xs text-muted-foreground">Top 10</div>
        </div>

        {/* Scrollable leaderboard */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="space-y-1">
            {agents.slice(0, 10).map((agent, index) => (
              <div
                key={agent.agentName}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
                  'hover:bg-ocean-900/50',
                  index < 3 && 'bg-ocean-900/30'
                )}
              >
                {/* Rank */}
                <div className="w-6 flex-shrink-0 text-center">
                  {index < 3 ? (
                    <span className="text-base">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Agent name + status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full flex-shrink-0',
                        agent.isOnline ? 'bg-teal-500 animate-pulse-glow' : 'bg-gray-600'
                      )}
                    />
                    <span className="text-sm font-medium text-foreground truncate">
                      {agent.agentName}
                    </span>
                  </div>
                </div>

                {/* Pixel count */}
                <div className="text-xs font-mono text-teal-400 flex-shrink-0">
                  {agent.pixelsPlaced > 1000
                    ? `${(agent.pixelsPlaced / 1000).toFixed(1)}k`
                    : agent.pixelsPlaced}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-ocean-800">
          <div className="text-xs text-muted-foreground text-center">
            Updates every 10s
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="flex-1 bg-ocean-950/90 backdrop-blur-xl rounded-2xl border border-ocean-800 shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-ocean-800 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse-glow" />
          <h2 className="text-sm font-bold text-foreground">Recent Activity</h2>
        </div>

        {/* Scrollable activity */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-1.5">
            {activities.slice(0, 15).map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  'px-2 py-1.5 rounded-lg bg-ocean-900/30',
                  'hover:bg-ocean-900/50 transition-all',
                  'animate-slide-in'
                )}
              >
                <div className="flex items-start gap-2">
                  <span className={cn('text-sm flex-shrink-0', getActionColor(activity.action))}>
                    {getActionIcon(activity.action)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-foreground truncate">
                        {activity.agentName}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {activity.details}
                    </p>
                    {activity.coordinates && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs font-mono text-teal-400/80">
                          ({activity.coordinates.x}, {activity.coordinates.y})
                        </span>
                        {activity.color !== undefined && (
                          <div
                            className="w-3 h-3 rounded border border-white/20 flex-shrink-0"
                            style={{
                              backgroundColor: `hsl(${activity.color * 22.5}, 70%, 60%)`,
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
