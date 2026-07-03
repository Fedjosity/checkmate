import React from "react";
import Link from "next/link";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-24 overflow-hidden bg-grid-pattern pb-24 border-b border-border">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"></div>
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
          <div className="md:col-span-7 flex flex-col items-start gap-6 hero-content">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container border border-border rounded-sm">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-label-caps text-label-caps text-primary tracking-widest">
                1,000 BETA SPOTS
              </span>
            </div>
            <h1 className="text-[64px] md:text-[96px] font-headline-xl leading-[1.0] tracking-tighter">
              <span className="text-white block">Your Move.</span>
              <span className="text-primary block">Your Money.</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mt-4">
              The arena for serious chess competitors. Stake your skill, play at
              the highest level, and dominate the board in a premium cinematic
              environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
              <Link
                href="/beta"
                className="btn-primary px-8 py-4 font-label-caps text-label-caps rounded-sm w-full sm:w-auto text-center"
              >
                Claim Your Spot
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
