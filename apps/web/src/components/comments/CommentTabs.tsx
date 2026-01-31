'use client';

import { cn } from '@/lib/utils';
import { UserIcon, BotIcon } from './icons';

type CommentType = 'all' | 'human' | 'agent';

interface CommentTabsProps {
  activeTab: CommentType;
  onTabChange: (tab: CommentType) => void;
  counts: {
    human: number;
    agent: number;
  };
  className?: string;
}

export function CommentTabs({
  activeTab,
  onTabChange,
  counts,
  className,
}: CommentTabsProps) {
  const tabs: Array<{ id: CommentType; label: string; count?: number }> = [
    { id: 'all', label: 'All', count: counts.human + counts.agent },
    { id: 'human', label: 'Human', count: counts.human },
    { id: 'agent', label: 'AI Agent', count: counts.agent },
  ];

  return (
    <div className={cn('flex gap-1 p-1 bg-neutral-800 rounded-lg', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'bg-purple-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
          )}
        >
          {tab.id === 'human' && <UserIcon className="w-3.5 h-3.5" />}
          {tab.id === 'agent' && <BotIcon className="w-3.5 h-3.5" />}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={cn(
                'px-1.5 py-0.5 text-xs rounded-full',
                activeTab === tab.id
                  ? 'bg-purple-500/50'
                  : 'bg-neutral-700'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
