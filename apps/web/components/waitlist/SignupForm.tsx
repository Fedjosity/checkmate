"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { joinWaitlistSchema, JoinWaitlistDTO } from "@checkmate/shared-types";
import { joinWaitlist } from "@/lib/api/waitlist";
import { useRouter } from "next/navigation";
import { CountrySelect, PhoneCodeSelect, COUNTRIES } from "@/components/ui/CountryDropdowns";
import { AsYouType, CountryCode } from "libphonenumber-js";

export const SignupForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JoinWaitlistDTO>({
    resolver: zodResolver(joinWaitlistSchema),
    defaultValues: {
      chessLevel: "casual",
      country: "United States",
      countryCode: "+1",
    },
  });

  const onSubmit = async (data: JoinWaitlistDTO) => {
    setError(null);
    try {
      const result = await joinWaitlist(data);
      router.push(`/beta/confirmed?email=${encodeURIComponent(result.email)}&position=${result.position}`);
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || err?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-6">
      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-sm font-body-md text-[14px]">
          {error}
        </div>
      )}
      
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1 flex flex-col gap-2">
          <label className="font-label-caps text-text-primary">Full Name</label>
          <input
            {...register("fullName")}
            className="w-full bg-surface border border-border px-4 py-3 text-text-primary rounded-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="Magnus Carlsen"
          />
          {errors.fullName && <span className="text-error text-sm">{errors.fullName.message}</span>}
        </div>
        
        <div className="flex-1 flex flex-col gap-2">
          <label className="font-label-caps text-text-primary">Email Address</label>
          <input
            {...register("email")}
            type="email"
            className="w-full bg-surface border border-border px-4 py-3 text-text-primary rounded-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="magnus@example.com"
          />
          {errors.email && <span className="text-error text-sm">{errors.email.message}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="w-1/3 flex flex-col gap-2">
          <label className="font-label-caps text-text-primary">Code</label>
          {(() => {
            const { onChange: formOnChange, ...restCodeReg } = register("countryCode");
            return (
              <PhoneCodeSelect
                {...restCodeReg}
                onChange={(e) => {
                  formOnChange(e);
                  const selectedCode = e.target.value;
                  const matchingCountry = COUNTRIES.find((c) => c.code === selectedCode);
                  if (matchingCountry) {
                    setValue("country", matchingCountry.name, { shouldValidate: true });
                  }
                }}
              />
            );
          })()}
          {errors.countryCode && <span className="text-error text-sm">{errors.countryCode.message}</span>}
        </div>
        
        <div className="w-2/3 flex flex-col gap-2">
          <label className="font-label-caps text-text-primary">Phone Number</label>
          {(() => {
            const { onChange: formOnChange, ...restPhoneReg } = register("phone");
            return (
              <input
                {...restPhoneReg}
                onChange={(e) => {
                  const currentCode = watch("countryCode");
                  const iso = COUNTRIES.find(c => c.code === currentCode)?.iso as CountryCode | undefined;
                  const formatter = new AsYouType(iso);
                  e.target.value = formatter.input(e.target.value);
                  formOnChange(e);
                }}
                className="w-full bg-surface border border-border px-4 py-3 text-text-primary rounded-sm focus:outline-none focus:border-primary transition-colors"
              />
            );
          })()}
          {errors.phone && <span className="text-error text-sm">{errors.phone.message}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-label-caps text-text-primary">Country</label>
        {(() => {
          const { onChange: formOnChange, ...restCountryReg } = register("country");
          return (
            <CountrySelect
              {...restCountryReg}
              onChange={(e) => {
                formOnChange(e);
                const selectedCountry = e.target.value;
                const matchingData = COUNTRIES.find((c) => c.name === selectedCountry);
                if (matchingData) {
                  setValue("countryCode", matchingData.code, { shouldValidate: true });
                }
              }}
            />
          );
        })()}
        {errors.country && <span className="text-error text-sm">{errors.country.message}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-label-caps text-text-primary">Chess Experience Level</label>
        <select
          {...register("chessLevel")}
          className="w-full bg-surface border border-border px-4 py-3 text-text-primary rounded-sm focus:outline-none focus:border-primary transition-colors appearance-none"
        >
          <option value="casual">Casual (Just play for fun)</option>
          <option value="club">Club Player (Local tournaments/online ratings)</option>
          <option value="competitive">Competitive (Titled/Elite Level)</option>
        </select>
        {errors.chessLevel && <span className="text-error text-sm">{errors.chessLevel.message}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-label-caps text-text-primary">Referred By (Optional Email)</label>
        <input
          {...register("referredBy")}
          type="email"
          className="w-full bg-surface border border-border px-4 py-3 text-text-primary rounded-sm focus:outline-none focus:border-primary transition-colors"
          placeholder="friend@example.com"
        />
        {errors.referredBy && <span className="text-error text-sm">{errors.referredBy.message}</span>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full py-4 mt-4 font-label-caps text-[14px] rounded-sm disabled:opacity-50 transition-opacity flex justify-center items-center gap-2"
      >
        {isSubmitting ? (
          <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
        ) : (
          "CLAIM YOUR SPOT"
        )}
      </button>
    </form>
  );
};
