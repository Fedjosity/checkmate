"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { GameModeCard } from "@/components/matchmaking/GameModeCard";
import { GAME_MODES } from "@/lib/constants/gameModes";
import { toast } from "sonner";

type TimeControl = "bullet" | "blitz" | "rapid" | "classic";

const TIME_CONTROLS: { id: TimeControl; label: string; desc: string }[] = [
  { id: "bullet", label: "Bullet", desc: "1+0" },
  { id: "blitz", label: "Blitz", desc: "3+2" },
  { id: "rapid", label: "Rapid", desc: "10+0" },
  { id: "classic", label: "Classic", desc: "30+0" },
];

export default function PlayPage() {
  const { hasBalance } = useAuth();
  const [activeTab, setActiveTab] = useState<TimeControl>("blitz");

  const handleSelectMode = (modeKey: string, stake?: number) => {
    toast.success(`Joining ${modeKey} queue (${activeTab})`, {
      description: stake ? `Entry fee: $${(stake / 100).toFixed(2)}` : "Free entry",
    });
    // Further matchmaking logic goes here
  };

  return (
    <main className="max-w-6xl mx-auto py-8">
      <div className="mb-12">
        <h1 className="font-headline-lg text-headline-lg text-white mb-4">
          Choose Your Arena
        </h1>
        <p className="text-on-surface-variant max-w-2xl">
          Select a time control and game mode to start playing. Matchmaking is
          based on your ELO rating for the selected time format to ensure fair
          competition.
        </p>
      </div>

      {/* Time Control Tabs */}
      <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-border/50">
        {TIME_CONTROLS.map((tc) => (
          <button
            key={tc.id}
            onClick={() => setActiveTab(tc.id)}
            className={`px-6 py-3 rounded-t-lg font-label-caps transition-colors relative ${
              activeTab === tc.id
                ? "text-gold bg-gold/5"
                : "text-muted hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{tc.label}</span>
              <span className="font-stats-mono text-xs opacity-70 normal-case">
                {tc.desc}
              </span>
            </div>
            {activeTab === tc.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
            )}
          </button>
        ))}
      </div>

      {/* Game Mode Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <GameModeCard
          modeKey="friendly"
          hasBalance={hasBalance}
          onSelect={handleSelectMode}
        />
        <GameModeCard
          modeKey="competitive"
          hasBalance={hasBalance}
          onSelect={handleSelectMode}
        />
        <div className="xl:col-span-1 md:col-span-2 xl:mt-0 relative">
          {/* Highlight for the most popular paid mode */}
          <div className="absolute -inset-1 bg-gradient-to-b from-gold/20 to-transparent rounded-[20px] opacity-50 pointer-events-none" />
          <GameModeCard
            modeKey="paid"
            hasBalance={hasBalance}
            onSelect={handleSelectMode}
          />
        </div>
        <GameModeCard
          modeKey="tournament"
          hasBalance={hasBalance}
          onSelect={handleSelectMode}
        />
      </div>
    </main>
  );
}
