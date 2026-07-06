"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/hooks/useAuth";
import { AvatarDropdown } from "./AvatarDropdown";
import { useUIStore } from "@/store/ui.store";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Play", href: "/play", icon: EmojiEventsIcon },
  { label: "Leaderboard", href: "/leaderboard", icon: LeaderboardIcon },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { availableBalance, isLoading } = useAuth();
  const [animate, setAnimate] = useState(false);
  const { isSidebarCollapsed, toggleSidebarCollapse } = useUIStore();

  useEffect(() => {
    if (isLoading) return;
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 300);
    return () => clearTimeout(t);
  }, [availableBalance, isLoading]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 right-4 z-50 w-12 h-12 bg-surface border border-border rounded-xl flex items-center justify-center text-white shadow-lg focus:outline-none"
      >
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 bg-surface border-r border-border/50 z-40 transition-all duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0 w-[240px]" : "-translate-x-full lg:translate-x-0",
          !isOpen && isSidebarCollapsed ? "lg:w-[80px]" : "lg:w-[240px]"
        )}
      >
        <div className="p-4 h-20 flex items-center justify-between shrink-0">
          <Link href="/dashboard" onClick={() => setIsOpen(false)} className={cn("transition-all duration-300", isSidebarCollapsed ? "opacity-0 w-0 hidden lg:block" : "opacity-100")}>
            {isSidebarCollapsed ? (
              <Image src="/Crown Coin Logo Official.png" alt="Logo" width={32} height={32} className="object-contain ml-1" />
            ) : (
              <Image src="/logo2.png" alt="CheckMate Logo" width={120} height={40} className="w-auto h-auto object-contain drop-shadow-[0_0_10px_rgba(201,168,76,0.3)] ml-2" />
            )}
          </Link>
          <button onClick={toggleSidebarCollapse} className="hidden lg:flex p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors">
            {isSidebarCollapsed ? <KeyboardDoubleArrowRightIcon fontSize="small" /> : <KeyboardDoubleArrowLeftIcon fontSize="small" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-3 flex flex-col gap-1 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                  isActive
                    ? "bg-gold/10 text-gold shadow-[inset_4px_0_20px_rgba(201,168,76,0.15)]"
                    : "text-muted hover:text-gold hover:bg-gold/5",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <Icon fontSize="small" className={isActive ? "drop-shadow-[0_0_8px_rgba(201,168,76,0.5)]" : ""} />
                {!isSidebarCollapsed && (
                  <span className={cn("font-medium tracking-wide", isActive ? "drop-shadow-[0_0_8px_rgba(201,168,76,0.3)]" : "")}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="shrink-0 p-4 border-t border-border/50 bg-surface/50 backdrop-blur-md flex flex-col gap-3">
          <Link href="/wallet" onClick={() => setIsOpen(false)} title={isSidebarCollapsed ? "Wallet" : undefined}>
            <div className={cn(
              "flex items-center justify-between rounded-xl bg-background border border-border hover:border-gold/30 hover:bg-white/5 transition-all group",
              isSidebarCollapsed ? "p-3 justify-center" : "px-4 py-3"
            )}>
              <div className="flex items-center gap-2">
                <Image src="/Crown Coin Logo Official.png" alt="Crowns" width={18} height={18} className="object-contain" />
                {!isSidebarCollapsed && (
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Balance</span>
                    {isLoading ? (
                      <div className="w-12 h-4 bg-white/10 rounded animate-pulse mt-0.5" />
                    ) : (
                      <span className={cn("text-sm font-stats-mono font-bold text-white transition-all duration-300", animate ? "text-gold" : "group-hover:text-gold")}>
                        {availableBalance.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {!isSidebarCollapsed && (
                <div className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center group-hover:bg-gold/20 group-hover:text-gold transition-colors">
                  <AddIcon fontSize="small" />
                </div>
              )}
            </div>
          </Link>

          <AvatarDropdown />
        </div>
      </aside>
    </>
  );
}
