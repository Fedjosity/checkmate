"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { saveBankAccount, getBankAccount } from "@/lib/api/wallet";
import { toast } from "sonner";
import { Skeleton } from "../ui/Skeleton";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

const bankAccountSchema = z.object({
  bankCode: z.string().min(1, "Bank code is required"),
  accountNumber: z
    .string()
    .min(10, "Account number must be at least 10 digits")
    .max(11, "Account number must be at most 11 digits")
    .regex(/^\d+$/, "Account number must contain only numbers"),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

// Mock list of popular banks (in a real app, you'd fetch this from Flutterwave API)
const NIGERIAN_BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "058", name: "Guaranty Trust Bank (GTB)" },
  { code: "033", name: "United Bank for Africa (UBA)" },
  { code: "032", name: "Union Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "070", name: "Fidelity Bank" },
  { code: "214", name: "First City Monument Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "035", name: "Wema Bank" },
];

export function BankAccountForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAccount, setSavedAccount] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
  });

  useEffect(() => {
    async function loadAccount() {
      try {
        const res = await getBankAccount();
        if (res.data?.bankAccount) {
          setSavedAccount(res.data.bankAccount);
        }
      } catch (err) {
        console.error("Failed to load bank account", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAccount();
  }, []);

  const onSubmit = async (data: BankAccountFormValues) => {
    setIsSaving(true);
    try {
      // Find bank name to save it alongside code
      const bankName = NIGERIAN_BANKS.find((b) => b.code === data.bankCode)?.name || data.bankCode;
      
      const res = await saveBankAccount({
        ...data,
      });
      
      if (res.data?.bankAccount) {
        // Update the display name
        const finalAccount = { ...res.data.bankAccount, bankName };
        setSavedAccount(finalAccount);
        toast.success("Bank account saved successfully");
        reset();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to verify/save bank account");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {savedAccount && (
        <div className="bg-surface-bright p-4 rounded-xl border border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold">
              <AccountBalanceIcon />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{savedAccount.bankName}</p>
              <p className="text-xs text-muted font-stats-mono mt-1">
                {savedAccount.accountNumber}
              </p>
              <p className="text-xs text-gold font-bold uppercase tracking-widest mt-1">
                {savedAccount.accountName}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSavedAccount(null)}
            className="text-xs"
          >
            Change
          </Button>
        </div>
      )}

      {!savedAccount && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-widest">
              Select Bank
            </label>
            <select
              {...register("bankCode")}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all appearance-none"
            >
              <option value="">Select a bank...</option>
              {NIGERIAN_BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
            {errors.bankCode && (
              <p className="text-xs text-red-500 mt-1">{errors.bankCode.message}</p>
            )}
          </div>

          <Input
            label="Account Number"
            type="text"
            placeholder="10-digit account number"
            {...register("accountNumber")}
            error={errors.accountNumber?.message}
            className="font-stats-mono"
          />

          <Button type="submit" variant="primary" isLoading={isSaving} className="w-full sm:w-auto">
            Verify & Save Account
          </Button>
        </form>
      )}
    </div>
  );
}
