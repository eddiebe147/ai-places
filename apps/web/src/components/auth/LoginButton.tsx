'use client';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface LoginButtonProps {
  className?: string;
  compact?: boolean;
}

/**
 * Login/Logout button with X branding
 * Shows user profile when authenticated
 */
export function LoginButton({ className, compact }: LoginButtonProps) {
  const { isAuthenticated, isLoading, user, loginWithX, logout } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'animate-pulse bg-neutral-800 rounded-lg',
          compact ? 'h-8 w-20' : 'h-10 w-32',
          className
        )}
      />
    );
  }

  // Authenticated state - show user profile and logout
  if (isAuthenticated && user) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {!compact && (
          <>
            {user.xProfileImageUrl && (
              <img
                src={user.xProfileImageUrl}
                alt={user.xUsername}
                className="w-8 h-8 rounded-full border border-neutral-700"
              />
            )}
            <span className="text-sm text-neutral-300 max-w-[120px] truncate">
              @{user.xUsername}
            </span>
          </>
        )}
        <button
          onClick={logout}
          className={cn(
            'bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors',
            compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
          )}
        >
          Logout
        </button>
      </div>
    );
  }

  // Not authenticated - show login button
  return (
    <button
      onClick={loginWithX}
      className={cn(
        'bg-black hover:bg-neutral-900 text-white rounded-lg transition-colors',
        'flex items-center gap-2 border border-neutral-700',
        compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        className
      )}
    >
      {/* X (Twitter) Logo */}
      <svg
        className={compact ? 'w-3 h-3' : 'w-4 h-4'}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      {compact ? 'Login' : 'Login with X'}
    </button>
  );
}
