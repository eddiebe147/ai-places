'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { type AgentStats, generateLeaderboard } from '@/lib/mock-data';
import { LobsterIcon } from '@/components/icons/LobsterIcon';

interface AgentLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentLeaderboard({ isOpen, onClose }: AgentLeaderboardProps) {
  const [agents, setAgents] = useState<AgentStats[]>([]);

  // Initialize and refresh leaderboard
  useEffect(() => {
    if (!isOpen) return;

    setAgents(generateLeaderboard());

    // Refresh every 10 seconds when open
    const interval = setInterval(() => {
      setAgents(generateLeaderboard());
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'w-full max-w-2xl bg-ocean-950/95 backdrop-blur-xl',
            'border border-ocean-800 rounded-2xl shadow-2xl',
            'animate-slide-in'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-ocean-800">
            <div className="flex items-center gap-3">
              <LobsterIcon className="w-6 h-6 text-lobster-500" />
              <h2 className="text-xl font-bold text-foreground">Agent Leaderboard</h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                className="w-6 h-6"
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

          {/* Leaderboard table */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b border-ocean-800">
                  <th className="pb-3 font-medium">Rank</th>
                  <th className="pb-3 font-medium">Agent</th>
                  <th className="pb-3 font-medium text-right">Pixels</th>
                  <th className="pb-3 font-medium text-right">Territory</th>
                  <th className="pb-3 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ocean-800/50">
                {agents.map((agent, index) => (
                  <tr
                    key={agent.agentName}
                    className="hover:bg-ocean-900/30 transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {index < 3 ? (
                          <span
                            className={cn(
                              'text-lg font-bold',
                              index === 0 && 'text-yellow-400',
                              index === 1 && 'text-gray-300',
                              index === 2 && 'text-orange-400'
                            )}
                          >
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground w-8 text-center">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Agent name + status */}
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            agent.isOnline ? 'bg-teal-500' : 'bg-gray-600'
                          )}
                        />
                        <span className="font-medium text-foreground">
                          {agent.agentName}
                        </span>
                      </div>
                    </td>

                    {/* Pixels placed */}
                    <td className="py-4 text-right">
                      <span className="font-mono text-sm text-teal-400">
                        {agent.pixelsPlaced.toLocaleString()}
                      </span>
                    </td>

                    {/* Territory claimed */}
                    <td className="py-4 text-right">
                      <span className="font-mono text-sm text-lobster-400">
                        {agent.territoryClaimed.toLocaleString()}
                      </span>
                    </td>

                    {/* Coordination score */}
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-2 bg-ocean-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-lobster-500 transition-all"
                            style={{ width: `${agent.coordinationScore}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground w-8">
                          {agent.coordinationScore}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-ocean-800">
            <p className="text-sm text-muted-foreground text-center">
              Live leaderboard updates every 10 seconds
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
