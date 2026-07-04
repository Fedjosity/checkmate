"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getEloTier } from "@/lib/utils/elo";
import { Card } from "@/components/ui/Card";

export function RatingWidget() {
  const { user } = useAuth();
  const router = useRouter();

  const blitzElo = user?.elo?.blitz ?? 1200;
  const tier = getEloTier(blitzElo);

  return (
    <Card variant="hud" padding="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-[#6B7280] tracking-widest uppercase">Rating</h3>
        <span
          className="inline-block text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider"
          style={{ color: tier.color, borderColor: `${tier.color}40`, backgroundColor: `${tier.color}10` }}
        >
          {tier.label}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        {/* Tier Piece */}
        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-xl bg-background/50 border border-border/50">
          <span
            className="text-4xl leading-none select-none drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
            style={{ color: tier.color }}
          >
            {tier.piece}
          </span>
        </div>

        {/* Big ELO */}
        <div>
          <p className="text-4xl font-bold text-white font-stats-mono tracking-tight drop-shadow-md">{blitzElo}</p>
          <p className="text-xs text-gold/80 font-semibold tracking-wider uppercase">Blitz</p>
        </div>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
        {[
          { label: "Bullet",  value: user?.elo?.bullet  ?? 1200 },
          { label: "Rapid",   value: user?.elo?.rapid   ?? 1200 },
          { label: "Classic", value: user?.elo?.classic ?? 1200 },
        ].map((stat) => (
          <div key={stat.label} className="text-center bg-background/30 rounded-lg py-2">
            <p className="text-sm font-bold text-white font-stats-mono">{stat.value}</p>
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">{stat.label}</p>
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


