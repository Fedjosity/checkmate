"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LockIcon from "@mui/icons-material/Lock";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type TimeControl = "bullet" | "blitz" | "rapid" | "classic";

const TIME_CONTROLS: { key: TimeControl; label: string; format: string }[] = [
  { key: "bullet", label: "Bullet", format: "1+0" },
  { key: "blitz", label: "Blitz", format: "5+0" },
  { key: "rapid", label: "Rapid", format: "10+0" },
  { key: "classic", label: "Classic", format: "30+0" },
];

const STAKE_OPTIONS: (number | "free")[] = ["free", 1, 3, 5, 10];

interface Props {
  activeTimeControl: TimeControl;
  onTimeControlChange: (tc: TimeControl) => void;
  selectedStake: number | "free";
  onStakeChange: (stake: number | "free") => void;
  hasBalance: boolean;
}

export function PlayHero({
  activeTimeControl,
  onTimeControlChange,
  selectedStake,
  onStakeChange,
  hasBalance,
}: Props) {
  const router = useRouter();
  const [showFundNudge, setShowFundNudge] = useState(false);

  const activeFormat =
    TIME_CONTROLS.find((t) => t.key === activeTimeControl)?.format ?? "5+0";

  const handleStakeClick = (stake: number | "free") => {
    if (stake !== "free" && !hasBalance) {
      setShowFundNudge(true);
      return;
    }
    setShowFundNudge(false);
    onStakeChange(stake);
  };

  const handleFindMatch = () => {
    if (selectedStake === "free") {
      router.push("/play?mode=friendly");
    } else if (hasBalance) {
      router.push(
        `/play?mode=paid&stake=${selectedStake}&timeControl=${activeTimeControl}`,
      );
    } else {
      router.push("/wallet");
    }
  };

  const getButtonProps = (): {
    text: string;
    variant: "primary" | "secondary" | "ghost";
    className?: string;
  } => {
    if (selectedStake === "free") {
      return {
        text: "Find a Free Match",
        variant: "secondary",
      };
    }
    if (hasBalance) {
      return {
        text: `Enter Match — $${selectedStake} stake`,
        variant: "primary",
        className: "animate-gold-pulse",
      };
    }
    return {
      text: "Add Funds to Play",
      variant: "ghost",
      className:
        "border-amber-500 text-amber-400 hover:bg-amber-500/10 hover:text-amber-400 border",
    };
  };

  const btn = getButtonProps();

  return (
    <Card
      variant="hud"
      padding="lg"
      className="relative w-full luxury-glow overflow-hidden flex flex-col items-center text-center !bg-surface/60"
    >
      <div className="relative z-10 w-full max-w-xl">
        {/* Eyebrow */}
        <div className="inline-block px-3 py-1 border border-gold/30 rounded-full bg-gold/10 text-gold text-xs font-bold tracking-widest uppercase mb-6">
          The Arena
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-3">
          Your Move.
        </h1>
        <p className="text-[#6B7280] text-sm sm:text-base mb-10">
          Select your time control and stake. We find your match in seconds.
        </p>

        {/* Time Control Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {TIME_CONTROLS.map((tc) => (
            <button
              key={tc.key}
              onClick={() => onTimeControlChange(tc.key)}
              className={
                activeTimeControl === tc.key
                  ? "bg-gold  font-bold rounded-md px-6 py-2.5 text-sm transition-all duration-150 shadow-[0_0_15px_rgba(201,168,76,0.3)]"
                  : "bg-surface-container border border-border text-[#6B7280] rounded-md px-6 py-2.5 text-sm hover:border-gold/50 hover:text-white transition-all duration-150"
              }
            >
              {tc.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#6B7280] mb-8 font-stats-mono tracking-widest">
          {activeFormat}
        </p>

        {/* Stake Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {STAKE_OPTIONS.map((stake) => {
            const isLocked = stake !== "free" && !hasBalance;
            const isActive = selectedStake === stake;
            return (
              <button
                key={String(stake)}
                onClick={() => handleStakeClick(stake)}
                className={[
                  "relative rounded-md px-5 py-2.5 text-sm flex items-center gap-1.5 transition-all duration-150",
                  isActive
                    ? "bg-white text-background font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    : "bg-surface-container border border-border text-[#6B7280] hover:border-white/50 hover:text-white",
                ].join(" ")}
              >
                {stake === "free" ? "Free" : `$${stake}`}
                {isLocked && (
                  <LockIcon
                    sx={{ fontSize: 14 }}
                    className="text-amber-500 opacity-80"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Fund Nudge */}
        <div
          className={[
            "overflow-hidden transition-all duration-300",
            showFundNudge
              ? "max-h-12 opacity-100 mb-6"
              : "max-h-0 opacity-0 mb-0",
          ].join(" ")}
        >
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-md py-2 px-4 inline-block">
            <p className="text-sm text-amber-400">
              💳 Top up your wallet to play paid matches.{" "}
              <button
                onClick={() => router.push("/wallet")}
                className="text-white font-bold underline hover:no-underline ml-1"
              >
                Add Funds
              </button>
            </p>
          </div>
        </div>

        {/* Find Match Button */}
        <div className="mt-8">
          <Button
            onClick={handleFindMatch}
            variant={btn.variant}
            fullWidth
            className={btn.className}
          >
            {btn.text}
          </Button>
        </div>
      </div>
    </Card>
  );
}
