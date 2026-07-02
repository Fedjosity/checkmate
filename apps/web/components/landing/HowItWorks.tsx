import React from "react";

export const HowItWorks = () => {
  return (
    <section
      className="py-section-gap bg-surface relative z-20 -mt-16 pb-32"
      id="how-it-works"
    >
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-headline-lg text-white mb-4">
            Three Moves to Your First Win
          </h2>
          <div className="h-1 w-16 bg-primary mx-auto"></div>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 mt-20">
          <div className="how-line hidden md:block absolute top-1/2 left-[16%] right-[16%] h-0.5 bg-border -translate-y-1/2 z-0 origin-left scale-x-0"></div>
          <div className="how-card relative z-10 flex flex-col items-center text-center bg-surface-container p-8 border border-border luxury-glow rounded-sm opacity-0">
            <div className="absolute -top-3 -right-3 text-border font-stats-mono text-lg">
              A1
            </div>
            <div className="w-16 h-16 rounded-full bg-surface border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(201,168,76,0.1)]">
              <span className="material-symbols-outlined text-primary text-3xl">
                account_balance_wallet
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-white mb-2">
              Deposit
            </h3>
            <p className="text-on-surface-variant font-body-md">
              Fund your secure wallet. We support major fiat
              gateways for instant liquidity.
            </p>
          </div>
          <div className="how-card relative z-10 flex flex-col items-center text-center bg-[#0D1017] p-8 border border-primary/20 luxury-glow rounded-sm transform md:-translate-y-6 opacity-0">
            <div className="absolute -top-3 -right-3 text-border font-stats-mono text-lg">
              E4
            </div>
            <div className="w-16 h-16 rounded-full bg-surface border border-primary flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(201,168,76,0.2)]">
              <span className="material-symbols-outlined text-primary text-3xl">
                swords
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary mb-2">
              Compete
            </h3>
            <p className="text-on-surface-variant font-body-md">
              Enter an elite lobby. Our matchmaking pairs you with verified
              opponents of equal skill.
            </p>
          </div>
          <div className="how-card relative z-10 flex flex-col items-center text-center bg-surface-container p-8 border border-border luxury-glow rounded-sm opacity-0">
            <div className="absolute -top-3 -right-3 text-border font-stats-mono text-lg">
              H8
            </div>
            <div className="w-16 h-16 rounded-full bg-surface border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(201,168,76,0.1)]">
              <span className="material-symbols-outlined text-primary text-3xl">
                emoji_events
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-white mb-2">
              Get Paid
            </h3>
            <p className="text-on-surface-variant font-body-md">
              Checkmate your opponent and the pot is instantly transferred to
              your balance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
