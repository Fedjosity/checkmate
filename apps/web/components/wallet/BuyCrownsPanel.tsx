"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CROWN_BUNDLES } from "@checkmate/shared-types";
import { CrownBundleCard } from "./CrownBundleCard";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { initiateDeposit } from "@/lib/api/wallet";
import { formatBundlePrice } from "@/lib/utils/exchangeRate";
import { toast } from "sonner";
import Image from "next/image";

export function BuyCrownsPanel() {
  const { user } = useAuth();
  const [selectedBundleId, setSelectedBundleId] = useState<string>(
    CROWN_BUNDLES.find((b) => b.popular)?.id ?? CROWN_BUNDLES[0].id
  );
  const [customCrowns, setCustomCrowns] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const isCustomMode = selectedBundleId === "custom";

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setCustomCrowns(val);
  };

  const getCustomPriceInfo = () => {
    if (!customCrowns) return null;
    const crowns = parseInt(customCrowns, 10);
    if (isNaN(crowns)) return null;
    const usd = crowns / 100;
    const withFee = usd * 1.02;
    return withFee;
  };

  const handleProceed = async () => {
    let payload: { bundleId?: string; customCrowns?: number } = {};

    if (isCustomMode) {
      const crowns = parseInt(customCrowns, 10);
      if (isNaN(crowns) || crowns < 100) {
        toast.error("Minimum custom purchase is 100 Crowns");
        return;
      }
      payload = { customCrowns: crowns };
    } else {
      payload = { bundleId: selectedBundleId };
    }

    try {
      setIsLoading(true);
      const res = await initiateDeposit(payload);
      if (res.data?.paymentLink) {
        window.location.href = res.data.paymentLink;
      } else {
        toast.error("Could not generate payment link");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate deposit");
      setIsLoading(false);
    }
  };

  const country = user?.country || "Other";
  const customFeeUSD = getCustomPriceInfo();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide">
          Select a Bundle
        </h2>
        <p className="text-sm text-muted mt-1 flex items-center gap-1.5">
          Purchase Crowns to enter matches. 100 <Image src="/Crown Coin Logo Official.png" alt="Crown" width={14} height={14} /> = $1.00 USD.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CROWN_BUNDLES.map((bundle) => (
          <CrownBundleCard
            key={bundle.id}
            bundle={bundle}
            isSelected={selectedBundleId === bundle.id}
            onSelect={() => {
              setSelectedBundleId(bundle.id);
              setCustomCrowns("");
            }}
            country={country}
          />
        ))}

        {/* Custom Input Card */}
        <div
          onClick={() => setSelectedBundleId("custom")}
          className={`relative rounded-xl p-5 cursor-pointer transition-all duration-300 ${
            isCustomMode
              ? "border-gold bg-gold/5 ring-1 ring-gold/40 shadow-[0_0_15px_rgba(201,168,76,0.15)]"
              : "bg-surface border border-border hover:border-gold/50"
          }`}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-sm font-bold uppercase tracking-widest text-muted mb-4">
              Custom Amount
            </span>
            <Input
              type="text"
              placeholder="Min. 100"
              value={customCrowns}
              onChange={handleCustomChange}
              onFocus={() => setSelectedBundleId("custom")}
              className="text-center font-stats-mono text-xl"
            />
            {isCustomMode && customFeeUSD && (
              <span className="text-sm text-white font-stats-mono font-bold mt-4">
                Total: {formatBundlePrice(customFeeUSD, country)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="sticky bottom-4 z-10 bg-surface/80 backdrop-blur-md p-4 rounded-xl border border-border shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted hidden sm:block">
          Secure payment powered by <span className="font-bold text-white">Flutterwave</span>
        </div>
        <Button
          onClick={handleProceed}
          isLoading={isLoading}
          variant="primary"
          size="lg"
          className="w-full sm:w-auto min-w-[200px]"
        >
          Proceed to Payment →
        </Button>
      </div>
    </div>
  );
}
