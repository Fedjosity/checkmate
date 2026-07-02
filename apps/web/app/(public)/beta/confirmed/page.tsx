"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Image from "next/image";

const ConfirmationContent = () => {
  const searchParams = useSearchParams();
  const position = searchParams.get("position") || "???";
  const email = searchParams.get("email") || "your email";

  return (
    <div className="bg-surface luxury-glow border border-border rounded-lg p-8 md:p-10 relative overflow-hidden backdrop-blur-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center">
          <Image
            width={500}
            height={150}
            className="h-24 w-auto"
            src="/logo2.png"
            alt="CheckMate Logo"
          />
        </div>
        <div className="font-label-caps text-[12px] text-success uppercase mb-2">
          Registration Confirmed
        </div>
        <h1 className="font-headline-md text-headline-md text-text-primary mb-2">
          You're in the Queue
        </h1>
        <p className="text-text-muted font-body-md max-w-sm mx-auto">
          We've sent a confirmation to{" "}
          <strong className="text-text-primary">{email}</strong>.
        </p>
      </div>

      <div className="mb-10 bg-surface-dim p-8 border border-border rounded-sm text-center">
        <div className="font-label-caps text-text-muted uppercase mb-2 tracking-wider">
          Your Position
        </div>
        <div className="font-stats-mono text-5xl text-primary font-bold">
          #{position}
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <h3 className="font-headline-md text-lg text-text-primary border-b border-border pb-2">
          What happens next?
        </h3>

        <div className="flex gap-4 items-start">
          <div className="bg-border text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
            1
          </div>
          <div>
            <h4 className="text-text-primary font-bold mb-1">
              Keep an eye on your inbox
            </h4>
            <p className="text-text-muted text-sm">
              We will send your exclusive activation link when your spot opens
              up.
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/"
        className="btn-secondary w-full py-4 text-center rounded-sm font-label-caps tracking-wider uppercase block"
      >
        Return to Home
      </Link>
    </div>
  );
};

export default function BetaConfirmedPage() {
  return (
    <main className="w-full max-w-[520px] px-margin-mobile z-10 mx-auto mt-24 mb-24">
      <Suspense
        fallback={
          <div className="h-64 w-full bg-surface rounded-lg animate-pulse" />
        }
      >
        <ConfirmationContent />
      </Suspense>
    </main>
  );
}
