"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && user) {
      // Allow users to access /onboarding if they haven't finished it
      if (pathname === "/onboarding") return;

      // If email not verified, send to onboarding
      if (!user.emailVerified) {
        router.replace("/onboarding");
        return;
      }

      // If onboarding not complete, send there
      const done = localStorage.getItem("onboarding_complete");
      if (!done) {
        router.replace("/onboarding");
      }
    }
  }, [isAuthenticated, isLoading, user, router, pathname, isMounted]);

  // Don't render until mounted to prevent hydration mismatch on localStorage
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isOnboarding = pathname === "/onboarding";

  // Onboarding has its own full-screen layout without navbar/sidebar
  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <AppSidebar />
      <div className="lg:ml-[240px] pt-16 min-h-screen overflow-y-auto">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
