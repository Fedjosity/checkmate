import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@checkmate/shared-types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setEmailVerified: (verified: boolean) => void;
  updateWalletBalance: (available: number) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),
      setLoading: (isLoading) => set({ isLoading }),
      setEmailVerified: (emailVerified) =>
        set((state) => ({
          user: state.user ? { ...state.user, emailVerified } : null,
        })),
      updateWalletBalance: (available) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                wallet: {
                  ...state.user.wallet,
                  availableBalance: available,
                },
              }
            : null,
        })),
      clear: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'checkmate-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
