"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/firebase/auth";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PersonIcon from "@mui/icons-material/Person";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/store/ui.store";

export function AvatarDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clear } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isSidebarCollapsed = useUIStore((s) => s.isSidebarCollapsed);

  const handleSignOut = async () => {
    try {
      await signOut();
      clear();
      router.push("/");
    } catch (err) {
      console.error("Sign out error", err);
    }
  };

  if (!user) return null;

  return (
    <div className="relative w-full">
      {/* Dropdown Menu (Opens Upwards) */}
      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 w-[200px] bg-surface-container border border-border rounded-xl shadow-[0_-4px_24px_rgba(0,0,0,0.5)] z-50 py-1 overflow-hidden">
            {pathname !== "/dashboard" && (
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-sm text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                Dashboard
              </Link>
            )}
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

      {/* Trigger Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        title={isSidebarCollapsed ? "Profile & Settings" : undefined}
        className={cn(
          "flex items-center rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-border/50 focus:outline-none",
          isSidebarCollapsed ? "justify-center p-3 w-full" : "w-full gap-3 p-3"
        )}
      >
        <div className="w-10 h-10 rounded-full bg-gold flex-shrink-0 flex items-center justify-center text-background font-bold text-sm overflow-hidden shadow-inner">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <PersonIcon fontSize="medium" className="text-primary" />
          )}
        </div>
        
        {!isSidebarCollapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-white truncate">
                {user.displayName}
              </p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>

            <KeyboardArrowDownIcon
              fontSize="small"
              className={cn(
                "text-muted transition-transform duration-300",
                isDropdownOpen && "rotate-180"
              )}
            />
          </>
        )}
      </button>
    </div>
  );
}
