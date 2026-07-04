"use client";

import { useRouter } from "next/navigation";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useMiniLeaderboard } from "@/hooks/useLeaderboard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";

export function LiveWidget() {
  const router = useRouter();
  const statsQuery = usePlatformStats();
  const leaderboardQuery = useMiniLeaderboard();

  // Safely extract data through apiClient response shape
  const stats = (statsQuery.data as any)?.data ?? (statsQuery.data as any);
  const activePlayers: number | null =
    statsQuery.isLoading ? null : (stats?.activePlayers ?? 0);

  const leaderboardData = (leaderboardQuery.data as any)?.data ?? (leaderboardQuery.data as any);
  const players: any[] = leaderboardData?.players ?? [];

  return (
    <Card variant="hud" padding="md">
      {/* Active Players */}
      <div className="flex items-center gap-3 bg-background/40 p-3 rounded-lg border border-border/50 mb-4">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse flex-shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
        <span className="text-sm text-white">
          {activePlayers === null ? (
            <span className="text-[#6B7280]">— players online</span>
          ) : (
            <>
              <span className="font-bold font-stats-mono text-lg">{activePlayers}</span>
              <span className="text-[#6B7280] ml-1 uppercase tracking-widest text-[10px]">online</span>
            </>
          )}
        </span>
      </div>

      {/* Mini Leaderboard Header */}
      <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
        <p className="text-[10px] text-gold uppercase tracking-widest font-bold">
          Top Blitz Players
        </p>
      </div>

      {/* Players */}
      <div className="flex flex-col gap-1">
        {leaderboardQuery.isLoading
          ? [1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full h-10 rounded-md" />
            ))
          : players.slice(0, 3).map((player, idx) => (
              <div key={player.uid} className="flex items-center gap-3 py-2 px-2 hover:bg-background/40 rounded-lg transition-colors cursor-default">
                {/* Rank */}
                <span className="text-xs font-stats-mono text-[#6B7280] w-3 flex-shrink-0">
                  {idx + 1}
                </span>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-background border border-border/50 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                  {player.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={player.avatarUrl}
                      alt={player.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gold font-bold">
                      {player.displayName?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>

                {/* Name */}
                <span className="text-sm font-semibold text-white flex-1 truncate">
                  {player.displayName}
                </span>

                {/* ELO */}
                <span className="text-sm text-gold font-stats-mono font-bold flex-shrink-0 drop-shadow-md">
                  {player.elo?.blitz ?? 1200}
                </span>
              </div>
            ))}
      </div>

      {/* Full Leaderboard Link */}
      <div className="mt-5 text-center">
        <button
          onClick={() => router.push("/leaderboard")}
          className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest hover:text-gold transition-colors"
        >
          Leaderboard →
        </button>
      </div>
    </Card>
  );
}


