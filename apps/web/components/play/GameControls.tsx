"use client";

import { Button } from "@/components/ui/Button";

interface GameControlsProps {
  onResign: () => void;
  onOfferDraw: () => void;
  status: string;
}

export function GameControls({ onResign, onOfferDraw, status }: GameControlsProps) {
  if (status !== 'active') return null;

  return (
    <div className="flex items-center gap-4 mt-6">
      <Button variant="secondary" onClick={onOfferDraw} className="flex-1">
        Offer Draw
      </Button>
      <Button variant="secondary" onClick={onResign} className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10">
        Resign
      </Button>
    </div>
  );
}
