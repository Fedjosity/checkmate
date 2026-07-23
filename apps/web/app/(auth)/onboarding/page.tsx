"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase/config";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { EmailOTPStep } from "@/components/onboarding/EmailOTPStep";
import { ProfileStep } from "@/components/onboarding/ProfileStep";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { Spinner } from "@/components/ui/Spinner";

type StepType = "otp" | "profile" | "welcome";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isEmailVerified } = useAuth();

  const [steps, setSteps] = useState<StepType[]>([]);
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!user || initializedRef.current) return;
    initializedRef.current = true;

    // Check if user signed up via Google
    const isGoogleUser = auth.currentUser?.providerData?.some(
      (p) => p.providerId === "google.com"
    );

    if (isGoogleUser) {
      setSteps(["profile", "welcome"]);
      setStepIndex(0);
    } else {
      // Email/Password user: Always 3 steps
      setSteps(["otp", "profile", "welcome"]);
      // If email is already verified (e.g. reloaded after OTP step), start at profile step (index 1)
      setStepIndex(isEmailVerified ? 1 : 0);
    }
  }, [user, isEmailVerified]);

  if (stepIndex === null || steps.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentStepType = steps[stepIndex];
  const currentStepNumber = stepIndex + 1;
  const totalSteps = steps.length;

  const nextStep = () => {
    setStepIndex((prev) => (prev !== null && prev < steps.length - 1 ? prev + 1 : prev));
  };

  return (
    <main className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10 w-full max-w-md mx-auto">
        <div className="w-full">
          <StepProgress currentStep={currentStepNumber} totalSteps={totalSteps} />
        </div>

        <div className="w-full">
          {currentStepType === "otp" && <EmailOTPStep onSuccess={nextStep} />}
          {currentStepType === "profile" && <ProfileStep onSuccess={nextStep} />}
          {currentStepType === "welcome" && <WelcomeStep />}
        </div>
      </div>
    </main>
  );
}
