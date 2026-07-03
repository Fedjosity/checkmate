"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/firebase/auth";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PersonIcon from "@mui/icons-material/Person";

export function AvatarDropdown() {
  const router = useRouter();
  const { user, clear } = useAuth();
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

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-background font-bold text-sm overflow-hidden">
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
        <KeyboardArrowDownIcon
          fontSize="small"
          className="text-muted hidden sm:block"
        />
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
              <p className="text-sm font-medium text-white truncate">
                {user.displayName}
              </p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>

            <Link
              href="/dashboard"
              className="block px-4 py-2 text-sm text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              Dashboard
            </Link>
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
  );
}
