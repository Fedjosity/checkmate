"use client";

import { useRouter } from "next/navigation";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useMiniLeaderboard } from "@/hooks/useLeaderboard";
import { Skeleton } from "@/components/ui/Skeleton";

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
    <div className="bg-surface border border-border rounded-2xl p-5 mt-4">
      {/* Active Players */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse flex-shrink-0" />
        <span className="text-sm text-white">
          {activePlayers === null ? (
            <span className="text-[#6B7280]">— players competing now</span>
          ) : (
            <>
              <span className="font-bold font-stats-mono">{activePlayers}</span>
              <span className="text-[#6B7280]"> players competing now</span>
            </>
          )}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-border my-3" />

      {/* Mini Leaderboard Header */}
      <p className="text-xs text-[#6B7280] uppercase tracking-widest font-semibold mb-2">
        Top Players
      </p>

      {/* Players */}
      <div className="flex flex-col gap-0.5">
        {leaderboardQuery.isLoading
          ? [1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full h-7" />
            ))
          : players.slice(0, 3).map((player, idx) => (
              <div key={player.uid} className="flex items-center gap-2 py-1.5">
                {/* Rank */}
                <span className="text-xs text-[#6B7280] w-4 flex-shrink-0">
                  #{idx + 1}
                </span>

                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                <span className="text-sm text-white flex-1 truncate">
                  {player.displayName}
                </span>

                {/* ELO */}
                <span className="text-sm text-gold font-mono font-bold flex-shrink-0">
                  {player.elo?.blitz ?? 1200}
                </span>
              </div>
            ))}
      </div>

      {/* Full Leaderboard Link */}
      <div className="mt-2 text-right">
        <button
          onClick={() => router.push("/leaderboard")}
          className="text-xs text-gold hover:underline"
        >
          Full Leaderboard →
        </button>
      </div>
    </div>
  );
}
