"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getLeaderboard, LeaderboardResponseData } from "@/lib/api/leaderboard";
import { useAuthStore } from "@/store/auth.store";
import { LeaderboardEntry, rpToRank } from "@checkmate/shared-types";
import { cn } from "@/lib/utils/cn";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import TimerIcon from "@mui/icons-material/Timer";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import PublicIcon from "@mui/icons-material/Public";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import PersonIcon from "@mui/icons-material/Person";

type TimeControl = "blitz" | "rapid" | "bullet" | "classic";

const TIME_CONTROLS = [
  { id: "blitz" as TimeControl, label: "Blitz", icon: FlashOnIcon, sub: "3m • 5m" },
  { id: "rapid" as TimeControl, label: "Rapid", icon: TimerIcon, sub: "10m • 15m" },
  { id: "bullet" as TimeControl, label: "Bullet", icon: TrackChangesIcon, sub: "1m • 2m" },
  { id: "classic" as TimeControl, label: "Classic", icon: SportsEsportsIcon, sub: "30m" },
];

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [selectedTc, setSelectedTc] = useState<TimeControl>("blitz");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [data, setData] = useState<LeaderboardResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchBoard() {
      setIsLoading(true);
      try {
        const res = await getLeaderboard({
          timeControl: selectedTc,
          country: countryFilter || undefined,
          limit: 50,
        });
        if (isMounted && res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchBoard();
    return () => {
      isMounted = false;
    };
  }, [selectedTc, countryFilter]);

  const players = data?.players || [];
  const top1 = players[0];
  const top2 = players[1];
  const top3 = players[2];
  const tablePlayers = players.slice(3);

  // User's own active stats for the sticky bar
  const userElo = (user?.elo as any)?.[selectedTc] || 1200;
  const userRP = (user?.elo as any)?.[`${selectedTc}RP`] || 0;
  const userStreak = (user?.elo as any)?.[`${selectedTc}Streak`] || 0;
  const userRankTier = rpToRank(userRP, false);

  return (
    <div className="min-h-screen bg-background text-white pb-28 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2 text-gold text-sm font-semibold tracking-wider uppercase mb-1">
            <EmojiEventsIcon fontSize="small" />
            Competitive Rankings
          </div>
          <h1 className="text-3xl sm:text-4xl font-headline font-bold text-white tracking-tight">
            Global Champions Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1 max-w-xl">
            Compete in rated wager matches, climb the Glicko-2 Elo leaderboards, and claim Crown glory.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Country Selector */}
          <div className="relative flex items-center">
            <PublicIcon className="absolute left-3 text-muted text-sm pointer-events-none" fontSize="small" />
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-surface border border-border/60 hover:border-gold/40 text-xs sm:text-sm text-white rounded-xl pl-9 pr-8 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-gold transition-colors"
            >
              <option value="">🌍 Global (All Countries)</option>
              <option value="US">🇺🇸 United States</option>
              <option value="GB">🇬🇧 United Kingdom</option>
              <option value="NG">🇳🇬 Nigeria</option>
              <option value="CA">🇨🇦 Canada</option>
              <option value="DE">🇩🇪 Germany</option>
              <option value="FR">🇫🇷 France</option>
              <option value="IN">🇮🇳 India</option>
            </select>
          </div>
        </div>
      </div>

      {/* Time Control Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-8">
        {TIME_CONTROLS.map((tc) => {
          const Icon = tc.icon;
          const isSelected = selectedTc === tc.id;
          return (
            <button
              key={tc.id}
              onClick={() => setSelectedTc(tc.id)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 text-left relative overflow-hidden group",
                isSelected
                  ? "bg-surface-light border-gold shadow-[0_0_20px_rgba(201,168,76,0.15)] ring-1 ring-gold/40"
                  : "bg-surface/60 border-border/50 hover:border-border hover:bg-surface-light/40"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  isSelected ? "bg-gold text-background font-bold shadow-md" : "bg-black/40 text-gold border border-border/40 group-hover:border-gold/30"
                )}
              >
                <Icon fontSize="small" />
              </div>
              <div>
                <span className={cn("block font-headline font-bold text-sm sm:text-base", isSelected ? "text-white" : "text-on-surface")}>
                  {tc.label}
                </span>
                <span className="block text-[11px] text-on-surface-variant font-mono">
                  {tc.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-64 bg-surface/40 rounded-3xl border border-border/40" />
          <div className="h-96 bg-surface/40 rounded-3xl border border-border/40" />
        </div>
      ) : players.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-surface/40 border border-border/40 space-y-3">
          <EmojiEventsIcon style={{ fontSize: "48px" }} className="text-muted/40" />
          <h3 className="text-lg font-headline font-bold text-white">No ranked players found</h3>
          <p className="text-sm text-on-surface-variant">Be the first to play rated matches in this category!</p>
          <Link href="/play" className="inline-block mt-4 px-6 py-2.5 bg-gold text-background font-bold rounded-xl hover:bg-gold-light transition-all">
            Play a Match
          </Link>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-end">
            {/* Rank 2 (Silver) */}
            {top2 && (
              <Link
                href={`/profile/${top2.uid}`}
                className="group relative flex flex-col items-center p-6 rounded-3xl border border-slate-400/30 bg-gradient-to-b from-slate-900/60 to-surface/80 hover:border-slate-300 hover:shadow-[0_0_25px_rgba(203,213,225,0.15)] transition-all order-2 md:order-1 hover:-translate-y-1"
              >
                <div className="absolute -top-3.5 px-3 py-1 bg-slate-300 text-slate-950 font-stats-mono font-bold text-xs rounded-full shadow-lg border border-slate-100 flex items-center gap-1">
                  🥈 #2 Rank
                </div>
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-xl bg-black/60 my-2">
                  <img
                    src={top2.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top2.uid}`}
                    alt={top2.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-headline font-bold text-lg text-white text-center mt-2 group-hover:text-gold transition-colors">
                  {top2.displayName}
                </h3>
                <span className="text-xs text-on-surface-variant mb-3">{top2.country || "Global"}</span>
                <div className="w-full pt-3 border-t border-border/40 flex items-center justify-between text-xs font-mono">
                  <span className="text-on-surface-variant">Rating</span>
                  <span className="text-white font-bold font-stats-mono text-base">
                    {(top2.elo as any)?.[selectedTc] || 1200}
                  </span>
                </div>
              </Link>
            )}

            {/* Rank 1 (Gold / Crown) */}
            {top1 && (
              <Link
                href={`/profile/${top1.uid}`}
                className="group relative flex flex-col items-center p-8 rounded-3xl border-2 border-gold bg-gradient-to-b from-gold/15 via-surface/90 to-surface shadow-[0_0_35px_rgba(201,168,76,0.2)] hover:shadow-[0_0_45px_rgba(201,168,76,0.3)] transition-all order-1 md:order-2 hover:-translate-y-2"
              >
                <div className="absolute -top-4 px-4 py-1.5 bg-gradient-to-r from-gold to-gold-light text-background font-stats-mono font-black text-xs rounded-full shadow-xl border border-white/40 flex items-center gap-1.5 uppercase tracking-wider">
                  👑 Grand Champion #1
                </div>
                <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-gold shadow-2xl bg-black/80 my-3 ring-4 ring-gold/20">
                  <img
                    src={top1.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top1.uid}`}
                    alt={top1.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-headline font-black text-xl text-white text-center group-hover:text-gold transition-colors">
                  {top1.displayName}
                </h3>
                <span className="text-xs text-gold/80 font-medium mb-4">{top1.country || "Global"}</span>
                <div className="w-full pt-3 border-t border-gold/30 flex items-center justify-between text-sm font-mono">
                  <span className="text-on-surface-variant">Peak Rating</span>
                  <span className="text-gold font-black font-stats-mono text-xl">
                    {(top1.elo as any)?.[selectedTc] || 1200}
                  </span>
                </div>
              </Link>
            )}

            {/* Rank 3 (Bronze) */}
            {top3 && (
              <Link
                href={`/profile/${top3.uid}`}
                className="group relative flex flex-col items-center p-6 rounded-3xl border border-amber-700/40 bg-gradient-to-b from-amber-950/40 to-surface/80 hover:border-amber-600 hover:shadow-[0_0_25px_rgba(180,83,9,0.15)] transition-all order-3 hover:-translate-y-1"
              >
                <div className="absolute -top-3.5 px-3 py-1 bg-amber-700 text-white font-stats-mono font-bold text-xs rounded-full shadow-lg border border-amber-500/50 flex items-center gap-1">
                  🥉 #3 Rank
                </div>
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-600 shadow-xl bg-black/60 my-2">
                  <img
                    src={top3.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3.uid}`}
                    alt={top3.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-headline font-bold text-lg text-white text-center mt-2 group-hover:text-gold transition-colors">
                  {top3.displayName}
                </h3>
                <span className="text-xs text-on-surface-variant mb-3">{top3.country || "Global"}</span>
                <div className="w-full pt-3 border-t border-border/40 flex items-center justify-between text-xs font-mono">
                  <span className="text-on-surface-variant">Rating</span>
                  <span className="text-white font-bold font-stats-mono text-base">
                    {(top3.elo as any)?.[selectedTc] || 1200}
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Full Leaderboard Table */}
          <div className="rounded-3xl border border-border/60 bg-surface/80 overflow-hidden shadow-xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-surface-light/30 text-[11px] uppercase tracking-wider text-on-surface-variant font-mono">
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-6">Player</th>
                    <th className="py-4 px-6 text-center hidden sm:table-cell">Tier</th>
                    <th className="py-4 px-6 text-center hidden md:table-cell">Country</th>
                    <th className="py-4 px-6 text-right font-stats-mono">Rating (ELO)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-sm">
                  {players.map((p, idx) => {
                    const rank = idx + 1;
                    const elo = (p.elo as any)?.[selectedTc] || 1200;
                    const rp = (p.elo as any)?.[`${selectedTc}RP`] || 0;
                    const tier = rpToRank(rp, false);
                    const isCurrentUser = user?.uid === p.uid;

                    return (
                      <tr
                        key={p.uid}
                        className={cn(
                          "transition-colors duration-150 group hover:bg-surface-light/40",
                          isCurrentUser ? "bg-gold/10 hover:bg-gold/15" : ""
                        )}
                      >
                        {/* Rank # */}
                        <td className="py-4 px-6 text-center font-stats-mono font-bold">
                          {rank === 1 ? (
                            <span className="text-gold">🥇 1</span>
                          ) : rank === 2 ? (
                            <span className="text-slate-300">🥈 2</span>
                          ) : rank === 3 ? (
                            <span className="text-amber-500">🥉 3</span>
                          ) : (
                            <span className="text-on-surface-variant">{rank}</span>
                          )}
                        </td>

                        {/* Player */}
                        <td className="py-4 px-6">
                          <Link href={`/profile/${p.uid}`} className="flex items-center gap-3 group-hover:text-gold transition-colors">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/60 border border-border/40 shrink-0">
                              <img
                                src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`}
                                alt={p.displayName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-headline font-bold text-white group-hover:text-gold transition-colors flex items-center gap-2">
                                {p.displayName}
                                {isCurrentUser && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 font-mono font-normal">
                                    YOU
                                  </span>
                                )}
                              </span>
                              {p.bio && (
                                <span className="text-xs text-on-surface-variant line-clamp-1 max-w-xs">
                                  {p.bio}
                                </span>
                              )}
                            </div>
                          </Link>
                        </td>

                        {/* Rank Tier */}
                        <td className="py-4 px-6 text-center hidden sm:table-cell">
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono border"
                            style={{
                              color: tier.color,
                              borderColor: `${tier.color}40`,
                              backgroundColor: `${tier.color}15`,
                            }}
                          >
                            {tier.icon} {tier.label}
                          </span>
                        </td>

                        {/* Country */}
                        <td className="py-4 px-6 text-center text-xs text-on-surface-variant hidden md:table-cell">
                          {p.country || "—"}
                        </td>

                        {/* Rating */}
                        <td className="py-4 px-6 text-right font-stats-mono font-bold text-base text-white">
                          {elo.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Sticky Bottom Bar ("My Position") */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-gold/30 shadow-[0_-10px_25px_rgba(0,0,0,0.5)] py-3 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-gold shadow-md bg-black/60 shrink-0">
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-headline font-bold text-white text-sm sm:text-base">
                    {user.displayName}
                  </span>
                  <span className="text-xs font-stats-mono text-gold font-semibold">
                    {data?.myRank ? `#${data.myRank} Globally` : "Unranked"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
                  <span>{selectedTc.toUpperCase()}: <strong className="text-white">{userElo} ELO</strong></span>
                  <span>•</span>
                  <span>{userRP} RP</span>
                  {userStreak > 1 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400 font-bold">🔥 {userStreak} Win Streak</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/profile/me"
                className="px-4 py-2 bg-gold/15 hover:bg-gold text-gold hover:text-background font-bold text-xs sm:text-sm rounded-xl border border-gold/40 transition-all flex items-center gap-1.5"
              >
                <PersonIcon fontSize="small" />
                View Profile
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
