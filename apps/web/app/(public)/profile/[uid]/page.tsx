"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPublicProfile, getUserGameHistory, getHeadToHead } from "@/lib/api/users";
import { useAuth } from "@/hooks/useAuth";
import { PublicUser, GameArchiveEntry, HeadToHeadStats, rpToRank, getRankProgress } from "@checkmate/shared-types";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { cn } from "@/lib/utils/cn";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import TimerIcon from "@mui/icons-material/Timer";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import EditIcon from "@mui/icons-material/Edit";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HistoryIcon from "@mui/icons-material/History";
import SportsKabaddiIcon from "@mui/icons-material/SportsKabaddi";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PublicIcon from "@mui/icons-material/Public";
import LoginIcon from "@mui/icons-material/Login";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const rawUid = params?.uid as string | undefined;
  const { user: authUser, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  const isOwnProfile = !rawUid || rawUid === "me" || (!!authUser?.uid && rawUid === authUser.uid);
  const targetUid = isOwnProfile ? authUser?.uid : rawUid;

  const [profile, setProfile] = useState<PublicUser | null>(
    isOwnProfile && authUser ? (authUser as unknown as PublicUser) : null
  );
  const [games, setGames] = useState<GameArchiveEntry[]>([]);
  const [h2h, setH2h] = useState<HeadToHeadStats | null>(null);
  const [isLoading, setIsLoading] = useState(!profile);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Sync auth user to profile state when viewing own profile
  useEffect(() => {
    if (isOwnProfile && authUser) {
      setProfile((prev) => prev || (authUser as unknown as PublicUser));
    }
  }, [isOwnProfile, authUser]);

  const fetchProfileData = async () => {
    if (!targetUid) {
      if (!isAuthLoading && !authUser) {
        setIsLoading(false);
      }
      return;
    }

    try {
      const [profRes, gamesRes] = await Promise.all([
        getPublicProfile(targetUid),
        getUserGameHistory(targetUid, 20),
      ]);

      if (profRes.data?.data?.user) {
        setProfile(profRes.data.data.user);
      }

      if (gamesRes.data?.data?.games) {
        setGames(gamesRes.data.data.games);
      }

      // If viewing another player while authenticated, fetch H2H stats
      if (!isOwnProfile && authUser?.uid) {
        try {
          const h2hRes = await getHeadToHead(targetUid, authUser.uid);
          if (h2hRes.data?.data?.stats) {
            setH2h(h2hRes.data.data.stats);
          }
        } catch {
          // Non-blocking H2H failure
        }
      }
    } catch (err) {
      console.error("Failed to load user profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (targetUid) {
      fetchProfileData();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [targetUid, isAuthLoading]);

  // Auth is still hydrating or profile initial load
  if (isLoading && isAuthLoading) {
    return (
      <div className="min-h-screen bg-background text-white py-12 px-4 max-w-6xl mx-auto space-y-8 animate-pulse">
        <div className="h-64 rounded-3xl bg-surface/60 border border-border/40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-36">
          <div className="rounded-2xl bg-surface/60 border border-border/40" />
          <div className="rounded-2xl bg-surface/60 border border-border/40" />
          <div className="rounded-2xl bg-surface/60 border border-border/40" />
          <div className="rounded-2xl bg-surface/60 border border-border/40" />
        </div>
        <div className="h-96 rounded-3xl bg-surface/60 border border-border/40" />
      </div>
    );
  }

  // Not logged in and tried to view /profile/me
  if (isOwnProfile && !authUser && !isAuthLoading) {
    return (
      <div className="min-h-[70vh] bg-background text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gold/10 text-gold flex items-center justify-center border border-gold/30 mb-4 shadow-[0_0_25px_rgba(201,168,76,0.15)]">
          <LoginIcon fontSize="large" />
        </div>
        <h2 className="text-2xl font-bold font-headline mb-2">Authentication Required</h2>
        <p className="text-sm text-on-surface-variant max-w-md mb-6">
          Please log in to your CheckMate account to view your competitive rating, match history, and profile stats.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-6 py-2.5 bg-gold text-background hover:bg-gold-light font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/leaderboard"
            className="px-6 py-2.5 bg-surface hover:bg-surface-light border border-border text-white text-sm font-semibold rounded-xl transition-all"
          >
            Explore Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  if (!profile && !targetUid) {
    return (
      <div className="min-h-[70vh] bg-background text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold font-headline mb-2">Player Not Found</h2>
        <p className="text-sm text-on-surface-variant mb-6">The requested player profile does not exist or has been removed.</p>
        <Link href="/leaderboard" className="px-6 py-2.5 bg-gold text-background font-bold rounded-xl">
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  const primaryRP = profile?.elo?.blitzRP || profile?.elo?.rapidRP || 0;
  const primaryTier = rpToRank(primaryRP, profile?.elo?.isTop500);
  const primaryProgress = getRankProgress(primaryRP);
  const progressPercent = primaryProgress.isMaxRank
    ? 100
    : Math.min(100, Math.round((primaryProgress.rpInCurrentDivision / 100) * 100));

  const timeControlStats = [
    {
      id: "blitz",
      label: "Blitz",
      icon: FlashOnIcon,
      elo: profile?.elo?.blitz || 1200,
      peak: profile?.peakElo?.blitz || profile?.elo?.blitz || 1200,
      rp: profile?.elo?.blitzRP || 0,
      streak: profile?.elo?.blitzStreak || 0,
    },
    {
      id: "rapid",
      label: "Rapid",
      icon: TimerIcon,
      elo: profile?.elo?.rapid || 1200,
      peak: profile?.peakElo?.rapid || profile?.elo?.rapid || 1200,
      rp: profile?.elo?.rapidRP || 0,
      streak: profile?.elo?.rapidStreak || 0,
    },
    {
      id: "bullet",
      label: "Bullet",
      icon: TrackChangesIcon,
      elo: profile?.elo?.bullet || 1200,
      peak: profile?.peakElo?.bullet || profile?.elo?.bullet || 1200,
      rp: profile?.elo?.bulletRP || 0,
      streak: profile?.elo?.bulletStreak || 0,
    },
    {
      id: "classic",
      label: "Classic",
      icon: SportsEsportsIcon,
      elo: profile?.elo?.classic || 1200,
      peak: profile?.peakElo?.classic || profile?.elo?.classic || 1200,
      rp: profile?.elo?.classicRP || 0,
      streak: profile?.elo?.classicStreak || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-white pb-24 pt-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* ─── Profile Hero ────────────────────────────────────── */}
      <div className="relative rounded-3xl border border-border/70 bg-gradient-to-b from-surface-light/40 via-surface/80 to-surface p-6 sm:p-8 shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-2 border-gold shadow-[0_0_25px_rgba(201,168,76,0.25)] bg-black/80 ring-4 ring-gold/20">
                <img
                  src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUid || 'player'}`}
                  alt={profile?.displayName || 'Player'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </div>
            </div>

            {/* Name & Details */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl sm:text-3xl font-headline font-black text-white">
                  {profile?.displayName || 'Player'}
                </h1>
                {profile?.country && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-surface-light border border-border/60 text-on-surface-variant font-mono flex items-center gap-1">
                    <PublicIcon fontSize="inherit" />
                    {profile.country}
                  </span>
                )}
              </div>

              {profile?.bio ? (
                <p className="text-sm text-on-surface-variant max-w-lg">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-sm text-muted/60 italic">No bio written yet.</p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-on-surface-variant font-mono pt-1">
                <span className="flex items-center gap-1.5">
                  <CalendarMonthIcon fontSize="inherit" />
                  Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "2026"}
                </span>
                <span>•</span>
                <span>{profile?.elo?.gamesPlayed || 0} Matches Played</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            {isOwnProfile ? (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gold/15 hover:bg-gold text-gold hover:text-background font-bold text-sm border border-gold/40 transition-all flex items-center gap-2 shadow-lg"
              >
                <EditIcon fontSize="small" />
                Edit Profile
              </button>
            ) : (
              <Link
                href={`/play?opponent=${targetUid}`}
                className="px-6 py-2.5 rounded-xl bg-gold text-background hover:bg-gold-light font-bold text-sm shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all flex items-center gap-2"
              >
                <PlayArrowIcon fontSize="small" />
                Challenge Player
              </Link>
            )}
          </div>
        </div>

        {/* Rank Progression Bar */}
        <div className="mt-8 pt-6 border-t border-border/40 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 font-bold" style={{ color: primaryTier.color }}>
              <span>{primaryTier.icon}</span>
              <span>{primaryTier.label} Division</span>
            </div>
            <span className="text-on-surface-variant">
              {primaryProgress.rpInCurrentDivision} / 100 RP ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-border/40 p-0.5">
            <div
              className="h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(201,168,76,0.5)]"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: primaryTier.color,
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── Head-to-Head Comparison (If viewing opponent) ─── */}
      {!isOwnProfile && h2h && h2h.totalGames > 0 && (
        <div className="rounded-3xl border border-gold/40 bg-gradient-to-r from-surface-light/40 to-gold/10 p-6 shadow-xl">
          <div className="flex items-center gap-2 text-gold text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <SportsKabaddiIcon fontSize="small" />
            Head-to-Head Lifetime Record
          </div>
          <div className="grid grid-cols-3 gap-4 text-center items-center">
            <div className="space-y-1">
              <span className="text-2xl font-stats-mono font-black text-emerald-400">{h2h.userWins}</span>
              <span className="block text-xs text-on-surface-variant font-mono">Your Wins</span>
            </div>
            <div className="space-y-1 border-x border-border/40">
              <span className="text-2xl font-stats-mono font-bold text-slate-300">{h2h.draws}</span>
              <span className="block text-xs text-on-surface-variant font-mono">Draws</span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-stats-mono font-black text-rose-400">{h2h.opponentWins}</span>
              <span className="block text-xs text-on-surface-variant font-mono">{profile?.displayName}&apos;s Wins</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4 Time Control Stat Cards ─────────────────────── */}
      <div>
        <h2 className="text-lg font-headline font-bold text-white mb-4 flex items-center gap-2">
          <EmojiEventsIcon className="text-gold" fontSize="small" />
          Rating Radar & Time Controls
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {timeControlStats.map((tc) => {
            const Icon = tc.icon;
            const tier = rpToRank(tc.rp, false);
            return (
              <div
                key={tc.id}
                className="p-5 rounded-2xl border border-border/60 bg-surface/80 hover:border-gold/40 transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-black/50 text-gold border border-border/40 flex items-center justify-center">
                      <Icon fontSize="small" />
                    </div>
                    <span className="font-headline font-bold text-white text-sm">{tc.label}</span>
                  </div>
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded-full border font-semibold"
                    style={{
                      color: tier.color,
                      borderColor: `${tier.color}40`,
                      backgroundColor: `${tier.color}10`,
                    }}
                  >
                    {tier.label}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-2xl font-stats-mono font-black text-white">{tc.elo}</span>
                    <span className="text-xs text-on-surface-variant ml-1 font-mono">ELO</span>
                  </div>
                  <div className="text-right text-xs font-mono text-on-surface-variant">
                    Peak: <strong className="text-slate-200">{tc.peak}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs font-mono text-on-surface-variant">
                  <span>{tc.rp} RP</span>
                  {tc.streak > 0 && <span className="text-amber-400 font-semibold">🔥 {tc.streak} Streak</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Match History (Game Archive) ───────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-headline font-bold text-white flex items-center gap-2">
            <HistoryIcon className="text-gold" fontSize="small" />
            Recent Match Archive
          </h2>
          <span className="text-xs text-on-surface-variant font-mono">{games.length} Matches Found</span>
        </div>

        {games.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-surface/40 border border-border/40 space-y-2">
            <HistoryIcon style={{ fontSize: "40px" }} className="text-muted/30" />
            <h3 className="font-headline font-bold text-white text-base">No completed matches yet</h3>
            <p className="text-xs text-on-surface-variant">Finished wager and casual games will appear here.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/60 bg-surface/80 overflow-hidden shadow-xl">
            <div className="divide-y divide-border/30">
              {games.map((g) => {
                const isWin = g.result === "win";
                const isLoss = g.result === "loss";

                return (
                  <div
                    key={g.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-light/30 transition-colors"
                  >
                    {/* Outcome & Opponent */}
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-stats-mono font-black text-xs shrink-0 border shadow-md",
                          isWin
                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                            : isLoss
                            ? "bg-rose-950/80 text-rose-400 border-rose-500/40"
                            : "bg-slate-900 text-slate-300 border-slate-700"
                        )}
                      >
                        {isWin ? "WIN" : isLoss ? "LOSS" : "DRAW"}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-on-surface-variant uppercase">
                            vs
                          </span>
                          <span className="font-headline font-bold text-white text-sm sm:text-base">
                            {g.opponent.displayName}
                          </span>
                          <span className="text-xs font-stats-mono text-on-surface-variant">
                            ({g.opponent.elo})
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-on-surface-variant">
                          <span className="capitalize">{g.timeControlCategory}</span>
                          <span>•</span>
                          <span className="capitalize">By {g.resultReason}</span>
                          <span>•</span>
                          <span>{g.movesCount} Moves</span>
                          <span>•</span>
                          <span>{new Date(g.completedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stakes & Review Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
                      {g.stakeAmountCrowns > 0 && (
                        <div className="text-right">
                          <span
                            className={cn(
                              "font-stats-mono font-bold text-sm block",
                              isWin ? "text-gold" : isLoss ? "text-rose-400" : "text-slate-300"
                            )}
                          >
                            {isWin ? `+${g.netCrownsWon}` : isLoss ? `${g.netCrownsWon}` : "0"} Crowns
                          </span>
                          <span className="text-[10px] text-muted font-mono">Wager Pot</span>
                        </div>
                      )}

                      <Link
                        href={`/game/${g.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-surface-light hover:bg-gold/20 text-slate-200 hover:text-gold border border-border/60 text-xs font-mono transition-colors"
                      >
                        Review Game →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={fetchProfileData}
      />
    </div>
  );
}
