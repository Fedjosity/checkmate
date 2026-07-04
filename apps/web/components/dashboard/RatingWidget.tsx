"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getEloTier } from "@/lib/utils/elo";

export function RatingWidget() {
  const { user } = useAuth();
  const router = useRouter();

  const blitzElo = user?.elo?.blitz ?? 1200;
  const tier = getEloTier(blitzElo);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      {/* Tier Piece */}
      <div className="text-center mb-3">
        <span
          className="text-4xl leading-none block mb-2 select-none"
          style={{ color: tier.color }}
        >
          {tier.piece}
        </span>
        <span
          className="inline-block text-xs px-2 py-0.5 rounded-full border font-semibold"
          style={{ color: tier.color, borderColor: tier.color }}
        >
          {tier.label}
        </span>
      </div>

      {/* Big ELO */}
      <div className="text-center mb-1">
        <p className="text-5xl font-bold text-white font-stats-mono">{blitzElo}</p>
        <p className="text-xs text-[#6B7280] mt-1">Blitz Rating</p>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
        {[
          { label: "Bullet",  value: user?.elo?.bullet  ?? 1200 },
          { label: "Rapid",   value: user?.elo?.rapid   ?? 1200 },
          { label: "Classic", value: user?.elo?.classic ?? 1200 },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-sm font-bold text-white font-stats-mono">{stat.value}</p>
            <p className="text-xs text-[#6B7280]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Profile link */}
      <div className="mt-4 text-right">
        <button
          onClick={() => router.push("/profile/me")}
          className="text-xs text-gold hover:underline"
        >
          View full profile →
        </button>
      </div>
    </div>
  );
}
