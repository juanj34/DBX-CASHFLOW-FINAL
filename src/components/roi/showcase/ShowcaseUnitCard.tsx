import React from 'react';
import { Home, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Currency, formatCurrency } from '../currencyUtils';

interface ShowcaseUnitCardProps {
  unitType: string;
  unitSizeSqf: number;
  basePrice: number;
  pricePerSqft: number;
  handoverLabel: string;
  handoverYear: number;
  monthsToHandover: number;
  currency: Currency;
  rate: number;
  className?: string;
}

export const ShowcaseUnitCard: React.FC<ShowcaseUnitCardProps> = ({
  unitType,
  unitSizeSqf,
  basePrice,
  pricePerSqft,
  handoverLabel,
  handoverYear,
  monthsToHandover,
  currency,
  rate,
  className,
}) => {
  const unitSizeM2 = Math.round(unitSizeSqf * 0.092903);

  return (
    <div className={cn(
      "bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Home className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/60 uppercase tracking-wide">Unit</p>
          <div className="flex items-center gap-2">
            {unitType && (
              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-bold rounded">
                {unitType}
              </span>
            )}
            <span className="text-[11px] text-white/80">
              {unitSizeSqf.toLocaleString()} sqft
              <span className="text-white/50 ml-1">({unitSizeM2} m²)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Price & Handover Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
        <div>
          <p className="text-[9px] text-white/50 uppercase mb-0.5">Price</p>
          <p className="text-sm font-bold text-white">{formatCurrency(basePrice, currency, rate)}</p>
          <p className="text-[10px] text-white/60">{formatCurrency(pricePerSqft, currency, rate)}/sqft</p>
        </div>
        <div>
          <p className="text-[9px] text-white/50 uppercase mb-0.5">Handover</p>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span className="text-sm font-bold text-white">{handoverLabel} {handoverYear}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-white/50" />
            <span className="text-[10px] text-white/60">{monthsToHandover} mo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowcaseUnitCard;
