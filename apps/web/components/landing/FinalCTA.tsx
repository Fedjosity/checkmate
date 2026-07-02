import React from "react";
import Link from "next/link";

export const FinalCTA = () => {
  return (
    <section className="py-32 bg-[#0A0B0F] relative flex items-center justify-center overflow-hidden border-t border-border">
      <div className="absolute inset-0 flex justify-center items-center opacity-10 pointer-events-none">
        <span className="material-symbols-outlined text-[400px] text-primary">
          chess_king
        </span>
      </div>
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop relative z-10 text-center flex flex-col items-center">
        <h2 className="font-headline-xl text-[48px] md:text-[72px] text-white mb-6">
          Your Board Is Waiting.
        </h2>
        <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto mb-10">
          Join the beta and secure your early access spot. Serious players
          only.
        </p>
        <Link
          href="/beta"
          className="btn-primary px-12 py-5 font-headline-md text-headline-md rounded-sm shadow-[0_0_40px_rgba(201,168,76,0.3)] hover:shadow-[0_0_60px_rgba(201,168,76,0.5)]"
        >
          Claim Your Beta Spot
        </Link>
      </div>
    </section>
  );
};
