"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface GameResultModalProps {
  isOpen: boolean;
  result: 'white' | 'black' | 'draw' | null;
  reason: string | null;
  playerColor: 'white' | 'black' | null;
  payout: number;
  eloChanges: any;
  onClose: () => void;
}

export function GameResultModal({ isOpen, result, reason, playerColor, payout, eloChanges, onClose }: GameResultModalProps) {
  const router = useRouter();

  if (!isOpen || !result) return null;

  const isWin = result === playerColor;
  const isDraw = result === 'draw';
  const isLoss = !isWin && !isDraw;

  const title = isWin ? "Victory" : isDraw ? "Draw" : "Defeat";
  const color = isWin ? "text-green-400" : isDraw ? "text-yellow-400" : "text-red-400";
  
  const formattedReason = reason?.replace(/_/g, ' ') || '';

  const myEloChange = eloChanges 
    ? (playerColor === 'white' ? eloChanges.white : eloChanges.black)
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto">
        <h2 className={cn("font-headline-lg text-5xl mb-2", color)}>{title}</h2>
        <p className="text-on-surface-variant text-sm capitalize mb-8">{formattedReason}</p>

        {payout > 0 && isWin && (
          <div className="mb-6 p-4 rounded-xl bg-gold/10 border border-gold/30 luxury-glow w-full">
            <p className="text-xs font-label-caps text-gold/70 mb-1">Prize Won</p>
            <p className="font-stats-mono text-3xl font-bold text-gold">♛ {payout}</p>
          </div>
        )}

        {myEloChange && (
          <div className="mb-8 flex items-center justify-center gap-6 w-full">
            <div className="flex flex-col items-center">
              <span className="text-xs text-on-surface-variant mb-1">New Rating</span>
              <span className="font-stats-mono text-xl font-bold text-white">{myEloChange.newElo}</span>
            </div>
            {myEloChange.rpChange !== 0 && (
              <div className="flex flex-col items-center">
                <span className="text-xs text-on-surface-variant mb-1">RP Change</span>
                <span className={cn("font-stats-mono text-xl font-bold", myEloChange.rpChange > 0 ? "text-green-400" : "text-red-400")}>
                  {myEloChange.rpChange > 0 ? "+" : ""}{myEloChange.rpChange}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 w-full">
          <Button variant="primary" onClick={() => router.push('/play')} fullWidth>
            Play Again
          </Button>
          <Button variant="ghost" onClick={() => router.push('/dashboard')} fullWidth>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </Modal>
  );
}
