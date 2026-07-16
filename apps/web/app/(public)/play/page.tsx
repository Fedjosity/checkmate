"use client";

import { useMatchmaking } from "@/hooks/useMatchmaking";
import { SearchingModal } from "@/components/matchmaking/SearchingModal";
import { DecorativeBoard } from "@/components/chess/DecorativeBoard";
import { ModeSelector } from "@/components/play/ModeSelector";
import { LiveStatsBar } from "@/components/play/LiveStatsBar";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function PlayPage() {
  const router = useRouter();
  const { state, matchData, leaveQueue, resetState } = useMatchmaking();

  return (
    <main className="min-h-screen bg-background relative flex flex-col">
      <SearchingModal
        state={state}
        matchData={matchData}
        onCancel={leaveQueue}
        onClose={resetState}
      />

      {/* Immersive Top Bar */}
      <header className="w-full flex items-center justify-between p-6 z-10">
        <div className="flex items-center gap-3">
          <Image
            src="/icon.png"
            alt="CheckMate"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span className="font-headline text-xl text-white">CheckMate</span>
        </div>
        <Link
          href="/dashboard"
          className="text-on-surface-variant hover:text-white transition-colors"
        >
          Back to Dashboard
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 gap-12 lg:gap-24 max-w-[1400px] mx-auto w-full">
        {/* Left Side: Decorative Board & Stats */}
        <div className="flex-1 w-full max-w-[600px] hidden md:flex flex-col gap-8">
          <div className="space-y-4">
            <h1 className="font-headline-lg text-4xl lg:text-5xl text-white leading-tight">
              Enter the <span className="text-gold">Arena</span>
            </h1>
          </div>

          <DecorativeBoard />
          <LiveStatsBar />
        </div>

        {/* Right Side: Mode Selector */}
        <div className="flex-1 w-full max-w-[500px]">
          <ModeSelector />
        </div>
      </div>
    </main>
  );
}
