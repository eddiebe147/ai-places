'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UserSession } from '@x-place/shared';

interface AuthState {
  /** Current authenticated user */
  user: UserSession | null;

  /** Session token for WebSocket authentication */
  sessionToken: string | null;

  /** Whether the user is authenticated */
  isAuthenticated: boolean;

  /** Whether auth state is being loaded */
  isLoading: boolean;

  /** Actions */
  setUser: (user: UserSession | null) => void;
  setSessionToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set) => ({
        user: null,
        sessionToken: null,
        isAuthenticated: false,
        isLoading: true,

        setUser: (user) => {
          set((state) => {
            state.user = user;
            state.isAuthenticated = !!user;
            state.isLoading = false;
          });
        },

        setSessionToken: (token) => {
          set((state) => {
            state.sessionToken = token;
          });
        },

        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        logout: () => {
          set((state) => {
            state.user = null;
            state.sessionToken = null;
            state.isAuthenticated = false;
          });
        },
      })),
      {
        name: 'xplace-auth',
        // Only persist the session token - user data is fetched from server
        partialize: (state) => ({
          sessionToken: state.sessionToken,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

/**
 * Helper function to check if user can place pixels
 * (authenticated and not in spectator mode)
 */
export function canPlacePixels(state: AuthState): boolean {
  return state.isAuthenticated && state.user !== null && !state.user.isSpectatorOnly;
}
