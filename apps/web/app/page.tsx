"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TrustSection } from "@/components/landing/TrustSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

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
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <TrustSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
