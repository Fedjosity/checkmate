"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { AvatarDropdown } from "@/components/layout/AvatarDropdown";

export const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-3 max-w-none bg-background/90 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center">
        <Link href="/">
          <Image
            alt="CheckMate Logo"
            width={300}
            height={90}
            className="h-16 md:h-20 w-auto"
            src="/logo2.png"
            priority
          />
        </Link>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {user ? (
          <AvatarDropdown />
        ) : (
          <>
            {/* Desktop Buttons (sm and up) */}
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/login">
                <Button
                  variant="secondary"
                  className="font-label-caps text-label-caps uppercase"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="primary"
                  className="font-label-caps text-label-caps"
                >
                  Create Account
                </Button>
              </Link>
            </div>

            {/* Mobile Button (below sm) */}
            <Link href="/login" className="sm:hidden">
              <Button
                variant="primary"
                className="font-label-caps text-label-caps uppercase"
              >
                Sign In
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
