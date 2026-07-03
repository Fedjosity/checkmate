"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { AvatarDropdown } from "./AvatarDropdown";
import Image from "next/image";

export function AppNavbar() {
  const { availableBalance } = useAuth();

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
        {/* Wallet Pill (Desktop only) */}
        <Link
          href="/wallet"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/30 bg-gold/5 hover:bg-gold/10 transition-colors"
        >
          <AccountBalanceWalletIcon fontSize="small" className="text-gold" />
          <span className="text-sm font-stats-mono text-gold font-medium">
            ${(availableBalance / 100).toFixed(2)}
          </span>
        </Link>

        {/* Avatar Dropdown */}
        <AvatarDropdown />
      </div>
    </nav>
  );
}
