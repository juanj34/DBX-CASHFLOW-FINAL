import React from 'react';
import { Home, Ruler, DollarSign, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Currency, formatCurrency } from '../currencyUtils';

interface ShowcaseUnitCardProps {
  unitType: string;
  unitSizeSqf: number;
  basePrice: number;
  pricePerSqft: number;
  handoverQuarter: string;
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
  handoverQuarter,
  handoverYear,
  monthsToHandover,
  currency,
  rate,
  className,
}) => {
  const calculatedM2 = Math.round(unitSizeSqf * 0.092903);

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl p-4",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80",
        "border border-slate-700/50",
        "backdrop-blur-sm",
        className
      )}
    >
      {/* Accent glow */}
      <div className="absolute bottom-0 right-0 w-28 h-28 bg-purple-500/10 blur-2xl rounded-full translate-y-1/2 translate-x-1/2" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <Home className="w-6 h-6 text-purple-400" />
          </div>
          
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">The Unit</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-lg border border-purple-500/30">
                {unitType || 'Unit'}
              </span>
            </div>
          </div>
        </div>

        {/* Size info */}
        <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-slate-700/30">
          <Ruler className="w-4 h-4 text-slate-400" />
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">{unitSizeSqf.toLocaleString()}</span>
            <span className="text-sm text-slate-400">sqft</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg text-slate-300">{calculatedM2.toLocaleString()}</span>
            <span className="text-sm text-slate-400">m²</span>
          </div>
        </div>

        {/* Price info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-400">Price</span>
            </div>
            <span className="text-xl font-bold text-white">{formatCurrency(basePrice, currency, rate)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 ml-6">Per sqft</span>
            <span className="text-sm text-slate-300">{formatCurrency(pricePerSqft, currency, rate)}</span>
          </div>
        </div>

        {/* Handover info */}
        <div className="pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-400">Handover</span>
            </div>
            <span className="text-lg font-semibold text-cyan-300">{handoverQuarter} {handoverYear}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Countdown</span>
            </div>
            <span className="text-sm text-white">{monthsToHandover} months to delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowcaseUnitCard;
