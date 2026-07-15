"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GAME_MODES } from "@/lib/constants/gameModes";
import { useAuth } from "@/hooks/useAuth";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createBotGame } from "@/lib/api/games";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { TIME_CONTROL_PRESETS, NO_TIMER_ID } from "@checkmate/shared-types";

const BOT_DIFFICULTIES = ["novice", "casual", "intermediate", "advanced", "grandmaster"];
const BOT_COLORS = ["random", "white", "black"];

// Group presets for display
const groupedPresets = {
  Bullet: TIME_CONTROL_PRESETS.filter(tc => tc.category === 'bullet'),
  Blitz: TIME_CONTROL_PRESETS.filter(tc => tc.category === 'blitz'),
  Rapid: TIME_CONTROL_PRESETS.filter(tc => tc.category === 'rapid'),
};

export function ModeSelector() {
  const router = useRouter();
  const { user, availableBalance } = useAuth();
  const { joinQueue } = useMatchmaking();

  const [expandedMode, setExpandedMode] = useState<string>("play_online");
  const [timeControlId, setTimeControlId] = useState<string>("3+2");
  
  // Bot specific state
  const [botDifficulty, setBotDifficulty] = useState<string>("casual");
  const [botColor, setBotColor] = useState<string>("random");
  
  // Pro specific state
  const [stakeAmount, setStakeAmount] = useState<number>(100);
  
  const [isStartingBot, setIsStartingBot] = useState(false);

  const handlePlay = async (modeKey: string) => {
    const mode = GAME_MODES[modeKey];
    
    if (mode.requiresBalance && !user) {
      toast.error("You must be logged in to play for stakes.");
      router.push("/login");
      return;
    }
    if (!user && modeKey === "competitive") {
      toast.error("You must be logged in to play ranked games.");
      router.push("/login");
      return;
    }

    if (modeKey === "bot") {
      try {
        setIsStartingBot(true);
        const { gameId } = await createBotGame(botDifficulty, timeControlId, botColor);
        router.push(`/game/${gameId}`);
      } catch (err: any) {
        toast.error(err.message || "Failed to start bot game");
        setIsStartingBot(false);
      }
      return;
    }

    // Matchmaking modes
    let finalStake = 0;
    if (modeKey === "online_pro") {
      finalStake = stakeAmount;
      if (availableBalance < finalStake) {
        toast.error("Insufficient Crowns balance.");
        return;
      }
    }

    // Protect against 'unlimited' time control for PvP
    if (timeControlId === NO_TIMER_ID) {
      toast.error("No Timer is only available for bot games.");
      return;
    }

    joinQueue(modeKey as any, timeControlId, finalStake);
  };

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(GAME_MODES).map(([key, mode]) => {
        const isExpanded = expandedMode === key;

        return (
          <div
            key={key}
            className={cn(
              "rounded-2xl transition-all duration-300 overflow-hidden border",
              isExpanded 
                ? "bg-surface-light border-border/50 shadow-2xl" 
                : "bg-surface border-transparent hover:border-border/30 cursor-pointer opacity-70 hover:opacity-100"
            )}
            onClick={() => !isExpanded && setExpandedMode(key)}
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${mode.accentColor}20`, color: mode.accentColor }}
                >
                  {mode.icon}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-headline text-lg text-white">{mode.label}</h3>
                    <Badge variant={mode.badgeStyle}>{mode.badge}</Badge>
                  </div>
                  <p className="text-on-surface-variant text-sm mt-1">{mode.description}</p>
                </div>
              </div>
              
              {!isExpanded && (
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                
                {/* Time Control (Common for all) */}
                <div className="mb-6">
                  <label className="text-xs font-label-caps text-on-surface-variant mb-3 block">
                    Time Control
                  </label>
                  
                  <div className="flex flex-col gap-4">
                    {Object.entries(groupedPresets).map(([groupName, presets]) => (
                      <div key={groupName} className="flex items-center gap-3">
                        <span className="w-12 text-xs text-on-surface-variant font-medium">{groupName}</span>
                        <div className="flex flex-wrap gap-2">
                          {presets.map(tc => (
                            <button
                              key={tc.id}
                              onClick={() => setTimeControlId(tc.id)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                                timeControlId === tc.id
                                  ? "bg-white/10 border-white/20 text-white"
                                  : "bg-transparent border-border/50 text-muted hover:border-white/20 hover:text-white"
                              )}
                            >
                              {tc.id}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Bot only option */}
                    {key === "bot" && (
                      <div className="flex items-center gap-3 pt-2 border-t border-border/20">
                        <span className="w-12 text-xs text-on-surface-variant font-medium">Other</span>
                        <button
                          onClick={() => setTimeControlId(NO_TIMER_ID)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                            timeControlId === NO_TIMER_ID
                              ? "bg-white/10 border-white/20 text-white"
                              : "bg-transparent border-border/50 text-muted hover:border-white/20 hover:text-white"
                          )}
                        >
                          No Timer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bot Settings */}
                {key === "bot" && (
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-xs font-label-caps text-on-surface-variant mb-3 block">
                        Difficulty
                      </label>
                      <select 
                        className="w-full bg-surface border border-border/50 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-white/30"
                        value={botDifficulty}
                        onChange={(e) => setBotDifficulty(e.target.value)}
                      >
                        {BOT_DIFFICULTIES.map(d => (
                          <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-label-caps text-on-surface-variant mb-3 block">
                        Play As
                      </label>
                      <select 
                        className="w-full bg-surface border border-border/50 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-white/30"
                        value={botColor}
                        onChange={(e) => setBotColor(e.target.value)}
                      >
                        {BOT_COLORS.map(c => (
                          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Pro Stakes */}
                {key === "online_pro" && mode.stakeTiers && (
                  <div className="mb-6">
                    <label className="text-xs font-label-caps text-on-surface-variant mb-3 flex justify-between items-center">
                      <span>Stake Amount</span>
                      <span className="text-gold">Balance: ♛ {availableBalance.toLocaleString()}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {mode.stakeTiers.map(tier => (
                        <button
                          key={tier}
                          onClick={() => setStakeAmount(tier)}
                          className={cn(
                            "px-4 py-2 rounded-lg border text-sm font-bold transition-all",
                            stakeAmount === tier
                              ? "bg-gold/20 border-gold text-gold luxury-glow"
                              : "bg-transparent border-border/50 text-muted hover:border-gold/30 hover:text-gold"
                          )}
                        >
                          ♛ {tier}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-4">
                  <div className="text-xs text-on-surface-variant">
                    {key === "play_online" && !user && "Playing as Guest. Create an account to track stats."}
                    {key === "competitive" && !user && "Requires an account."}
                  </div>
                  <Button 
                    variant={key === "online_pro" ? "primary" : "secondary"}
                    onClick={() => handlePlay(key)}
                    isLoading={isStartingBot}
                  >
                    {mode.ctaLabel}
                  </Button>
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
