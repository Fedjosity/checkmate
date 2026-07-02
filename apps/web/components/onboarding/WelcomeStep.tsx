"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function WelcomeStep() {
  const router = useRouter();

  const handleFinish = (destination: "/play" | "/dashboard") => {
    localStorage.setItem("onboarding_complete", "true");
    router.push(destination);
  };

  return (
    <div className="text-center max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <span className="text-[120px] text-gold select-none leading-none inline-block animate-gold-pulse">
          ♔
        </span>
      </div>

      <h1 className="font-headline-xl text-headline-lg text-white mb-2">
        You&apos;re ready to play.
      </h1>
      <p className="font-headline-md text-xl text-gold mb-8">
        Welcome to CheckMate.
      </p>

      <div className="flex items-center justify-center gap-3 mb-8">
        <Badge variant="gold" className="px-3 py-1 text-sm font-label-caps tracking-wider">
          ✓ Account Created
        </Badge>
        <Badge variant="success" className="px-3 py-1 text-sm font-label-caps tracking-wider">
          ✓ Email Verified
        </Badge>
      </div>

      <p className="text-on-surface-variant text-sm leading-relaxed mb-10 max-w-sm mx-auto">
        Choose how you want to play — friendly games to warm up, competitive for
        ranked glory, or paid competitive when you&apos;re ready to put your skill
        on the line.
      </p>

      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <Button
          onClick={() => handleFinish("/play")}
          size="lg"
          fullWidth
          className="font-label-caps text-sm tracking-widest"
        >
          Let&apos;s Play — Choose a Mode
        </Button>
        <Button
          onClick={() => handleFinish("/dashboard")}
          variant="secondary"
          size="lg"
          fullWidth
          className="font-label-caps text-sm tracking-widest border-border text-white hover:border-gold/50"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
