"use client";

import { useEffect } from "react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { getMe } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth.store";
import { Spinner } from "@/components/ui/Spinner";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, setUser, setLoading, clear } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const response: any = await getMe();
          setUser(response.data.user);
        } catch {
          // User exists in Firebase but not in our DB yet (pre-registration)
          setLoading(false);
        }
      } else {
        clear();
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading, clear]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
