"use client";

import { useState, useRef } from "react";
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
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatarUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const response: any = await updateMe({
        displayName: data.displayName,
        country: data.country,
        avatarFile: avatarFile || undefined,
      });

      if (user) {
        setUser({
          ...user,
          displayName: data.displayName,
          country: data.country,
          avatarUrl: response?.data?.user?.avatarUrl || user.avatarUrl,
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
        <div className="flex flex-col items-center mb-6">
          <div
            className="relative w-20 h-20 rounded-full bg-surface-bright border border-gold/30 flex items-center justify-center cursor-pointer overflow-hidden shadow-[0_0_15px_rgba(201,168,76,0.15)] group transition-all hover:border-gold"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview as string}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <PersonIcon fontSize="large" className="text-gold group-hover:opacity-0 transition-opacity" />
            )}
            
            {/* Hover overlay for changing avatar */}
            <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${avatarPreview ? "opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
              <AddAPhotoIcon fontSize="small" className="text-white" />
            </div>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <p className="text-xs text-on-surface-variant mt-2">
            Upload a profile picture (Optional)
          </p>
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
