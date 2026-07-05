import { CrownBundle } from '@checkmate/shared-types';
import { formatBundlePrice } from '@/lib/utils/exchangeRate';
import { cn } from '@/lib/utils/cn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Image from "next/image";

interface CrownBundleCardProps {
  bundle: CrownBundle;
  isSelected: boolean;
  onSelect: () => void;
  country: string;
}

export function CrownBundleCard({ bundle, isSelected, onSelect, country }: CrownBundleCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative rounded-xl p-5 cursor-pointer transition-all duration-300",
        isSelected
          ? "border-gold bg-gold/5 ring-1 ring-gold/40 shadow-[0_0_15px_rgba(201,168,76,0.15)]"
          : "bg-surface border border-border hover:border-gold/50"
      )}
    >
      {/* Popular Badge */}
      {bundle.popular && (
        <div className="absolute top-0 right-0 bg-gold text-background text-[10px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl tracking-widest uppercase shadow-sm">
          Popular
        </div>
      )}

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-3 left-3 text-gold drop-shadow-md">
          <CheckCircleIcon fontSize="small" />
        </div>
      )}

      <div className="flex flex-col items-center text-center mt-2">
        <span className="flex items-center gap-2 text-3xl text-gold font-bold font-stats-mono drop-shadow-[0_2px_10px_rgba(201,168,76,0.3)]">
          <Image src="/Crown Coin Logo Official.png" alt="Crown" width={28} height={28} className="object-contain" />
          {bundle.crowns.toLocaleString()}
        </span>
        <span className="text-muted text-xs uppercase tracking-widest mt-1">Crowns</span>

        <div className="w-full h-px bg-border my-4" />

        <div className="flex flex-col">
          <span className="text-xl text-white font-semibold font-stats-mono">
            {formatBundlePrice(bundle.priceWithFeeUSD, country)}
          </span>
          <span className="text-[10px] text-muted mt-1 uppercase tracking-widest">
            (incl. all fees)
          </span>
        </div>
      </div>
    </div>
  );
}
