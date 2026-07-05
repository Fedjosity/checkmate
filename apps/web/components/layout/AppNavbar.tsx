"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { AvatarDropdown } from "./AvatarDropdown";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

export function AppNavbar() {
  const { availableBalance, isLoading } = useAuth();
  const [animate, setAnimate] = useState(false);

  // Trigger animation when balance changes
  useEffect(() => {
    if (isLoading) return;
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 300);
    return () => clearTimeout(t);
  }, [availableBalance, isLoading]);

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-surface border-b border-border z-50 px-4 md:px-6 flex items-center justify-between">
      {/* Logo */}
      <div>
        <Image
          src="/logo2.png"
          alt="CheckMate Logo"
          width={100}
          height={50}
          className="w-auto h-auto"
        />
      </div>

      {/* Right side: Wallet & Avatar */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Crown Balance Pill */}
        <Link
          href="/wallet"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-bright transition-colors"
        >
          <span className="text-gold text-sm">♛</span>
          {isLoading ? (
            <div className="w-12 h-4 bg-white/10 rounded animate-pulse" />
          ) : (
            <span
              className={cn(
                "text-sm font-stats-mono font-bold text-white transition-all duration-300",
                animate ? "scale-110 text-gold" : "scale-100"
              )}
            >
              {availableBalance.toLocaleString()}
            </span>
          )}
        </Link>

        {/* Avatar Dropdown */}
        <AvatarDropdown />
      </div>
    </nav>
  );
}
