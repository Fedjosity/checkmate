"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Play", href: "/play", icon: EmojiEventsIcon }, // Using EmojiEvents as a stand-in for Swords/Trophy
  { label: "Wallet", href: "/wallet", icon: AccountBalanceWalletIcon },
  { label: "Leaderboard", href: "/leaderboard", icon: LeaderboardIcon },
  { label: "Profile", href: "/profile/me", icon: PersonIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gold rounded-full flex items-center justify-center text-background shadow-[0_4px_20px_rgba(201,168,76,0.4)] focus:outline-none"
      >
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          "fixed top-16 bottom-0 left-0 w-[240px] bg-surface/90 backdrop-blur-xl border-r border-border/50 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="py-6 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 transition-all duration-300",
                  isActive
                    ? "border-l-2 border-gold bg-gold/10 text-gold shadow-[inset_4px_0_20px_rgba(201,168,76,0.15)]"
                    : "border-l-2 border-transparent text-muted hover:text-gold hover:bg-gold/5 hover:border-gold/50"
                )}
              >
                <Icon fontSize="small" className={isActive ? "drop-shadow-[0_0_8px_rgba(201,168,76,0.5)]" : ""} />
                <span className={cn("font-medium tracking-wide", isActive ? "drop-shadow-[0_0_8px_rgba(201,168,76,0.3)]" : "")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}

