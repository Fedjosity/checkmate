"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useWalletStore } from "@/store/wallet.store";
import { Skeleton } from "@/components/ui/Skeleton";
import { getSocket } from "@/lib/socket/client";
import { Card } from "@/components/ui/Card";
import { Button } from "../ui/Button";

export function WalletWidget() {
  const { isLoading, formattedBalance, stakedUSD } = useWallet();
  const router = useRouter();

  // Socket listener for real-time balance updates (ready for game payout events)
  useEffect(() => {
    let socket: ReturnType<typeof getSocket>;
    try {
      socket = getSocket();
      socket.on(
        "wallet:balance_update",
        (data: { availableBalance: number }) => {
          useWalletStore.getState().creditBalance(data.availableBalance);
        },
      );
    } catch {
      // Socket not yet initialized — ok, will reconnect
    }
    return () => {
      socket?.off("wallet:balance_update");
    };
  }, []);

  return (
    <Card variant="hud" padding="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold text-[#6B7280] tracking-widest uppercase">
          Wallet
        </h3>
        <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-full border border-border/50">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-bold text-white uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>

      {/* Balances */}
      <div className="space-y-4">
        {/* Available */}
        <div>
          <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
            Available Funds
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-3xl font-bold text-white font-stats-mono drop-shadow-md">
              {formattedBalance}
            </p>
          )}
        </div>

        {/* Staked (only show if > 0) */}
        {!isLoading && stakedUSD > 0 && (
          <div className="flex justify-between items-center py-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <span className="text-xs text-amber-500 font-bold uppercase tracking-widest">
              In Match
            </span>
            <span className="text-sm font-bold text-amber-400 font-stats-mono">
              ${stakedUSD.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <Button
          onClick={() => router.push("/wallet?action=deposit")}
          className="bg-gold font-bold text-[11px] uppercase tracking-widest py-2.5 hover:bg-white transition-colors shadow-[0_0_15px_rgba(201,168,76,0.2)]"
        >
          Deposit
        </Button>
        <button
          onClick={() => router.push("/wallet?action=withdraw")}
          className="bg-background/50 border border-border/50 text-[#6B7280] font-bold text-[11px] uppercase tracking-widest py-2.5 rounded-lg hover:text-white hover:border-border transition-colors"
        >
          Withdraw
        </button>
      </div>
    </Card>
  );
}
