"use client";

import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-white mb-2">
          Dashboard
        </h1>
        <p className="text-on-surface-variant text-lg">
          Welcome back, {user?.displayName || "Player"}!
        </p>
      </div>
      
      <div className="p-12 border border-dashed border-border rounded-xl text-center">
        <p className="text-muted text-sm uppercase tracking-widest">
          Dashboard widgets coming soon
        </p>
      </div>
    </main>
  );
}
