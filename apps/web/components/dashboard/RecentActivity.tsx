"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

// Future: import type { GameHistorySummary } from '@checkmate/shared-types';
interface GameHistorySummary {
  id: string;
}

interface Props {
  games?: GameHistorySummary[];
  isLoading?: boolean;
}

export function RecentActivity({ games, isLoading }: Props) {
  const router = useRouter();
  const isEmpty = !isLoading && (!games || games.length === 0);

  return (
    <Card variant="hud" padding="md">
      <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gold/50" />
          Recent Games
        </h2>
      </div>

      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <span className="text-5xl text-gold/30 select-none leading-none mb-4">♟</span>
          <h3 className="text-white font-bold mb-1">No games yet</h3>
          <p className="text-[#6B7280] text-sm max-w-sm mb-6">
            Your match history will appear here once you play your first game.
          </p>
          <button
            onClick={() => router.push("/play")}
            className="text-gold text-sm font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 group"
          >
            Play Now 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      )}

      {/* Game cards go here once Flow 6 ships */}
    </Card>
  );
}


