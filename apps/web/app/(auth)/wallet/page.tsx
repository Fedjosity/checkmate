"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { BuyCrownsPanel } from "@/components/wallet/BuyCrownsPanel";
import { TransactionsList } from "@/components/wallet/TransactionsList";
import { WithdrawModal } from "@/components/wallet/WithdrawModal";
import { toast } from "sonner";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CallMadeIcon from "@mui/icons-material/CallMade";
import Image from "next/image";

export default function WalletPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, formattedBalance, availableUSD } = useWallet();

  const [activeTab, setActiveTab] = useState<"buy" | "history">("buy");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  
  const hasHandledParams = useRef(false);

  useEffect(() => {
    if (hasHandledParams.current) return;

    // Handle redirect actions
    const depositStatus = searchParams.get("deposit");
    if (depositStatus === "complete") {
      hasHandledParams.current = true;
      toast.success("Deposit successful! Your Crowns are being credited.");
      router.replace("/wallet");
    } else if (depositStatus === "failed") {
      hasHandledParams.current = true;
      toast.error("Deposit failed or was cancelled.");
      router.replace("/wallet");
    }

    const action = searchParams.get("action");
    if (action === "withdraw") {
      hasHandledParams.current = true;
      setIsWithdrawModalOpen(true);
      // Clean up URL so refresh doesn't reopen modal
      router.replace("/wallet");
    } else if (action === "deposit") {
      hasHandledParams.current = true;
      setActiveTab("buy");
      router.replace("/wallet");
    }
  }, [searchParams, router]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
          Wallet
        </h1>
        <p className="text-muted mt-2 flex items-center gap-2">
          Manage your CheckMate Crowns{" "}
          <Image
            src="/Crown Coin Logo Official.png"
            alt="Crown"
            width={16}
            height={16}
          />
        </p>
      </div>

      {/* Hero Balance Card */}
      <Card variant="hud" padding="lg" className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px] pointer-events-none rounded-full" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shadow-[0_0_30px_rgba(201,168,76,0.15)]">
              <AccountBalanceWalletIcon fontSize="large" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted uppercase tracking-widest mb-1">
                Available Balance
              </p>
              {isLoading ? (
                <Skeleton className="h-10 w-48" />
              ) : (
                <div className="flex items-baseline gap-3">
                  <span className="flex items-center gap-3 text-4xl md:text-5xl font-bold text-white font-stats-mono drop-shadow-[0_2px_15px_rgba(255,255,255,0.1)]">
                    <Image
                      src="/Crown Coin Logo Official.png"
                      alt="Crowns"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                    {formattedBalance}
                  </span>
                </div>
              )}
              {!isLoading && (
                <p className="text-sm text-muted mt-2 font-stats-mono">
                  ≈ ${availableUSD.toFixed(2)} USD
                </p>
              )}
            </div>
          </div>

          <div className="w-full md:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full md:w-auto uppercase tracking-widest text-xs"
              onClick={() => setIsWithdrawModalOpen(true)}
            >
              <CallMadeIcon fontSize="small" className="mr-2" />
              Withdraw Earnings
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs Layout */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {/* Tabs Header */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("buy")}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${
              activeTab === "buy"
                ? "bg-gold/5 text-gold border-b-2 border-gold"
                : "text-muted hover:text-white hover:bg-surface-bright"
            }`}
          >
            Buy Crowns
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${
              activeTab === "history"
                ? "bg-gold/5 text-gold border-b-2 border-gold"
                : "text-muted hover:text-white hover:bg-surface-bright"
            }`}
          >
            Transaction History
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8 min-h-[400px]">
          {activeTab === "buy" ? <BuyCrownsPanel /> : <TransactionsList />}
        </div>
      </div>

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
      />
    </div>
  );
}
