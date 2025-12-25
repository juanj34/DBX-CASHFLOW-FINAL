import { Calendar, Percent, TrendingUp, Home, DollarSign } from "lucide-react";
import { OIInputs } from "../useOICalculations";
import { Currency, formatCurrency } from "../currencyUtils";
import { calculateAppreciationBonus } from "../valueDifferentiators";
import { quarters } from "./types";

interface ConfiguratorPreviewProps {
  inputs: OIInputs;
  currency: Currency;
}

export const ConfiguratorPreview = ({ inputs, currency }: ConfiguratorPreviewProps) => {
  const handoverPercent = 100 - inputs.preHandoverPercent;
  const appreciationBonus = calculateAppreciationBonus(inputs.valueDifferentiators || []);
  
  // Calculate months to handover
  const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
  const handoverQuarterMonth = (inputs.handoverQuarter - 1) * 3 + 1;
  const handoverDate = new Date(inputs.handoverYear, handoverQuarterMonth - 1);
  const monthsToHandover = Math.max(0, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  // Calculate first year rent
  const annualRent = inputs.basePrice * (inputs.rentalYieldPercent / 100);

  return (
    <div className="bg-[#0d1117] rounded-lg border border-[#2a3142] p-4 space-y-4">
      <div className="text-sm font-medium text-gray-400 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
        Live Preview
      </div>

      <div className="space-y-3">
        {/* Property Value */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <DollarSign className="w-3.5 h-3.5" />
            <span className="text-xs">Property</span>
          </div>
          <span className="text-sm font-mono text-white font-medium">
            {formatCurrency(inputs.basePrice, currency)}
          </span>
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs">Handover</span>
          </div>
          <span className="text-sm font-mono text-white">
            {quarters.find(q => q.value === inputs.handoverQuarter)?.label} {inputs.handoverYear}
            <span className="text-xs text-gray-500 ml-1">({monthsToHandover}mo)</span>
          </span>
        </div>

        {/* Payment Split */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <Percent className="w-3.5 h-3.5" />
            <span className="text-xs">Payment</span>
          </div>
          <span className="text-sm font-mono text-white">
            {inputs.preHandoverPercent}/{handoverPercent}
          </span>
        </div>

        {/* Rental Yield */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <Home className="w-3.5 h-3.5" />
            <span className="text-xs">Rental</span>
          </div>
          <span className="text-sm font-mono text-white">
            {inputs.rentalYieldPercent}%
            <span className="text-xs text-gray-500 ml-1">
              ({formatCurrency(annualRent, currency)}/yr)
            </span>
          </span>
        </div>

        {/* Appreciation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-xs">Appreciation</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono">
              <span className="text-orange-400">{inputs.constructionAppreciation ?? 12}%</span>
              <span className="text-gray-600 mx-0.5">→</span>
              <span className="text-green-400">{inputs.growthAppreciation ?? 8}%</span>
              <span className="text-gray-600 mx-0.5">→</span>
              <span className="text-blue-400">{inputs.matureAppreciation ?? 4}%</span>
            </span>
            {appreciationBonus > 0 && (
              <span className="text-xs text-[#CCFF00] font-mono ml-1">
                (+{appreciationBonus.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Value Differentiators Count */}
      {(inputs.valueDifferentiators?.length || 0) > 0 && (
        <div className="pt-3 border-t border-[#2a3142]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#CCFF00]">✨ {inputs.valueDifferentiators?.length} differentiators</span>
            <span className="text-[#CCFF00] font-mono">+{appreciationBonus.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Total Entry Cost */}
      <div className="pt-3 border-t border-[#2a3142]">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Today's Commitment</span>
          <span className="text-sm font-mono text-[#CCFF00] font-bold">
            {formatCurrency(
              inputs.eoiFee + (inputs.basePrice * 0.04) + inputs.oqoodFee,
              currency
            )}
          </span>
        </div>
        <div className="text-[10px] text-gray-600 mt-1">
          EOI + DLD 4% + Oqood
        </div>
      </div>
    </div>
  );
};
