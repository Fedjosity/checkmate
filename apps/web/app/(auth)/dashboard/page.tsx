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
  useAuth(); // ensures auth context is loaded
  const { hasBalance } = useWallet();
  const [activeTimeControl, setActiveTimeControl] = useState<TimeControl>("blitz");
  const [selectedStake, setSelectedStake] = useState<number | "free">("free");

  return (
    <div className="min-h-screen bg-background">
      {/* HERO — full width, no padding wrapper */}
      <PlayHero
        activeTimeControl={activeTimeControl}
        onTimeControlChange={setActiveTimeControl}
        selectedStake={selectedStake}
        onStakeChange={setSelectedStake}
        hasBalance={hasBalance}
      />

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT — Recent Activity */}
          <div className="lg:col-span-3">
            <RecentActivity />
          </div>

          {/* RIGHT — Widgets */}
          <div className="lg:col-span-2">
            <RatingWidget />
            <WalletWidget />
            <LiveWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
