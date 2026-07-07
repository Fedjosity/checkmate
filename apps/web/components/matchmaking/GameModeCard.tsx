"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GAME_MODES } from "@/lib/constants/gameModes";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckIcon from "@mui/icons-material/Check";

interface GameModeCardProps {
  modeKey: keyof typeof GAME_MODES;
  availableBalance: number;
  queueDepth?: number;
  onSelect?: (modeKey: string, stake?: number) => void;
}

export function GameModeCard({ modeKey, availableBalance, queueDepth, onSelect }: GameModeCardProps) {
  const router = useRouter();
  const mode = GAME_MODES[modeKey];
  const [selectedStake, setSelectedStake] = useState<number>(
    mode.stakeTiers ? mode.stakeTiers[0] : 0
  );

  const hasEnoughBalance = !mode.requiresBalance || availableBalance >= selectedStake;
  const potentialWin = ((selectedStake * 2 * 0.92) / 100).toFixed(2);

  const handleAction = () => {
    if (mode.requiresBalance && !hasEnoughBalance) {
      router.push("/wallet");
      return;
    }
    
    if (onSelect) {
      onSelect(modeKey, selectedStake);
    }
  };

  return (
    <Card padding="lg" className="flex flex-col h-full game-mode-card luxury-glow">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-lg bg-surface-bright border border-border flex items-center justify-center text-3xl select-none">
          {mode.icon}
        </div>
        <Badge variant={mode.badgeStyle}>{mode.badge}</Badge>
      </div>

      <div className="mb-6 flex-1">
        <h3 className="font-headline-md text-2xl text-white mb-2">{mode.label}</h3>
        <p className="text-on-surface-variant text-sm mb-6">{mode.description}</p>

        {mode.features.length > 0 && (
          <ul className="space-y-3 mb-6">
            {mode.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted">
                <CheckIcon fontSize="small" className="text-gold mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {mode.stakeTiers && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="font-label-caps text-muted mb-3">Select Entry Fee</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {mode.stakeTiers.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedStake(tier)}
                  className={`px-3 py-1.5 rounded-full text-sm font-stats-mono transition-colors border ${
                    selectedStake === tier
                      ? "bg-gold border-gold text-background font-bold"
                      : "bg-surface border-border text-muted hover:border-gold hover:text-white"
                  }`}
                >
                  ${(tier / 100).toFixed(2)}
                </button>
              ))}
            </div>
            
            <div className="bg-surface-bright rounded-md p-3">
              <p className="text-gold text-sm font-medium mb-1">
                Potential win: ${potentialWin}
              </p>
              <p className="text-xs text-muted">
                Platform fee: 8% &middot; Instant payout on win
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto">
        {queueDepth !== undefined && (
          <div className="text-center text-xs text-muted mb-3 flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            {queueDepth} {queueDepth === 1 ? 'player' : 'players'} in queue
          </div>
        )}

        {mode.requiresBalance && !hasEnoughBalance ? (
          <div className="space-y-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleAction}
              className="font-label-caps"
            >
              Top Up to Play
            </Button>
            <div className="flex items-center justify-center gap-1.5 text-xs">
              <WarningAmberIcon sx={{ fontSize: 16 }} className="text-amber-500" />
              <span className="text-amber-500">Insufficient balance &middot; </span>
              <button onClick={() => router.push("/wallet")} className="text-gold hover:underline">
                Add funds
              </button>
            </div>
          </div>
        ) : (
          <Button
            fullWidth
            onClick={handleAction}
            className="font-label-caps"
            variant={mode.requiresBalance ? "primary" : "secondary"}
          >
            {mode.ctaLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
