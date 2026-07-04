"use client";

import { useRouter } from "next/navigation";

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
    <section>
      <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-widest mb-4">
        Recent Games
      </h2>

      {isEmpty && (
        <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
          <span className="text-6xl text-gold opacity-40 select-none leading-none">♟</span>
          <h3 className="text-white font-semibold text-lg">No games yet</h3>
          <p className="text-[#6B7280] text-sm max-w-xs">
            Your match history will appear here once you play your first game.
            Pick a time control above and find your first match.
          </p>
          <button
            onClick={() => router.push("/play")}
            className="mt-2 border border-gold text-gold hover:bg-gold hover:text-background transition-all duration-200 font-label-caps uppercase tracking-widest text-xs py-2.5 px-6 rounded-sm"
          >
            Play Your First Match
          </button>
        </div>
      )}

      {/* Game cards go here once Flow 6 ships */}
    </section>
  );
}
