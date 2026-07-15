"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import Image from "next/image";
import { playLowTimeSound } from "@/lib/sounds";

import { CapturedPieces } from "./CapturedPieces";

interface PlayerCardProps {
  uid: string;
  name: string;
  elo?: number;
  timeRemainingMs: number;
  isActive: boolean;
  color: "white" | "black";
  isBot?: boolean;
}

export function PlayerCard({ uid, name, elo, timeRemainingMs, isActive, color, isBot }: PlayerCardProps) {
  // Format time (MM:SS)
  const formatTime = (ms: number) => {
    if (ms <= 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const isLowTime = timeRemainingMs <= 10000 && timeRemainingMs > 0;
  const lastSecondRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && isLowTime) {
      const currentSecond = Math.floor(timeRemainingMs / 1000);
      if (lastSecondRef.current !== currentSecond) {
        lastSecondRef.current = currentSecond;
        playLowTimeSound();
      }
    } else if (!isLowTime) {
      lastSecondRef.current = null;
    }
  }, [timeRemainingMs, isActive, isLowTime]);

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-xl transition-all duration-300 w-full max-w-[600px] border",
      isActive 
        ? "bg-surface-light border-gold shadow-[0_0_15px_rgba(201,168,76,0.15)]" 
        : "bg-surface border-border/50 opacity-80"
    )}>
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border/50 bg-black/50 shrink-0">
          {isBot ? (
            <div className="w-full h-full flex items-center justify-center text-2xl">🤖</div>
          ) : (
            <Image 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`}
              alt={name}
              fill
              className="object-cover"
            />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-headline text-white font-medium">{name}</h3>
            {color === 'white' 
              ? <div className="w-3 h-3 rounded-sm bg-white border border-border/50 shrink-0" />
              : <div className="w-3 h-3 rounded-sm bg-[#1A1A1A] border border-border/50 shrink-0" />
            }
          </div>
          <div className="flex items-center gap-3">
            {elo && <div className="text-sm text-on-surface-variant font-stats-mono leading-none">ELO {elo}</div>}
            <CapturedPieces color={color} />
          </div>
        </div>
      </div>

      <div className={cn(
        "font-stats-mono text-3xl font-bold tracking-wider px-4 py-1.5 rounded-lg border",
        isActive ? "bg-white/5 border-white/10 text-white" : "bg-transparent border-transparent text-on-surface-variant",
        isLowTime && isActive ? "text-red-500 animate-pulse border-red-500/30 bg-red-500/10" : ""
      )}>
        {formatTime(timeRemainingMs)}
      </div>
    </div>
  );
}
