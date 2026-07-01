"use client";

import { useState } from "react";
import { checkWaitlistStatus } from "@/lib/api/waitlist";
import Link from "next/link";

export default function BetaStatusPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<{
    position: number;
    peopleAhead: number;
    estimatedActivation: string;
    status: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError(null);
    setStatusData(null);

    try {
      const data = await checkWaitlistStatus(email);
      setStatusData(data);
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || err?.message || "Email not found on the waitlist.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full max-w-[520px] px-margin-mobile z-10 mx-auto mt-24 mb-24">
      <div className="bg-surface luxury-glow border border-border rounded-lg p-8 md:p-10 relative overflow-hidden backdrop-blur-sm">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              radar
            </span>
          </div>
          <div className="font-label-caps text-[12px] text-primary uppercase mb-2">Queue Tracker</div>
          <h1 className="font-headline-md text-headline-md text-text-primary mb-2">Check Your Status</h1>
          <p className="text-text-muted font-body-md">Enter your email to see your current position in the beta queue.</p>
        </div>

        {!statusData ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-sm font-body-md text-[14px]">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-text-primary">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface border border-border px-4 py-3 text-text-primary rounded-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="your@email.com"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 mt-2 rounded-sm font-label-caps tracking-wider uppercase disabled:opacity-50 flex justify-center"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                "Check Status"
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-dim p-4 border border-border rounded-sm text-center">
                <div className="font-label-caps text-text-muted text-[10px] uppercase mb-1">Your Position</div>
                <div className="font-stats-mono text-2xl text-primary">#{statusData.position}</div>
              </div>
              <div className="bg-surface-dim p-4 border border-border rounded-sm text-center">
                <div className="font-label-caps text-text-muted text-[10px] uppercase mb-1">People Ahead</div>
                <div className="font-stats-mono text-2xl text-text-primary">{statusData.peopleAhead}</div>
              </div>
            </div>
            
            <div className="bg-surface-dim p-4 border border-border rounded-sm">
              <div className="flex justify-between items-center">
                <span className="font-label-caps text-text-muted text-[10px] uppercase">Account Status</span>
                <span className="font-label-caps text-primary text-[10px] uppercase px-2 py-1 bg-primary/10 rounded-sm">
                  {statusData.status}
                </span>
              </div>
            </div>

            <button
              onClick={() => setStatusData(null)}
              className="btn-secondary w-full py-4 rounded-sm font-label-caps tracking-wider uppercase"
            >
              Check Another Email
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-text-muted text-[14px]">
            Not on the list?{" "}
            <Link href="/beta" className="text-primary font-bold hover:underline">
              Join the beta
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
