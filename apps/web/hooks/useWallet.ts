import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getBalance } from '@/lib/api/wallet';
import { useWalletStore } from '@/store/wallet.store';
import { useAuth } from './useAuth';

export function useWallet() {
  const { isAuthenticated } = useAuth();
  const { wallet, setWallet, setLoading } = useWalletStore();

  const query = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: getBalance,
    refetchInterval: 30_000,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) {
      // apiClient interceptor returns res.data, so the wallet is at .data.wallet
      const w = (query.data as any)?.data?.wallet ?? (query.data as any)?.wallet;
      if (w) setWallet(w);
    }
  }, [query.data, setWallet]);

  useEffect(() => {
    setLoading(query.isLoading);
  }, [query.isLoading, setLoading]);

  const availableUSD = (wallet?.availableBalance ?? 0) / 100;

  return {
    wallet,
    isLoading: query.isLoading,
    availableUSD,
    stakedUSD: (wallet?.stakedBalance ?? 0) / 100,
    bonusUSD: (wallet?.bonusBalance ?? 0) / 100,
    formattedBalance: `$${availableUSD.toFixed(2)}`,
    hasBalance: (wallet?.availableBalance ?? 0) > 0,
    refetch: query.refetch,
  };
}
