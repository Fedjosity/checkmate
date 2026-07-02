import React from "react";

export const TrustSection = () => {
  return (
    <section
      className="py-section-gap bg-surface relative overflow-hidden pt-32 pb-32"
      id="trust"
    >
      <div className="absolute inset-0 bg-cover bg-center opacity-5 transform scale-110 perspective-1000"></div>
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="trust-header">
            <h2 className="font-headline-xl text-[48px] md:text-[64px] text-white leading-tight mb-8">
              This Isn't Luck.
              <br />
              <span className="text-primary">It's Chess.</span>
            </h2>
            <p className="font-body-lg text-on-surface-variant mb-8">
              We built CheckMate for purists. No algorithms determining your
              fate. Just you, the board, and your skill.
            </p>
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-4 trust-item opacity-0">
                <span className="material-symbols-outlined text-primary mt-1">
                  shield_locked
                </span>
                <div>
                  <h4 className="font-headline-md text-[18px] text-white mb-1">
                    Stockfish 16 Anti-Cheat
                  </h4>
                  <p className="font-body-md text-on-surface-variant text-sm">
                    Real-time move analysis to ensure a fair playing field.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 trust-item opacity-0">
                <span className="material-symbols-outlined text-primary mt-1">
                  account_balance
                </span>
                <div>
                  <h4 className="font-headline-md text-[18px] text-white mb-1">
                    Instant Payouts
                  </h4>
                  <p className="font-body-md text-on-surface-variant text-sm">
                    Your winnings sit in a secure escrow.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 trust-item opacity-0">
                <span className="material-symbols-outlined text-primary mt-1">
                  group
                </span>
                <div>
                  <h4 className="font-headline-md text-[18px] text-white mb-1">
                    Elo-Based Matchmaking
                  </h4>
                  <p className="font-body-md text-on-surface-variant text-sm">
                    Only face opponents within a strict rating deviation.
                  </p>
                </div>
              </div>
            </div>
        </div>
      </div>
    </section>
  );
};
