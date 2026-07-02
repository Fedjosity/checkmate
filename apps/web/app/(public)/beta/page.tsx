import Link from "next/link";
import { LiveCounter } from "@/components/waitlist/LiveCounter";
import { SignupForm } from "@/components/waitlist/SignupForm";
import Image from "next/image";

export default function BetaSignupPage() {
  return (
    <main className="w-full max-w-[520px] px-margin-mobile z-10 mx-auto mt-24 mb-24">
      <div className="bg-surface luxury-glow border border-border rounded-lg p-8 md:p-10 relative overflow-hidden backdrop-blur-sm">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Image
              width={500}
              height={150}
              className="h-24 w-auto"
              src="/logo.png"
              alt="CheckMate Logo"
            />
          </div>
          <div className="font-label-caps text-[12px] text-primary uppercase mb-2">
            Exclusive Beta Access
          </div>
          <h1 className="font-headline-md text-headline-md text-text-primary mb-2">
            Claim Your Seat at the Board
          </h1>
          <p className="text-text-muted font-body-md">
            Join the elite ranks and experience the future of professional
            chess.
          </p>
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
            <Link
              href="/beta/status"
              className="text-primary font-bold hover:underline"
            >
              Check your status
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
