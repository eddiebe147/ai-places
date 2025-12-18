'use client';

import { useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore, canPlacePixels } from '@/stores/auth-store';

/**
 * Hook for managing X OAuth authentication
 */
export function useAuth() {
  const {
    user,
    sessionToken,
    isAuthenticated,
    isLoading,
    setUser,
    setSessionToken,
    setLoading,
    logout: storeLogout,
  } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check for session token in cookie
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('xplace_session_token='))
        ?.split('=')[1];

      if (token) {
        setSessionToken(token);

        // Fetch user data from session API
        try {
          const res = await fetch('/api/auth/session');
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              console.log('[Auth] Session restored for:', data.user.xUsername);
            } else {
              setLoading(false);
            }
          } else {
            // Invalid session - clear it
            setSessionToken(null);
            setLoading(false);
          }
        } catch (error) {
          console.error('[Auth] Failed to fetch session:', error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, [setUser, setSessionToken, setLoading]);

  // Login with X (Twitter)
  const loginWithX = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[Auth] OAuth error:', error);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    // Sign out from Supabase
    const supabase = createClient();
    await supabase.auth.signOut();

    // Clear session token cookie
    document.cookie = 'xplace_session_token=; Max-Age=0; path=/';

    // Call logout API to clear Redis session
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('[Auth] Failed to logout from API:', error);
    }

    // Clear local state
    storeLogout();
    console.log('[Auth] User logged out');
  }, [storeLogout]);

  // Check if user can place pixels
  const userCanPlacePixels = canPlacePixels(useAuthStore.getState());

  return {
    user,
    sessionToken,
    isAuthenticated,
    isLoading,
    canPlacePixels: userCanPlacePixels,
    loginWithX,
    logout,
  };
}
