"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { EmailOTPStep } from "@/components/onboarding/EmailOTPStep";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { Spinner } from "@/components/ui/Spinner";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isEmailVerified } = useAuth();
  
  // 1 = Email OTP, 2 = Welcome
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // If user's email is already verified (e.g. Google Sign-In), skip step 1
    if (isEmailVerified) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [user, isEmailVerified]);

  if (step === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Header */}
      <header className="w-full py-6 px-6 sm:px-12 flex justify-center relative z-10">
        <Image
          src="/logo2.png"
          alt="CheckMate"
          width={200}
          height={60}
          className="h-10 w-auto"
        />
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10 w-full max-w-xl mx-auto">
        <div className="w-full mb-8">
          <StepProgress currentStep={step} totalSteps={2} />
        </div>

        <div className="w-full">
          {step === 1 && <EmailOTPStep onSuccess={() => setStep(2)} />}
          {step === 2 && <WelcomeStep />}
        </div>
      </div>
    </main>
  );
}
