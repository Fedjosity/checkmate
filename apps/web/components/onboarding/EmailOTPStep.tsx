"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { verifyEmailOTP, resendVerificationEmail } from "@/lib/api/auth";
import { OTPInput } from "@/components/ui/OTPInput";
import { Card } from "@/components/ui/Card";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { toast } from "sonner";

interface EmailOTPStepProps {
  onSuccess: () => void;
}

export function EmailOTPStep({ onSuccess }: EmailOTPStepProps) {
  const { user, setEmailVerified } = useAuth();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(60);

  // Handle countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (code.length === 6 && !isLoading && !isSuccess) {
      handleSubmit(code);
    }
  }, [code]);

  const handleSubmit = async (submitCode: string) => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage("");

    try {
      await verifyEmailOTP(submitCode);
      
      // Success flow
      setIsSuccess(true);
      setEmailVerified(true);
      
      // Briefly show success state before advancing
      setTimeout(() => {
        onSuccess();
      }, 800);
      
    } catch (err: any) {
      // Error flow
      setIsError(true);
      setErrorMessage(err?.message || "Verification failed");
      setCode("");
      
      // Remove shake animation class after it completes so it can trigger again
      setTimeout(() => setIsError(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    try {
      await resendVerificationEmail();
      setCountdown(60);
      setCode("");
      toast.success("New code sent to your email");
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend code");
    }
  };

  return (
    <div className={`transition-transform duration-300 ${isError ? "animate-shake" : ""}`}>
      <Card padding="lg" className="luxury-glow text-center max-w-md mx-auto w-full">
        <div className="w-16 h-16 rounded-full bg-surface-bright border border-gold/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(201,168,76,0.15)]">
          <MailOutlineIcon fontSize="large" className="text-gold" />
        </div>

        <h2 className="font-headline-md text-headline-md text-white mb-2">
          Verify your email
        </h2>
        <p className="text-on-surface-variant text-sm mb-8 px-4">
          We sent a 6-digit code to <strong className="text-white font-medium">{user?.email}</strong>.
          Enter it below to verify your account.
        </p>

        <div className="mb-6">
          <OTPInput
            length={6}
            value={code}
            onChange={setCode}
            disabled={isLoading || isSuccess}
            loading={isLoading}
            error={isError}
            success={isSuccess}
          />
        </div>

        <div className="min-h-[24px] mb-8">
          {errorMessage && (
            <p className="text-sm text-error font-medium">{errorMessage}</p>
          )}
        </div>

        <div className="text-sm">
          {countdown > 0 ? (
            <p className="text-muted">
              Resend available in {countdown}s
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-gold hover:text-primary font-semibold transition-colors focus:outline-none"
            >
              Resend code
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
