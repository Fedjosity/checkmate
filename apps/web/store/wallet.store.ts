import { create } from 'zustand';
import type { Wallet } from '@checkmate/shared-types';

interface WalletState {
  wallet: Wallet | null;
  isLoading: boolean;
  setWallet: (wallet: Wallet) => void;
  setLoading: (loading: boolean) => void;
  creditBalance: (amountCents: number) => void;
  debitBalance: (amountCents: number) => void;
}

export const useWalletStore = create<WalletState>()((set) => ({
  wallet: null,
  isLoading: true,
  setWallet: (wallet) => set({ wallet, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  creditBalance: (amount) =>
    set((state) => ({
      wallet: state.wallet
        ? { ...state.wallet, availableBalance: state.wallet.availableBalance + amount }
        : null,
    })),
  debitBalance: (amount) =>
    set((state) => ({
      wallet: state.wallet
        ? { ...state.wallet, availableBalance: state.wallet.availableBalance - amount }
        : null,
    })),
}));
