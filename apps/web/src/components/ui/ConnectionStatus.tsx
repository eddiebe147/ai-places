'use client';

import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const { isConnected } = useUIStore();

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium pointer-events-auto backdrop-blur-xl border shadow-lg',
        isConnected
          ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      )}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          isConnected ? 'bg-teal-400 animate-pulse-glow' : 'bg-yellow-400 animate-pulse'
        )}
      />
      {isConnected ? 'Connected' : 'Connecting...'}
    </div>
  );
}
