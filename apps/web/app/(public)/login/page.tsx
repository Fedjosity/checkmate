"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { signInWithEmail, signInWithGoogle } from "@/lib/firebase/auth";
import { getMe, registerUser } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import GoogleIcon from "@mui/icons-material/Google";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const firebaseErrorMap: Record<string, string> = {
  "auth/user-not-found": "No account with this email. Create one below.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/too-many-requests": "Too many attempts. Try again later.",
  "auth/invalid-email": "Enter a valid email address.",
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const handleRedirect = (user: any) => {
    if (!user.emailVerified) {
      router.replace("/onboarding");
      return;
    }
    const done = localStorage.getItem("onboarding_complete");
    if (!done) {
      router.replace("/onboarding");
    } else {
      router.replace("/dashboard");
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await signInWithEmail(data.email, data.password);
      const response: any = await getMe();
      const user = response.data.user;
      setUser(user);
      handleRedirect(user);
    } catch (err: any) {
      const code = err?.code || "";
      const message =
        firebaseErrorMap[code] || "Sign in failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      const firebaseUser = result.user;

      // Register user (idempotent — safe to call repeatedly)
      try {
        await registerUser({
          displayName: firebaseUser.displayName || "Player",
          email: firebaseUser.email!,
          country: "Other",
        });
      } catch {
        // User may already exist — that's fine
      }

      const response: any = await getMe();
      const user = response.data.user;
      setUser(user);
      handleRedirect(user);
    } catch (err: any) {
      const message =
        err?.code === "auth/popup-closed-by-user"
          ? "Sign in cancelled."
          : "Google sign in failed. Please try again.";
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
              Welcome back
            </h1>
            <p className="text-on-surface-variant text-sm">
              Sign in to your CheckMate account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:text-primary-fixed transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="font-label-caps text-label-caps"
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="px-4 text-xs text-muted uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Sign-In */}
          <Button
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            isLoading={isGoogleLoading}
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon fontSize="small" className="mr-2" />
            Continue with Google
          </Button>

          {/* Register Link */}
          <p className="text-center mt-8 text-sm text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary hover:text-primary-fixed font-semibold transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
