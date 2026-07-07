"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { rpToRank, getRankProgress } from "@checkmate/shared-types";

export function RatingWidget() {
  const { user } = useAuth();
  const router = useRouter();

  const blitzElo = user?.elo?.blitz ?? 1200;
  const blitzRP = user?.elo?.blitzRP ?? 0;
  const isTop500 = user?.elo?.isTop500 ?? false;
  
  const rank = rpToRank(blitzRP, isTop500);
  const progress = getRankProgress(blitzRP);

  const progressPercent = progress.isMaxRank ? 100 : (progress.rpInCurrentDivision / 100) * 100;

  return (
    <Card variant="hud" padding="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-[#6B7280] tracking-widest uppercase">Rating</h3>
        <span className="text-xs font-stats-mono text-gold">{blitzElo} ELO</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-xl bg-background/50 border border-border/50 text-4xl luxury-glow"
             style={{ color: rank.color, borderColor: `${rank.color}40` }}>
          {rank.icon}
        </div>

        <div className="flex-1">
          <p className="text-2xl font-bold tracking-tight drop-shadow-md mb-1" style={{ color: rank.color }}>
            {rank.tier} {rank.division}
          </p>
          
          <div className="flex justify-between text-xs text-muted mb-1 font-stats-mono">
            <span>{blitzRP.toLocaleString()} RP</span>
            {!progress.isMaxRank && <span>Next div</span>}
          </div>
          
          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-surface-bright rounded-full overflow-hidden border border-border/50">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%`, backgroundColor: rank.color, boxShadow: `0 0 10px ${rank.color}` }}
            />
          </div>
        </div>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
        {[
          { label: "Bullet",  value: user?.elo?.bulletRP  ?? 0 },
          { label: "Rapid",   value: user?.elo?.rapidRP   ?? 0 },
          { label: "Classic", value: user?.elo?.classicRP ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="text-center bg-background/30 rounded-lg py-2">
            <p className="text-sm font-bold text-white font-stats-mono">{stat.value}</p>
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">{stat.label} RP</p>
          </div>
        ))}
      </div>

      {/* Profile link */}
      <div className="mt-4 text-center">
        <button
          onClick={() => router.push("/profile/me")}
          className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest hover:text-white transition-colors"
        >
          View Profile →
        </button>
      </div>
    </Card>
  );
}


