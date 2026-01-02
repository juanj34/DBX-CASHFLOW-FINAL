import { Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { Currency, formatCurrency } from "../currencyUtils";
import { cn } from "@/lib/utils";

interface SafetyBufferPanelProps {
  netMonthlyRent: number;
  monthlyMortgageTotal: number;
  currency: Currency;
  rate: number;
  viewMode: 'monthly' | 'annual';
}

export const SafetyBufferPanel = ({
  netMonthlyRent,
  monthlyMortgageTotal,
  currency,
  rate,
  viewMode,
}: SafetyBufferPanelProps) => {
  // DSCR = Gross Income / Debt Service
  const dscr = monthlyMortgageTotal > 0 ? netMonthlyRent / monthlyMortgageTotal : 0;
  const safetyMargin = netMonthlyRent - monthlyMortgageTotal;
  const isPositive = safetyMargin >= 0;
  
  const displayMultiplier = viewMode === 'annual' ? 12 : 1;
  const displaySafety = safetyMargin * displayMultiplier;
  const displayRent = netMonthlyRent * displayMultiplier;
  const displayDebt = monthlyMortgageTotal * displayMultiplier;

  // Visual bar calculations
  const maxValue = Math.max(displayRent, displayDebt);
  const rentBarPercent = maxValue > 0 ? (displayRent / maxValue) * 100 : 0;
  const debtBarPercent = maxValue > 0 ? (displayDebt / maxValue) * 100 : 0;

  return (
    <div className="p-4 rounded-xl bg-theme-card border border-theme-border h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-medium text-theme-text-muted uppercase tracking-wider">Safety Buffer</span>
      </div>

      {/* DSCR Hero */}
      <div className="text-center mb-4">
        <div className={cn(
          "text-3xl font-bold font-mono",
          dscr >= 1.2 ? "text-emerald-400" : dscr >= 1 ? "text-yellow-400" : "text-red-400"
        )}>
          {dscr.toFixed(2)}x
        </div>
        <p className="text-[10px] text-theme-text-muted mt-1">Debt Service Coverage</p>
      </div>

      {/* Visual Bars */}
      <div className="space-y-2 flex-1">
        {/* Income Bar */}
        <div>
          <div className="flex justify-between text-[10px] text-theme-text-muted mb-1">
            <span>Net Rent</span>
            <span className="font-mono text-emerald-400">{formatCurrency(displayRent, currency, rate)}</span>
          </div>
          <div className="h-3 rounded-full bg-theme-bg overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              style={{ width: `${rentBarPercent}%` }}
            />
          </div>
        </div>

        {/* Debt Bar */}
        <div>
          <div className="flex justify-between text-[10px] text-theme-text-muted mb-1">
            <span>Debt Service</span>
            <span className="font-mono text-purple-400">{formatCurrency(displayDebt, currency, rate)}</span>
          </div>
          <div className="h-3 rounded-full bg-theme-bg overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400"
              style={{ width: `${debtBarPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Safety Margin Result */}
      <div className={cn(
        "mt-3 p-2 rounded-lg flex items-center justify-between",
        isPositive ? "bg-emerald-900/30 border border-emerald-700/50" : "bg-red-900/30 border border-red-700/50"
      )}>
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className="text-xs text-theme-text-muted">Safety Margin</span>
        </div>
        <span className={cn(
          "text-sm font-bold font-mono",
          isPositive ? "text-emerald-400" : "text-red-400"
        )}>
          {isPositive ? '+' : ''}{formatCurrency(displaySafety, currency, rate)}
        </span>
      </div>

      {/* Pitch Text */}
      <p className="text-[9px] text-theme-text-muted text-center mt-2 leading-relaxed">
        {dscr >= 1.2 
          ? "For every 1 AED of debt, the property generates " + dscr.toFixed(1) + " AED of income"
          : dscr >= 1 
            ? "Property covers debt with minimal margin"
            : "Property requires additional income to cover debt"}
      </p>
    </div>
  );
};
