"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils/cn";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const isSidebarCollapsed = useUIStore((s) => s.isSidebarCollapsed);

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
      if (pathname === "/onboarding") return;

      if (!user.emailVerified) {
        router.replace("/onboarding");
        return;
      }

      const done = localStorage.getItem("onboarding_complete");
      if (!done) {
        router.replace("/onboarding");
      }
    }
  }, [isAuthenticated, isLoading, user, router, pathname, isMounted]);

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isOnboarding = pathname === "/onboarding";

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div 
        className={cn(
          "min-h-screen transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[240px]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
