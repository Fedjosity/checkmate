"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { PlayHero } from "@/components/dashboard/PlayHero";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RatingWidget } from "@/components/dashboard/RatingWidget";
import { WalletWidget } from "@/components/dashboard/WalletWidget";
import { LiveWidget } from "@/components/dashboard/LiveWidget";

type TimeControl = "bullet" | "blitz" | "rapid" | "classic";

export default function DashboardPage() {
  useAuth();
  const { hasBalance } = useWallet();
  const [activeTimeControl, setActiveTimeControl] = useState<TimeControl>("blitz");
  const [selectedStake, setSelectedStake] = useState<number | "free">("free");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background ambient glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gold/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: The Arena (PlayHero) & Recent Activity */}
        <div className="flex-1 flex flex-col gap-6 order-1">
          <PlayHero
            activeTimeControl={activeTimeControl}
            onTimeControlChange={setActiveTimeControl}
            selectedStake={selectedStake}
            onStakeChange={setSelectedStake}
            hasBalance={hasBalance}
          />
          <RecentActivity />
        </div>

        {/* RIGHT COLUMN: HUD Widgets */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6 order-2 shrink-0">
          <RatingWidget />
          <WalletWidget />
          <LiveWidget />
        </div>

      </div>
    </div>
  );
}

