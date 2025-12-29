import { Calendar, Percent, TrendingUp, Home, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { OIInputs } from "../useOICalculations";
import { Currency, formatCurrency } from "../currencyUtils";
import { calculateAppreciationBonus } from "../valueDifferentiators";
import { quarters } from "./types";

interface ConfiguratorPreviewProps {
  inputs: OIInputs;
  currency: Currency;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Mini preview for collapsed state
const MiniPreview = ({ inputs, currency, onToggleCollapse }: ConfiguratorPreviewProps) => {
  const appreciationBonus = calculateAppreciationBonus(inputs.valueDifferentiators || []);
  
  return (
    <div className="h-full flex flex-col items-center py-4 gap-4">
      <button
        onClick={onToggleCollapse}
        className="p-1.5 rounded-md hover:bg-[#2a3142] transition-colors text-gray-400 hover:text-white"
        title="Expand preview (P)"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <div className="flex flex-col items-center gap-3 flex-1">
        {/* Property indicator */}
        <div className="flex flex-col items-center gap-1" title={`${formatCurrency(inputs.basePrice, currency)}`}>
          <DollarSign className="w-4 h-4 text-[#CCFF00]" />
          <span className="text-[10px] text-theme-text-muted font-mono">
            {(inputs.basePrice / 1000000).toFixed(1)}M
          </span>
        </div>
        
        {/* Timeline indicator */}
        <div className="flex flex-col items-center gap-1" title={`Q${inputs.handoverQuarter} ${inputs.handoverYear}`}>
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] text-theme-text-muted font-mono">
            {inputs.handoverYear.toString().slice(-2)}
          </span>
        </div>
        
        {/* Payment split indicator */}
        <div className="flex flex-col items-center gap-1" title={`${inputs.preHandoverPercent}/${100 - inputs.preHandoverPercent}`}>
          <Percent className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] text-theme-text-muted font-mono">
            {inputs.preHandoverPercent}
          </span>
        </div>
        
        {/* Rental indicator */}
        <div className="flex flex-col items-center gap-1" title={`${inputs.rentalYieldPercent}% yield`}>
          <Home className="w-4 h-4 text-green-400" />
          <span className="text-[10px] text-theme-text-muted font-mono">
            {inputs.rentalYieldPercent}%
          </span>
        </div>
        
        {/* Appreciation indicator */}
        <div className="flex flex-col items-center gap-1" title={`Appreciation +${appreciationBonus.toFixed(1)}%`}>
          <TrendingUp className="w-4 h-4 text-orange-400" />
          {appreciationBonus > 0 && (
            <span className="text-[10px] text-[#CCFF00] font-mono">
              +{appreciationBonus.toFixed(0)}
            </span>
          )}
        </div>
      </div>
      
      {/* Differentiators count */}
      {(inputs.valueDifferentiators?.length || 0) > 0 && (
        <div className="w-6 h-6 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
          <span className="text-[10px] text-[#CCFF00] font-bold">
            {inputs.valueDifferentiators?.length}
          </span>
        </div>
      )}
    </div>
  );
};

// Full preview for expanded state
export const ConfiguratorPreview = ({ inputs, currency, isCollapsed, onToggleCollapse }: ConfiguratorPreviewProps) => {
  if (isCollapsed) {
    return <MiniPreview inputs={inputs} currency={currency} onToggleCollapse={onToggleCollapse} />;
  }

  const handoverPercent = 100 - inputs.preHandoverPercent;
  const appreciationBonus = calculateAppreciationBonus(inputs.valueDifferentiators || []);
  
  // Calculate months to handover
  const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
  const handoverQuarterMonth = (inputs.handoverQuarter - 1) * 3 + 1;
  const handoverDate = new Date(inputs.handoverYear, handoverQuarterMonth - 1);
  const monthsToHandover = Math.max(0, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  // Calculate first year rent using base price (matches Year 1 projection)
  const annualRent = inputs.basePrice * (inputs.rentalYieldPercent / 100);

  // Calculate entry costs (DLD 4% + Oqood - EOI is part of downpayment, not entry cost)
  const dldFee = inputs.basePrice * 0.04;
  const totalEntryCosts = dldFee + inputs.oqoodFee;
  
  // Calculate downpayment amount (includes EOI)
  const downpaymentAmount = inputs.basePrice * (inputs.downpaymentPercent / 100);

  return (
    <div className="space-y-4">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
          Live Preview
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md hover:bg-[#2a3142] transition-colors text-gray-400 hover:text-white"
          title="Collapse preview (P)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-[#0d1117] rounded-lg border border-[#2a3142] p-4 space-y-3">
        {/* Property Value */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-theme-text-muted">
            <DollarSign className="w-3.5 h-3.5" />
            <span className="text-xs">Property</span>
          </div>
          <span className="text-sm font-mono text-white font-medium">
            {formatCurrency(inputs.basePrice, currency)}
          </span>
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-theme-text-muted">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs">Handover</span>
          </div>
          <span className="text-sm font-mono text-white">
            {quarters.find(q => q.value === inputs.handoverQuarter)?.label} {inputs.handoverYear}
            <span className="text-xs text-theme-text-muted ml-1">({monthsToHandover}mo)</span>
          </span>
        </div>

        {/* Payment Split */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-theme-text-muted">
            <Percent className="w-3.5 h-3.5" />
            <span className="text-xs">Payment</span>
          </div>
          <span className="text-sm font-mono text-white">
            {inputs.preHandoverPercent}/{handoverPercent}
          </span>
        </div>

        {/* Rental */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-theme-text-muted">
            <Home className="w-3.5 h-3.5" />
            <span className="text-xs">Rental</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-mono text-white">
              {inputs.rentalYieldPercent}%
            </span>
            <span className="text-[10px] text-theme-text-muted font-mono">
              {formatCurrency(annualRent, currency)}/yr
            </span>
          </div>
        </div>

        {/* Appreciation */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-theme-text-muted shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-xs">Appreciation</span>
          </div>
          <div className="flex flex-col items-end min-w-0">
            <span className="text-xs font-mono whitespace-nowrap">
              <span className="text-orange-400">{inputs.constructionAppreciation ?? 12}%</span>
              <span className="text-theme-text-muted mx-0.5">→</span>
              <span className="text-green-400">{inputs.growthAppreciation ?? 8}%</span>
              <span className="text-theme-text-muted mx-0.5">→</span>
              <span className="text-blue-400">{inputs.matureAppreciation ?? 4}%</span>
            </span>
            {appreciationBonus > 0 && (
              <span className="text-xs text-[#CCFF00] font-mono">
                (+{appreciationBonus.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Value Differentiators Count */}
      {(inputs.valueDifferentiators?.length || 0) > 0 && (
        <div className="bg-[#0d1117] rounded-lg border border-[#2a3142] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#CCFF00]">✨ {inputs.valueDifferentiators?.length} differentiators</span>
            <span className="text-[#CCFF00] font-mono">+{appreciationBonus.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Entry Costs Summary */}
      <div className="bg-[#0d1117] rounded-lg border border-[#2a3142] p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Total Entry Costs</span>
          <span className="text-sm font-mono text-red-400 font-bold">
            {formatCurrency(totalEntryCosts, currency)}
          </span>
        </div>
        <div className="text-[10px] text-theme-text-muted">
          <span>DLD 4% + Oqood</span>
        </div>
        
        {/* Downpayment Breakdown */}
        <div className="pt-2 border-t border-[#2a3142] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Downpayment ({inputs.downpaymentPercent}%)</span>
            <span className="text-sm font-mono text-white font-medium">
              {formatCurrency(downpaymentAmount, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-theme-text-muted">
            <span>EOI (paid at booking)</span>
            <span className="font-mono">{formatCurrency(inputs.eoiFee, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-theme-text-muted">
            <span>Remaining due</span>
            <span className="font-mono">{formatCurrency(downpaymentAmount - inputs.eoiFee, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
