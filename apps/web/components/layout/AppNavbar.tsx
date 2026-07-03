"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/firebase/auth";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export function AppNavbar() {
  const router = useRouter();
  const { user, availableBalance, clear } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      clear();
      router.push("/");
    } catch (err) {
      console.error("Sign out error", err);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "P";
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-surface border-b border-border z-50 px-4 md:px-6 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl text-gold select-none leading-none">♔</span>
          <span className="font-headline-md text-xl text-white tracking-wider hidden sm:block">CheckMate</span>
        </Link>
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
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-background font-bold text-sm overflow-hidden">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.displayName)
              )}
            </div>
            <KeyboardArrowDownIcon fontSize="small" className="text-muted hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 bg-surface-container border border-border rounded-md shadow-xl z-50 py-1">
                <div className="px-4 py-2 border-b border-border/50 mb-1">
                  <p className="text-sm font-medium text-white truncate">{user?.displayName}</p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                </div>
                
                <Link 
                  href="/profile/me" 
                  className="block px-4 py-2 text-sm text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Profile
                </Link>
                <Link 
                  href="/settings" 
                  className="block px-4 py-2 text-sm text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Settings
                </Link>
                <div className="h-px bg-border my-1" />
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
