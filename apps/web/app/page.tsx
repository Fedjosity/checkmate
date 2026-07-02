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
      // 1. Navbar drop-in
      gsap.fromTo(
        "nav",
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      );

      // 2. Hero Content stagger
      gsap.fromTo(
        ".hero-content > *",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", stagger: 0.15, delay: 0.2 }
      );

      // 3. Hero Image subtle scale and rotate
      gsap.fromTo(
        ".hero-content img",
        { scale: 1.1, rotationZ: 2, opacity: 0 },
        { scale: 1, rotationZ: 0, opacity: 1, duration: 1.5, ease: "power2.out", delay: 0.4 }
      );

      // 4. Background Angled Dividers Parallax
      gsap.utils.toArray(".angled-divider").forEach((divider: any) => {
        gsap.to(divider, {
          scrollTrigger: {
            trigger: divider,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          },
          backgroundPosition: "50% 150px",
          ease: "none",
        });
      });

      // 5. How It Works - Cards sequential scale-in bounce
      gsap.utils.toArray(".how-card").forEach((card: any) => {
        gsap.fromTo(
          card,
          { scale: 0.8, opacity: 0, y: 50 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "back.out(1.5)",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              end: "top 50%",
              scrub: 1,
            },
          }
        );
      });

      // 6. How It Works - Connecting Line Draw
      gsap.to(".how-line", {
        scaleX: 1,
        ease: "power2.inOut",
        duration: 1.5,
        scrollTrigger: {
          trigger: "#how-it-works",
          start: "top 60%",
          end: "center center",
          scrub: 1,
        },
      });

      // 7. Trust Section - Header and Items individual fade-in left
      gsap.fromTo(
        ".trust-header",
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".trust-header",
            start: "top 80%",
            end: "top 50%",
            scrub: 1,
          },
        }
      );

      gsap.utils.toArray(".trust-item").forEach((item: any) => {
        gsap.fromTo(
          item,
          { x: -40, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: item,
              start: "top 90%",
              end: "top 70%",
              scrub: 1,
            },
          }
        );
      });

      // 8. Final CTA - Massive King slow rotation on scrub
      gsap.to(".cta-icon", {
        rotationZ: 15,
        scale: 1.1,
        scrollTrigger: {
          trigger: ".cta-icon",
          start: "top bottom",
          end: "bottom top",
          scrub: 2,
        },
      });

      // 9. Final CTA - Content pop-in
      gsap.fromTo(
        ".cta-content",
        { scale: 0.9, opacity: 0, y: 30 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: ".cta-content",
            start: "top 80%",
            end: "center 60%",
            scrub: 1,
          },
        }
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
