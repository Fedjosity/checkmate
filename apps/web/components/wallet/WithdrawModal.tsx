"use client";

import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useWallet } from "@/hooks/useWallet";
import { initiateWithdrawal } from "@/lib/api/wallet";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { useAuth } from "@/hooks/useAuth";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { availableBalance, refetch } = useWallet();
  const { user } = useAuth();
  const router = useRouter();

  const [crownsInput, setCrownsInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const bankAccount = user?.bankAccount;
  const maxCrowns = availableBalance;

  const handleCrownsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > maxCrowns) {
      setCrownsInput(maxCrowns.toString());
    } else {
      setCrownsInput(val);
    }
  };

  const handleMax = () => {
    setCrownsInput(maxCrowns.toString());
  };

  const handleWithdraw = async () => {
    const crowns = parseInt(crownsInput, 10);
    if (isNaN(crowns) || crowns < 200) {
      toast.error("Minimum withdrawal is 200 Crowns");
      return;
    }

    if (!bankAccount) {
      toast.error("Please add a bank account in Settings first");
      return;
    }

    setIsLoading(true);
    try {
      await initiateWithdrawal({ crowns });
      toast.success("Withdrawal initiated successfully");
      await refetch();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setIsLoading(false);
    }
  };

  const crownsAmount = parseInt(crownsInput, 10) || 0;
  const usdValue = crownsAmount / 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-white mb-6 tracking-wide">Withdraw Earnings</h2>
      <div className="space-y-6">
        <div className="bg-surface p-4 rounded-xl border border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted font-bold uppercase tracking-widest">
              Available to Withdraw
            </span>
            <span className="text-gold font-stats-mono font-bold">
              ♛ {maxCrowns.toLocaleString()}
            </span>
          </div>

          <div className="relative mt-4">
            <Input
              type="text"
              label="Amount to Withdraw (Crowns)"
              value={crownsInput}
              onChange={handleCrownsChange}
              placeholder="Min. 200"
              className="pr-16 font-stats-mono text-lg"
            />
            <button
              onClick={handleMax}
              className="absolute right-3 top-[34px] text-xs font-bold text-gold hover:text-white uppercase tracking-widest transition-colors"
            >
              Max
            </button>
          </div>

          <div className="mt-3 text-sm font-stats-mono text-muted text-right">
            ≈ ${usdValue.toFixed(2)} USD
          </div>
        </div>

        {/* Bank Account Selection */}
        <div className="bg-surface-bright p-4 rounded-xl border border-border/50">
          <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">
            Destination Account
          </h4>
          
          {bankAccount ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                <AccountBalanceIcon fontSize="small" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{bankAccount.bankName}</p>
                <p className="text-xs text-muted font-stats-mono">
                  {bankAccount.accountNumber} • {bankAccount.accountName}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted mb-3">No bank account linked.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  router.push("/settings");
                }}
              >
                Add Bank Account in Settings
              </Button>
            </div>
          )}
        </div>

        <div className="text-xs text-muted text-center space-y-1">
          <p>Transfers typically take 1-3 business days.</p>
          <p>CheckMate covers all withdrawal fees.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="w-full"
            onClick={handleWithdraw}
            isLoading={isLoading}
            disabled={!bankAccount || crownsAmount < 200}
          >
            Confirm Withdrawal
          </Button>
        </div>
      </div>
    </Modal>
  );
}
