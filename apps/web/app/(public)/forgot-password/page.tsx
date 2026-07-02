"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPassword } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type ForgotForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    setFormError(null);
    try {
      await resetPassword(data.email);
      setSentEmail(data.email);
      setSent(true);
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found") {
        setFormError("No account found with this email.");
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo2.png"
            alt="CheckMate"
            width={200}
            height={60}
            className="h-12 w-auto"
          />
        </div>

        <Card padding="lg" className="luxury-glow">
          {!sent ? (
            <>
              <h1 className="font-headline-md text-headline-md text-white mb-2">
                Reset your password
              </h1>
              <p className="text-on-surface-variant text-sm mb-6">
                Enter the email address associated with your account and
                we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  error={errors.email?.message}
                  {...register("email")}
                />

                {formError && (
                  <div className="bg-error/10 border border-error/30 rounded-md px-4 py-3 text-sm text-error">
                    {formError}
                  </div>
                )}

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  className="font-label-caps text-label-caps"
                >
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircleOutlineIcon
                sx={{ fontSize: 48 }}
                className="text-success mb-4"
              />
              <h2 className="font-headline-md text-headline-md text-white mb-2">
                Check your inbox
              </h2>
              <p className="text-on-surface-variant text-sm">
                Reset link sent to{" "}
                <span className="text-gold font-medium">{sentEmail}</span>.
                Check your inbox and follow the instructions to reset your
                password.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-gold hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <ArrowBackIcon fontSize="small" />
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
