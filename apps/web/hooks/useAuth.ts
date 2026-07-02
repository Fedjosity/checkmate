import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const store = useAuthStore();
  return {
    user: store.user,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    isEmailVerified: store.user?.emailVerified ?? false,
    hasBalance: (store.user?.wallet.availableBalance ?? 0) > 0,
    availableBalance: store.user?.wallet.availableBalance ?? 0,
    setUser: store.setUser,
    setEmailVerified: store.setEmailVerified,
    updateWalletBalance: store.updateWalletBalance,
    clear: store.clear,
  };
}
