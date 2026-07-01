"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Hero Entrance
      gsap.fromTo(
        ".hero-content",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", stagger: 0.2 },
      );

      // Angled dividers parallax/scrub
      gsap.to(".angled-divider", {
        scrollTrigger: {
          trigger: ".angled-divider",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
        backgroundPosition: "50% 100px",
      });

      // Game Mode Cards entrance with Scrub
      gsap.fromTo(
        ".game-mode-card",
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#game-modes",
            start: "top 80%",
            end: "bottom 60%",
            scrub: 1, // Animates back when scrolled up
          },
        },
      );

      // How It Works Cards
      gsap.fromTo(
        "#how-it-works .p-8",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#how-it-works",
            start: "top 70%",
            end: "center center",
            scrub: 1,
          },
        },
      );

      // Stats Scrub
      gsap.fromTo(
        "#live-stats .p-8",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          scrollTrigger: {
            trigger: "#live-stats",
            start: "top 80%",
            end: "center 50%",
            scrub: 1,
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className="min-h-screen">
      {/*  TopAppBar  */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-6 max-w-none bg-[#0A0B0F]/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Image
            alt="CheckMate Logo"
            width={120}
            height={32}
            className="h-8 w-auto"
            src="/logo.png"
          />
          <span className="text-headline-md font-headline-md font-bold text-primary">
            CheckMate
          </span>
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <a
            className="text-on-surface-variant font-label-caps hover:text-primary transition-colors duration-300"
            href="#how-it-works"
          >
            How It Works
          </a>
          <a
            className="text-on-surface-variant font-label-caps hover:text-primary transition-colors duration-300"
            href="#game-modes"
          >
            Game Modes
          </a>
          <a
            className="text-on-surface-variant font-label-caps hover:text-primary transition-colors duration-300"
            href="#live-stats"
          >
            Live Stats
          </a>
          <a
            className="text-on-surface-variant font-label-caps hover:text-primary transition-colors duration-300"
            href="#trust"
          >
            Trust
          </a>
        </div>
        <button className="btn-primary px-6 py-3 font-label-caps text-label-caps rounded-sm hidden md:block">
          Join Beta
        </button>
      </nav>
      {/*  Hero Section  */}
      <section className="relative min-h-screen flex items-center pt-24 overflow-hidden bg-grid-pattern angled-divider pb-24">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"></div>
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
            <div className="md:col-span-7 flex flex-col items-start gap-6">
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
                The arena for serious chess competitors. Stake your skill, play
                for high stakes, and dominate the board in a premium cinematic
                environment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
                <button className="btn-primary px-8 py-4 font-label-caps text-label-caps rounded-sm w-full sm:w-auto text-center">
                  Claim Your Spot
                </button>
              </div>
            </div>
            <div className="md:col-span-5 relative mt-12 md:mt-0 h-[500px] md:h-[700px] flex items-center justify-center md:justify-end hidden md:block">
              <Image
                alt="A dramatic close-up of a premium, battle-worn golden chess king piece, emerging from deep shadows. High contrast, cinematic lighting with a luxury horology feel."
                className="object-cover object-left mask-image-linear-gradient"
                src="/hero.png"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>
      {/*  How It Works  */}
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
            <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-0.5 bg-border -translate-y-1/2 z-0"></div>
            <div className="relative z-10 flex flex-col items-center text-center bg-surface-container p-8 border border-border luxury-glow rounded-sm">
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
                Fund your secure wallet. We support major crypto and fiat
                gateways for instant liquidity.
              </p>
            </div>
            <div className="relative z-10 flex flex-col items-center text-center bg-[#0D1017] p-8 border border-primary/20 luxury-glow rounded-sm transform md:-translate-y-6">
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
                Enter a high-stakes lobby. Our matchmaking pairs you with
                verified opponents of equal skill.
              </p>
            </div>
            <div className="relative z-10 flex flex-col items-center text-center bg-surface-container p-8 border border-border luxury-glow rounded-sm">
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
      {/*  Game Modes  */}
      <section
        className="py-section-gap bg-[#0A0B0F] border-t border-border angled-divider-reverse pt-32 pb-40"
        id="game-modes"
      >
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop py-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-white mb-2">
                Pick Your Pace
              </h2>
              <p className="text-on-surface-variant font-body-lg">
                From lightning fast bullet to calculated classic play.
              </p>
            </div>
            <button className="btn-secondary px-6 py-2 font-label-caps text-label-caps rounded-sm">
              View Full Schedule
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter py-4">
            {/*  Mode 1  */}
            <div className="game-mode-card bg-surface border border-border p-6 group relative overflow-hidden rounded-sm">
              <div className="absolute top-0 right-0 w-16 h-16 bg-grid-pattern opacity-10"></div>
              <div className="flex justify-between items-start mb-8">
                <span className="material-symbols-outlined text-on-surface-variant text-3xl">
                  bolt
                </span>
                <span className="font-stats-mono text-stats-mono text-border">
                  1+0
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-white mb-1">
                Bullet
              </h3>
              <p className="text-on-surface-variant font-body-md mb-6">
                1 Min • No Increment
              </p>
              <div className="text-primary font-stats-mono text-stats-mono border-t border-border pt-4">
                Pool: $500+
              </div>
            </div>
            {/*  Mode 2 (Highlighted)  */}
            <div className="game-mode-card blitz-highlight bg-[#0D1017] border border-primary p-6 relative overflow-hidden rounded-sm luxury-glow transform scale-105 z-10">
              <div className="absolute top-0 right-0 bg-primary text-black font-label-caps text-[10px] px-3 py-1 font-bold">
                MOST POPULAR
              </div>
              <div className="flex justify-between items-start mb-8 mt-2">
                <span className="material-symbols-outlined text-primary text-3xl">
                  local_fire_department
                </span>
                <span className="font-stats-mono text-stats-mono text-primary/50">
                  5+0
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-1">
                Blitz
              </h3>
              <p className="text-on-surface-variant font-body-md mb-6">
                5 Min • No Increment
              </p>
              <div className="text-primary font-stats-mono text-stats-mono border-t border-primary/30 pt-4 flex justify-between">
                <span>Pool: $2,500+</span>
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </div>
            </div>
            {/*  Mode 3  */}
            <div className="game-mode-card bg-surface border border-border p-6 group relative overflow-hidden rounded-sm">
              <div className="flex justify-between items-start mb-8">
                <span className="material-symbols-outlined text-on-surface-variant text-3xl">
                  timer
                </span>
                <span className="font-stats-mono text-stats-mono text-border">
                  15+10
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-white mb-1">
                Rapid
              </h3>
              <p className="text-on-surface-variant font-body-md mb-6">
                15 Min • 10s Inc
              </p>
              <div className="text-primary font-stats-mono text-stats-mono border-t border-border pt-4">
                Pool: $1,200+
              </div>
            </div>
            {/*  Mode 4  */}
            <div className="game-mode-card bg-surface border border-border p-6 group relative overflow-hidden rounded-sm">
              <div className="flex justify-between items-start mb-8">
                <span className="material-symbols-outlined text-on-surface-variant text-3xl">
                  hourglass_empty
                </span>
                <span className="font-stats-mono text-stats-mono text-border">
                  30+0
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-white mb-1">
                Classic
              </h3>
              <p className="text-on-surface-variant font-body-md mb-6">
                30 Min • No Increment
              </p>
              <div className="text-primary font-stats-mono text-stats-mono border-t border-border pt-4">
                Pool: $5,000+
              </div>
            </div>
          </div>
        </div>
      </section>
      {/*  Live Stats  */}
      <section
        className="py-24 bg-[#0A0B0F] border-t border-border/50 relative overflow-hidden"
        id="live-stats"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop relative z-10 text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-3 w-3 rounded-full bg-error animate-pulse shadow-[0_0_10px_rgba(255,180,171,0.5)]"></span>
            <h2 className="font-label-caps text-label-caps text-error tracking-widest">
              IT'S HAPPENING RIGHT NOW
            </h2>
          </div>
        </div>
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative z-10">
          <div className="p-8 border-r border-border/0 md:border-border/50">
            <div className="font-headline-xl text-[48px] md:text-[64px] text-primary mb-2 font-bold tracking-tighter">
              1.2M
            </div>
            <div className="font-label-caps text-label-caps text-on-surface-variant">
              GAMES PLAYED
            </div>
          </div>
          <div className="p-8 border-r border-border/0 md:border-border/50">
            <div className="font-headline-xl text-[48px] md:text-[64px] text-primary mb-2 font-bold tracking-tighter">
              $4.5M
            </div>
            <div className="font-label-caps text-label-caps text-on-surface-variant">
              PAID OUT
            </div>
          </div>
          <div className="p-8">
            <div className="font-headline-xl text-[48px] md:text-[64px] text-primary mb-2 font-bold tracking-tighter">
              8,492
            </div>
            <div className="font-label-caps text-label-caps text-on-surface-variant">
              PLAYERS ONLINE
            </div>
          </div>
        </div>
        <div className="w-full bg-primary/10 border-y border-primary/20 py-3 mt-16 overflow-hidden flex whitespace-nowrap">
          <div className="ticker font-stats-mono text-stats-mono text-primary/80 flex gap-12">
            <span>[RECENT WIN] GM_Hikaru won $500 in 1+0 Bullet</span>
            <span>[TOURNAMENT] Sunday Million starts in 4 hours</span>
            <span>[NEW PLAYER] IM_Levon joined the arena</span>
            <span>[RECENT WIN] CheckMateKing won $150 in 5+0 Blitz</span>
            <span>[SYSTEM] Anti-cheat engine updated to v4.2</span>
            <span>[RECENT WIN] GM_Hikaru won $500 in 1+0 Bullet</span>
            <span>[TOURNAMENT] Sunday Million starts in 4 hours</span>
          </div>
        </div>
      </section>
      {/*  Trust  */}
      <section
        className="py-section-gap bg-surface relative overflow-hidden angled-divider pt-32 pb-32"
        id="trust"
      >
        <div className="absolute inset-0 bg-cover bg-center opacity-5 transform scale-110 perspective-1000"></div>
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-headline-xl text-[48px] md:text-[64px] text-white leading-tight mb-8">
                This Isn't Luck.
                <br />
                <span className="text-primary">It's Chess.</span>
              </h2>
              <p className="font-body-lg text-on-surface-variant mb-8">
                We built CheckMate for purists. No algorithms determining your
                fate. Just you, the board, and the stakes.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
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
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-primary mt-1">
                    account_balance
                  </span>
                  <div>
                    <h4 className="font-headline-md text-[18px] text-white mb-1">
                      Instant Payouts
                    </h4>
                    <p className="font-body-md text-on-surface-variant text-sm">
                      Your winnings sit in a secure smart contract or fiat
                      escrow.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
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
            <div className="relative h-[400px] bg-[#0D1017] border border-border rounded-sm p-8 flex flex-col justify-between luxury-glow">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <div className="font-label-caps text-label-caps text-on-surface-variant">
                  ENGINE ANALYSIS
                </div>
                <div className="font-stats-mono text-stats-mono text-success">
                  +1.45
                </div>
              </div>
              <div className="space-y-2 mt-4 font-stats-mono text-sm">
                <div className="flex justify-between text-on-surface-variant hover:bg-[#1A1F2E] p-1 rounded transition-colors cursor-default">
                  <span>14. Nd5</span>
                  <span>Nxd5</span>
                </div>
                <div className="flex justify-between text-primary bg-[#1A1F2E]/50 border-l-2 border-primary pl-2 py-1 rounded cursor-default">
                  <span>15. exd5</span>
                  <span>Bf5</span>
                </div>
                <div className="flex justify-between text-on-surface-variant hover:bg-[#1A1F2E] p-1 rounded transition-colors cursor-default">
                  <span>16. c4</span>
                  <span>bxc4</span>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-surface border border-border rounded flex items-center justify-center font-bold text-xs">
                    GM
                  </div>
                  <span className="font-label-caps text-xs">
                    VERIFIED PLAYER
                  </span>
                </div>
                <span className="material-symbols-outlined text-success">
                  verified_user
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/*  Final CTA  */}
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
            Join the beta and secure your starting bankroll bonus. Serious
            players only.
          </p>
          <button className="btn-primary px-12 py-5 font-headline-md text-headline-md rounded-sm shadow-[0_0_40px_rgba(201,168,76,0.3)] hover:shadow-[0_0_60px_rgba(201,168,76,0.5)]">
            Claim Your Beta Spot
          </button>
        </div>
      </section>
      {/*  Footer  */}
      <footer className="w-full px-margin-desktop py-section-gap grid grid-cols-1 md:grid-cols-4 gap-gutter bg-surface border-t border-primary/30">
        <div className="col-span-1 md:col-span-4 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Image
              alt="CheckMate Logo"
              width={100}
              height={24}
              className="h-6 w-auto grayscale opacity-50"
              src="/logo.png"
            />
            <span className="text-headline-md font-headline-md font-bold text-primary">
              CheckMate
            </span>
          </div>
          <p className="text-on-surface-variant font-body-md text-sm">
            © 2024 CheckMate. Competitive chess platform for serious
            enthusiasts.
          </p>
        </div>
        <a
          className="text-on-surface-variant font-label-caps text-label-caps hover:text-primary transition-colors"
          href="#"
        >
          Terms of Service
        </a>
        <a
          className="text-on-surface-variant font-label-caps text-label-caps hover:text-primary transition-colors"
          href="#"
        >
          Privacy Policy
        </a>
        <a
          className="text-on-surface-variant font-label-caps text-label-caps hover:text-primary transition-colors"
          href="#"
        >
          Contact Support
        </a>
        <a
          className="text-on-surface-variant font-label-caps text-label-caps hover:text-primary transition-colors"
          href="#"
        >
          Responsible Play
        </a>
      </footer>
    </div>
  );
}
