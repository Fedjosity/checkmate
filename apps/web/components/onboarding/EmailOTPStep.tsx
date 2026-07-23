"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { verifyEmailOTP, resendVerificationEmail } from "@/lib/api/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface EmailOTPStepProps {
  onSuccess: () => void;
}

export function EmailOTPStep({ onSuccess }: EmailOTPStepProps) {
  const { user, setEmailVerified } = useAuth();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60s cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const updated = [...otp];
      updated[index] = "";
      setOtp(updated);
      return;
    }

    // Handle single character
    const digit = cleaned[cleaned.length - 1];
    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);

    // Auto advance
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits entered
    const fullCode = updated.join("");
    if (fullCode.length === 6) {
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const digits = pasted.split("");
    const updated = Array(6).fill("");
    digits.forEach((d, i) => {
      updated[i] = d;
    });
    setOtp(updated);

    const focusIndex = Math.min(digits.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmailOTP(code);
      setEmailVerified(true);
      toast.success("Email verified successfully!");
      onSuccess();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Invalid verification code";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      await resendVerificationEmail();
      toast.success("New verification code sent to your email");
      setCooldown(60);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to resend code";
      toast.error(message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="transition-transform duration-300">
      <Card padding="lg" className="luxury-glow text-center max-w-md mx-auto w-full">
        <h2 className="font-headline-md text-headline-md text-white mb-2">
          Enter verification code
        </h2>
        <p className="text-on-surface-variant text-sm mb-8 px-4">
          We sent a 6-digit code to <strong className="text-white font-medium">{user?.email}</strong>.
          Enter it below to verify your account.
        </p>

        {/* 6 Digit Inputs */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-8">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono text-white bg-surface-container border-2 border-border focus:border-gold focus:outline-none rounded-lg transition-colors shadow-inner"
            />
          ))}
        </div>

        <div className="mb-6 space-y-4">
          <Button
            fullWidth
            onClick={() => handleVerify()}
            isLoading={isLoading}
            className="font-label-caps"
            disabled={otp.join("").length !== 6}
          >
            Verify Email
          </Button>

          <Button
            variant="secondary"
            fullWidth
            onClick={handleResend}
            isLoading={resendLoading}
            disabled={cooldown > 0}
            className="font-label-caps"
          >
            {cooldown > 0 ? `Resend Code (${cooldown}s)` : "Resend Code"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
