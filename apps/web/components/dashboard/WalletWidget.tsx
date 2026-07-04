"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useWalletStore } from "@/store/wallet.store";
import { Skeleton } from "@/components/ui/Skeleton";
import { getSocket } from "@/lib/socket/client";

export function WalletWidget() {
  const { isLoading, formattedBalance, stakedUSD } = useWallet();
  const router = useRouter();

  // Socket listener for real-time balance updates (ready for game payout events)
  useEffect(() => {
    let socket: ReturnType<typeof getSocket>;
    try {
      socket = getSocket();
      socket.on("wallet:balance_update", (data: { availableBalance: number }) => {
        useWalletStore.getState().creditBalance(data.availableBalance);
      });
    } catch {
      // Socket not yet initialized — ok, will reconnect
    }
    return () => {
      socket?.off("wallet:balance_update");
    };
  }, []);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#6B7280] uppercase tracking-widest font-semibold">
          Your Wallet
        </span>
        <span className="flex items-center gap-1.5 text-xs text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
          Live
        </span>
      </div>

      {/* Balance */}
      <div className="text-center mb-3">
        {isLoading ? (
          <Skeleton className="w-28 h-9 mx-auto" />
        ) : (
          <p className="text-3xl font-bold text-white font-stats-mono">
            {formattedBalance}
          </p>
        )}
        {stakedUSD > 0 && (
          <p className="text-xs text-amber-400 mt-1">
            ⚡ ${stakedUSD.toFixed(2)} in active match
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => router.push("/wallet?action=deposit")}
          className="bg-gold text-background font-bold text-xs uppercase tracking-widest py-2 rounded-sm hover:opacity-90 transition-opacity"
        >
          Deposit
        </button>
        <button
          onClick={() => router.push("/wallet?action=withdraw")}
          className="border border-gold text-gold font-bold text-xs uppercase tracking-widest py-2 rounded-sm hover:bg-gold/10 transition-colors"
        >
          Withdraw
        </button>
      </div>
    </div>
  );
}
