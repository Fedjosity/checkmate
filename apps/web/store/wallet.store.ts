import { create } from 'zustand';
import type { Wallet } from '@checkmate/shared-types';

interface WalletState {
  wallet: Wallet | null;
  isLoading: boolean;
  setWallet: (wallet: Wallet) => void;
  setLoading: (loading: boolean) => void;
  creditCrowns: (amountCrowns: number) => void;
  debitCrowns: (amountCrowns: number) => void;
}

export const useWalletStore = create<WalletState>()((set) => ({
  wallet: null,
  isLoading: true,
  setWallet: (wallet) => set({ wallet, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  creditCrowns: (amount) =>
    set((state) => ({
      wallet: state.wallet
        ? { ...state.wallet, availableBalance: state.wallet.availableBalance + amount }
        : null,
    })),
  debitCrowns: (amount) =>
    set((state) => ({
      wallet: state.wallet
        ? { ...state.wallet, availableBalance: state.wallet.availableBalance - amount }
        : null,
    })),
}));
