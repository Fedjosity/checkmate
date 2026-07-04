"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LockIcon from "@mui/icons-material/Lock";

type TimeControl = "bullet" | "blitz" | "rapid" | "classic";

const TIME_CONTROLS: { key: TimeControl; label: string; format: string }[] = [
  { key: "bullet", label: "Bullet",  format: "1+0"  },
  { key: "blitz",  label: "Blitz",   format: "5+0"  },
  { key: "rapid",  label: "Rapid",   format: "10+0" },
  { key: "classic",label: "Classic", format: "30+0" },
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
        `/play?mode=paid&stake=${selectedStake}&timeControl=${activeTimeControl}`
      );
    } else {
      router.push("/wallet");
    }
  };

  const getButtonProps = (): { text: string; className: string } => {
    if (selectedStake === "free") {
      return {
        text: "Find a Free Match",
        className:
          "border border-gold text-gold hover:bg-gold hover:text-background transition-all duration-200 font-label-caps uppercase tracking-widest text-sm py-3 px-8 rounded-sm",
      };
    }
    if (hasBalance) {
      return {
        text: `Enter Match — $${selectedStake} stake`,
        className:
          "bg-gold text-background font-bold font-label-caps uppercase tracking-widest text-sm py-3 px-8 rounded-sm shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:shadow-[0_0_30px_rgba(201,168,76,0.5)] hover:-translate-y-0.5 transition-all duration-200",
      };
    }
    return {
      text: "Add Funds to Play",
      className:
        "border border-amber-500 text-amber-400 hover:bg-amber-500/10 transition-all duration-200 font-label-caps uppercase tracking-widest text-sm py-3 px-8 rounded-sm",
    };
  };

  const btn = getButtonProps();

  return (
    <section
      className="relative w-full bg-surface border-b border-border overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='20' height='20' fill='%23ffffff' fill-opacity='0.04'/%3E%3Crect x='20' y='20' width='20' height='20' fill='%23ffffff' fill-opacity='0.04'/%3E%3C/svg%3E")`,
      }}
    >
      <div className="relative z-10 max-w-2xl mx-auto py-10 px-6 text-center">
        {/* Eyebrow */}
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-gold mb-3">
          Ready to Compete
        </p>

        {/* Headline */}
        <h1 className="text-4xl font-bold text-white tracking-tight leading-tight mb-2">
          Your Move.
        </h1>
        <p className="text-[#6B7280] text-sm mb-8">
          Choose your time control and stake. We find your match in seconds.
        </p>

        {/* Time Control Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {TIME_CONTROLS.map((tc) => (
            <button
              key={tc.key}
              onClick={() => onTimeControlChange(tc.key)}
              className={
                activeTimeControl === tc.key
                  ? "bg-gold text-background font-bold rounded-full px-5 py-2 text-sm transition-all duration-150"
                  : "bg-transparent border border-border text-[#6B7280] rounded-full px-5 py-2 text-sm hover:border-gold hover:text-white transition-all duration-150"
              }
            >
              {tc.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#6B7280] mb-6">{activeFormat}</p>

        {/* Stake Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {STAKE_OPTIONS.map((stake) => {
            const isLocked = stake !== "free" && !hasBalance;
            const isActive = selectedStake === stake;
            return (
              <button
                key={String(stake)}
                onClick={() => handleStakeClick(stake)}
                className={[
                  "relative rounded-full px-5 py-2 text-sm flex items-center gap-1.5 transition-all duration-150",
                  isActive
                    ? "bg-gold text-background font-bold"
                    : "bg-transparent border border-border text-[#6B7280] hover:border-gold hover:text-white",
                ].join(" ")}
              >
                {stake === "free" ? "Free" : `$${stake}`}
                {isLocked && (
                  <LockIcon
                    sx={{ fontSize: 12 }}
                    className="text-amber-400 opacity-70"
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
            showFundNudge ? "max-h-12 opacity-100 mb-4" : "max-h-0 opacity-0 mb-0",
          ].join(" ")}
        >
          <p className="text-sm text-amber-400">
            💳 Top up your wallet to play paid matches.{" "}
            <button
              onClick={() => router.push("/wallet")}
              className="text-gold underline hover:no-underline"
            >
              Add Funds
            </button>
          </p>
        </div>

        {/* Find Match Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleFindMatch}
            className={`max-w-xs w-full ${btn.className}`}
          >
            {btn.text}
          </button>
        </div>
      </div>
    </section>
  );
}
