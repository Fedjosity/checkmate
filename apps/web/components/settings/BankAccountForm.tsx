"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { saveBankAccount, getBankAccount, getBanks, resolveBankAccount } from "@/lib/api/wallet";
import { toast } from "sonner";
import { Skeleton } from "../ui/Skeleton";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const bankAccountSchema = z.object({
  bankCode: z.string().min(1, "Bank code is required"),
  accountNumber: z
    .string()
    .min(10, "Account number must be at least 10 digits")
    .max(11, "Account number must be at most 11 digits")
    .regex(/^\d+$/, "Account number must contain only numbers"),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

export function BankAccountForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [savedAccount, setSavedAccount] = useState<any>(null);
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [resolvedName, setResolvedName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    getValues,
  } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
  });

  const watchBankCode = useWatch({ control, name: "bankCode" });
  const watchAccountNumber = useWatch({ control, name: "accountNumber" });

  // Clear resolved name if inputs change
  useEffect(() => {
    setResolvedName(null);
  }, [watchBankCode, watchAccountNumber]);

  useEffect(() => {
    async function loadData() {
      try {
        const [accountRes, banksRes] = await Promise.all([
          getBankAccount(),
          getBanks("NG")
        ]);

        if (accountRes.data?.bankAccount) {
          setSavedAccount(accountRes.data.bankAccount);
        }
        
        if (banksRes.data?.banks) {
          // Sort banks alphabetically
          const sortedBanks = banksRes.data.banks.sort((a, b) => a.name.localeCompare(b.name));
          setBanks(sortedBanks);
        }
      } catch (err) {
        console.error("Failed to load bank data", err);
        toast.error("Failed to load supported banks. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleVerify = async () => {
    const { bankCode, accountNumber } = getValues();
    if (!bankCode || !accountNumber || accountNumber.length < 10) {
      toast.error("Please enter a valid bank and account number first.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await resolveBankAccount(bankCode, accountNumber);
      if (res.data?.accountName) {
        setResolvedName(res.data.accountName);
        toast.success("Account verified successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to verify account");
      setResolvedName(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: BankAccountFormValues) => {
    if (!resolvedName) {
      toast.error("Please verify the account before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const bankName = banks.find((b) => b.code === data.bankCode)?.name || data.bankCode;
      
      const res = await saveBankAccount({
        ...data,
      });
      
      if (res.data?.bankAccount) {
        const finalAccount = { ...res.data.bankAccount, bankName };
        setSavedAccount(finalAccount);
        toast.success("Bank account saved successfully!");
        reset();
        setResolvedName(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to save bank account");
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
              <p className="text-sm font-bold text-white">{savedAccount.bankName || "Saved Bank Account"}</p>
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
              {banks.map((bank) => (
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

          {resolvedName && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3">
              <CheckCircleIcon className="text-green-500 text-xl" />
              <div>
                <p className="text-xs text-muted uppercase tracking-widest font-bold">Verified Account Name</p>
                <p className="text-sm font-bold text-white">{resolvedName}</p>
              </div>
            </div>
          )}

          {!resolvedName ? (
            <Button 
              type="button" 
              variant="secondary" 
              isLoading={isVerifying} 
              onClick={handleVerify}
              className="w-full sm:w-auto"
            >
              Verify Account Details
            </Button>
          ) : (
            <Button type="submit" variant="primary" isLoading={isSaving} className="w-full sm:w-auto">
              Confirm & Save Account
            </Button>
          )}
        </form>
      )}
    </div>
  );
}
