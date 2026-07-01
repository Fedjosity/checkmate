import Link from "next/link";
import { LiveCounter } from "@/components/waitlist/LiveCounter";
import { SignupForm } from "@/components/waitlist/SignupForm";

export default function BetaSignupPage() {
  return (
    <main className="w-full max-w-[520px] px-margin-mobile z-10 mx-auto mt-24 mb-24">
      <div className="bg-surface luxury-glow border border-border rounded-lg p-8 md:p-10 relative overflow-hidden backdrop-blur-sm">
        {/* Top Right Flourish */}
        <div className="absolute top-4 right-4 font-stats-mono text-[10px] text-text-muted/30 uppercase select-none">
          Quadrant_A1
        </div>
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              chess
            </span>
          </div>
          <div className="font-label-caps text-[12px] text-primary uppercase mb-2">Exclusive Beta Access</div>
          <h1 className="font-headline-md text-headline-md text-text-primary mb-2">Claim Your Seat at the Board</h1>
          <p className="text-text-muted font-body-md">Join the elite ranks and experience the future of high-stakes chess.</p>
        </div>

        {/* Spots Counter */}
        <div className="mb-10 bg-surface-dim p-4 border border-border rounded-sm">
          <LiveCounter />
        </div>

        {/* Form */}
        <SignupForm />

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-text-muted text-[14px]">
            Already on the list?{" "}
            <Link href="/beta/status" className="text-primary font-bold hover:underline">
              Check your status
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
