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
  const [isLoading, setIsLoading] = useState(false);


  const handleProceed = async () => {
    setIsLoading(true);

    try {
      const res = await initiateDeposit({
        bundleId: selectedBundleId,
      });
      if (res.data?.paymentLink) {
        window.location.href = res.data.paymentLink;
      } else {
        toast.error("Could not generate payment link");
        setIsLoading(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate deposit");
      setIsLoading(false);
    }
  };

  const country = user?.country || "Other";

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CROWN_BUNDLES.map((bundle) => (
          <CrownBundleCard
            key={bundle.id}
            bundle={bundle}
            isSelected={selectedBundleId === bundle.id}
            onSelect={() => {
              setSelectedBundleId(bundle.id);
            }}
            country={country}
          />
        ))}
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
