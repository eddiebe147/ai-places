'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

interface Objective {
  id: string;
  objectiveId: string;
  name: string;
  description: string;
  icon: string;
  isPrimary: boolean;
  bonusMultiplier: number;
  targetValue: number | null;
  progress: {
    currentValue: number;
    isCompleted: boolean;
    percentage: number | null;
  } | null;
}

interface WeeklyObjectivesProps {
  className?: string;
  compact?: boolean;
}

export function WeeklyObjectives({ className, compact = false }: WeeklyObjectivesProps) {
  const { user } = useAuthStore();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [weekNumber, setWeekNumber] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchObjectives() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (user?.userId) {
          params.set('userId', user.userId);
        }

        const response = await fetch(`/api/objectives?${params}`);
        if (!response.ok) throw new Error('Failed to fetch objectives');

        const data = await response.json();
        setObjectives(data.objectives);
        setWeekNumber(data.weekNumber);
      } catch (err) {
        setError('Failed to load objectives');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchObjectives();
  }, [user?.userId]);

  if (isLoading) {
    return (
      <div className={cn('p-4 bg-neutral-800/50 rounded-lg animate-pulse', className)}>
        <div className="h-4 bg-neutral-700 rounded w-1/2 mb-3" />
        <div className="h-16 bg-neutral-700 rounded" />
      </div>
    );
  }

  if (error || objectives.length === 0) {
    return null;
  }

  if (compact) {
    const primary = objectives.find((o) => o.isPrimary) || objectives[0];
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 bg-neutral-800/80 rounded-lg',
          className
        )}
      >
        <ObjectiveIcon icon={primary.icon} className="w-4 h-4 text-yellow-400" />
        <span className="text-xs text-neutral-300">{primary.name}</span>
        {primary.progress && (
          <span className="text-xs text-neutral-500">
            {primary.progress.percentage ?? primary.progress.currentValue}
            {primary.targetValue ? `/${primary.targetValue}` : ''}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('p-4 bg-neutral-800/50 rounded-lg', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Week {weekNumber} Objectives</h3>
        <span className="text-xs text-neutral-500">
          {objectives.filter((o) => o.progress?.isCompleted).length}/{objectives.length} complete
        </span>
      </div>

      <div className="space-y-3">
        {objectives.map((obj) => (
          <ObjectiveCard key={obj.id} objective={obj} />
        ))}
      </div>
    </div>
  );
}

function getObjectiveStyle(isCompleted: boolean, isPrimary: boolean) {
  if (isCompleted) {
    return {
      card: 'bg-green-500/10 border-green-500/30',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
    };
  }
  if (isPrimary) {
    return {
      card: 'bg-yellow-500/10 border-yellow-500/30',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
    };
  }
  return {
    card: 'bg-neutral-700/50 border-neutral-700',
    iconBg: 'bg-neutral-600',
    iconColor: 'text-neutral-400',
  };
}

function ObjectiveCard({ objective }: { objective: Objective }) {
  const isCompleted = objective.progress?.isCompleted ?? false;
  const style = getObjectiveStyle(isCompleted, objective.isPrimary);

  return (
    <div className={cn('p-3 rounded-lg border transition-colors', style.card)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
            style.iconBg
          )}
        >
          <ObjectiveIcon
            icon={isCompleted ? 'check' : objective.icon}
            className={cn('w-4 h-4', style.iconColor)}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white">{objective.name}</h4>
            {objective.isPrimary && !isCompleted && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 rounded">
                PRIMARY
              </span>
            )}
            {objective.bonusMultiplier > 1 && (
              <span className="text-[10px] text-purple-400">
                {objective.bonusMultiplier.toFixed(1)}x rep
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">{objective.description}</p>

          {/* Progress bar */}
          {objective.targetValue && objective.progress && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                <span>Progress</span>
                <span>
                  {objective.progress.currentValue}/{objective.targetValue}
                </span>
              </div>
              <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isCompleted ? 'bg-green-500' : 'bg-purple-500'
                  )}
                  style={{ width: `${objective.progress.percentage || 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ObjectiveIcon({ icon, className }: { icon: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    crown: (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M10 1l3 4 4-2-1 6H4L3 3l4 2 3-4z" />
        <path d="M4 13h12v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3z" />
      </svg>
    ),
    users: (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
      </svg>
    ),
    zap: (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
      </svg>
    ),
    star: (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
      </svg>
    ),
    shield: (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.75z" clipRule="evenodd" />
      </svg>
    ),
  };

  return icons[icon] || icons.star;
}
