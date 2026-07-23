"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { updateMe } from "@/lib/api/users";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CountrySelect } from "@/components/utils/CountryDropdowns";
import PersonIcon from "@mui/icons-material/Person";
import { toast } from "sonner";

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be 50 characters or less"),
  country: z.string().min(1, "Please select your country"),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ProfileStepProps {
  onSuccess: () => void;
}

export function ProfileStep({ onSuccess }: ProfileStepProps) {
  const { user } = useAuth();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // If user already has a Google display name or email name pre-filled
  const initialDisplayName =
    user?.displayName && !user.displayName.includes("@")
      ? user.displayName
      : "";

  const initialCountry = user?.country && user.country !== "Other" ? user.country : "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: initialDisplayName,
      country: initialCountry,
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const response: any = await updateMe({
        displayName: data.displayName,
        country: data.country,
      });

      if (user) {
        setUser({
          ...user,
          displayName: data.displayName,
          country: data.country,
        });
      } else if (response?.data?.user) {
        setUser(response.data.user);
      }

      toast.success("Profile details saved!");
      onSuccess();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to save profile";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="transition-transform duration-300">
      <Card padding="lg" className="luxury-glow max-w-md mx-auto w-full">
        <div className="w-16 h-16 rounded-full bg-surface-bright border border-gold/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(201,168,76,0.15)]">
          <PersonIcon fontSize="large" className="text-gold" />
        </div>

        <h2 className="font-headline-md text-headline-md text-white text-center mb-2">
          Set up your profile
        </h2>
        <p className="text-on-surface-variant text-sm text-center mb-8 px-4">
          Choose your display name and country to personalize your CheckMate account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Display Name / Full Name"
            placeholder="e.g. Grandmaster Magnus"
            error={errors.displayName?.message}
            {...register("displayName")}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white">
              Country
            </label>
            <CountrySelect {...register("country")} />
            {errors.country && (
              <p className="text-sm text-error">{errors.country.message}</p>
            )}
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            className="font-label-caps mt-2"
          >
            Continue
          </Button>
        </form>
      </Card>
    </div>
  );
}
