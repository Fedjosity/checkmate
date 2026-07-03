"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { sendVerificationEmail } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { toast } from "sonner";

interface EmailOTPStepProps {
  onSuccess: () => void;
}

export function EmailOTPStep({ onSuccess }: EmailOTPStepProps) {
  const { user, setEmailVerified } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckVerification = async () => {
    setIsLoading(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setEmailVerified(true);
          toast.success("Email verified successfully!");
          onSuccess();
        } else {
          toast.error("Email not verified yet. Please check your inbox.");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to check verification status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await sendVerificationEmail();
      toast.success("Verification link resent to your email");
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend link");
    }
  };

  return (
    <div className="transition-transform duration-300">
      <Card padding="lg" className="luxury-glow text-center max-w-md mx-auto w-full">
        <div className="w-16 h-16 rounded-full bg-surface-bright border border-gold/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(201,168,76,0.15)]">
          <MailOutlineIcon fontSize="large" className="text-gold" />
        </div>

        <h2 className="font-headline-md text-headline-md text-white mb-2">
          Verify your email
        </h2>
        <p className="text-on-surface-variant text-sm mb-8 px-4">
          We sent a verification link to <strong className="text-white font-medium">{user?.email}</strong>.
          Please click the link in that email, then click the button below.
        </p>

        <div className="mb-6 space-y-4">
          <Button 
            fullWidth 
            onClick={handleCheckVerification} 
            isLoading={isLoading}
            className="font-label-caps"
          >
            I have verified my email
          </Button>
          
          <Button 
            variant="secondary"
            fullWidth 
            onClick={handleResend} 
            className="font-label-caps"
          >
            Resend Link
          </Button>
        </div>
      </Card>
    </div>
  );
}
