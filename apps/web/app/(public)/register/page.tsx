"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { signUpWithEmail, signInWithGoogle, sendVerificationEmail } from "@/lib/firebase/auth";
import { getMe, registerUser } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { CountrySelect } from "@/components/utils/CountryDropdowns";
import GoogleIcon from "@mui/icons-material/Google";

const registerSchema = z.object({
  displayName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be 50 characters or less"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  country: z.string().min(1, "Please select your country"),
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to continue" }),
  }),
});

type RegisterForm = z.infer<typeof registerSchema>;

const firebaseErrorMap: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 8 characters.",
  "auth/invalid-email": "Enter a valid email address.",
};

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password || password.length < 8) return 1;
    let s = 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s = 2;
    if (s >= 2 && /\d/.test(password)) s = 3;
    if (s >= 3 && /[^a-zA-Z0-9]/.test(password)) s = 4;
    return s;
  }, [password]);

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-error", "bg-secondary", "bg-primary", "bg-success"];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              level <= strength ? colors[strength] : "bg-surface-bright"
            }`}
          />
        ))}
      </div>
      {password && (
        <p
          className={`text-xs mt-1 ${
            strength <= 1
              ? "text-error"
              : strength === 2
                ? "text-secondary"
                : strength === 3
                  ? "text-primary"
                  : "text-success"
          }`}
        >
          {labels[strength]}
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      country: "",
    },
  });

  const password = watch("password", "");

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await signUpWithEmail(data.email, data.password);
      await registerUser({
        displayName: data.displayName,
        email: data.email,
        country: data.country,
      });
      // Send Firebase native verification email
      await sendVerificationEmail();

      const response: any = await getMe();
      setUser(response.data.user);
      router.replace("/onboarding");
    } catch (err: any) {
      const code = err?.code || "";
      const message =
        firebaseErrorMap[code] || err?.message || "Registration failed. Try again.";
      console.error("Registration Error: ", err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      const firebaseUser = result.user;
      try {
        await registerUser({
          displayName: firebaseUser.displayName || "Player",
          email: firebaseUser.email!,
          country: "Other",
        });
      } catch {
        // Already exists — fine
      }
      const response: any = await getMe();
      setUser(response.data.user);

      const user = response.data.user;
      if (!user.emailVerified) {
        router.replace("/onboarding");
      } else {
        const done = localStorage.getItem("onboarding_complete");
        router.replace(done ? "/dashboard" : "/onboarding");
      }
    } catch (err: any) {
      const message =
        err?.code === "auth/popup-closed-by-user"
          ? "Sign up cancelled."
          : "Google sign up failed. Please try again.";
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-background">
      {/* Left Panel */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/auth.jpg"
          alt="CheckMate Arena"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-start">
            <Image
              src="/logo2.png"
              alt="CheckMate"
              width={300}
              height={90}
              className="h-24 w-auto"
            />
          </div>

          <div className="mb-8">
            <h1 className="font-headline-lg text-headline-md text-white mb-2">
              Create your account
            </h1>
            <p className="text-on-surface-variant text-sm">
              Set up your CheckMate profile and start competing
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Your display name"
              error={errors.displayName?.message}
              {...register("displayName")}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                error={errors.password?.message}
                {...register("password")}
              />
              <PasswordStrengthBar password={password} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white">
                Country
              </label>
              <CountrySelect {...register("country")} />
              {errors.country && (
                <p className="text-sm text-error">{errors.country.message}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div>
              <Checkbox
                id="terms"
                {...register("terms")}
                label={
                  <>
                    I am 18 or older and agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      className="text-primary hover:text-primary-fixed transition-colors"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      className="text-primary hover:text-primary-fixed transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </>
                }
              />
              {errors.terms && (
                <p className="text-sm text-error mt-1">
                  {errors.terms.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="font-label-caps text-label-caps"
            >
              Create Account
            </Button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="px-4 text-xs text-muted uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            isLoading={isGoogleLoading}
            onClick={handleGoogleSignUp}
          >
            <GoogleIcon fontSize="small" className="mr-2" />
            Continue with Google
          </Button>

          <p className="text-center mt-8 text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-gold text-primary hover:text-primary-fixed font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
