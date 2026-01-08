import { useMemo } from "react";
import { Wallet, TrendingUp, Clock, Banknote, Home } from "lucide-react";
import { OIInputs, OICalculations } from "./useOICalculations";
import { MortgageAnalysis } from "./useMortgageCalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface InvestmentOverviewGridProps {
  inputs: OIInputs;
  calculations: OICalculations;
  mortgageAnalysis?: MortgageAnalysis;
  mortgageEnabled?: boolean;
  exitScenarios?: number[];
  currency: Currency;
  rate: number;
  compact?: boolean; // For client view - more compact layout
}

export const InvestmentOverviewGrid = ({
  inputs,
  calculations,
  mortgageAnalysis,
  mortgageEnabled = false,
  currency,
  rate,
  compact = false,
}: InvestmentOverviewGridProps) => {
  const { t } = useLanguage();

  const showAirbnb = inputs.showAirbnbComparison;

  // Card 1: Cash to Start
  const entryData = useMemo(() => {
    const basePrice = calculations.basePrice;
    const downpayment = basePrice * inputs.downpaymentPercent / 100;
    const dldFee = basePrice * 0.04;
    const oqoodFee = inputs.oqoodFee || 0;
    
    let cashToStart = downpayment + dldFee + oqoodFee;
    
    if (mortgageEnabled && mortgageAnalysis) {
      cashToStart += mortgageAnalysis.gapAmount + mortgageAnalysis.totalUpfrontFees;
    }

    return {
      cashToStart,
      preHandoverPercent: inputs.preHandoverPercent,
      handoverPercent: 100 - inputs.preHandoverPercent,
    };
  }, [inputs, calculations, mortgageAnalysis, mortgageEnabled]);

  // Card 2: Rental Income & ROI
  const rentalData = useMemo(() => {
    const monthlyRentLT = calculations.holdAnalysis.netAnnualRent / 12;
    const annualRentLT = calculations.holdAnalysis.netAnnualRent;
    const roiLT = calculations.holdAnalysis.rentalYieldOnInvestment || 0;

    // Short-term data if enabled
    const firstFullYear = calculations.yearlyProjections.find(p => !p.isConstruction && !p.isHandover);
    const annualRentST = firstFullYear?.airbnbNetIncome || 0;
    const monthlyRentST = annualRentST / 12;
    
    // Calculate short-term ROI
    const totalCapitalInvested = calculations.basePrice + calculations.totalEntryCosts;
    const roiST = totalCapitalInvested > 0 ? (annualRentST / totalCapitalInvested) * 100 : 0;

    return {
      monthlyRentLT,
      annualRentLT,
      roiLT,
      monthlyRentST,
      annualRentST,
      roiST,
    };
  }, [calculations]);

  // Card 3: Years to Break Even
  const breakEvenData = useMemo(() => {
    const yearsToPayOffLT = calculations.holdAnalysis.yearsToPayOff || 0;
    const yearsToPayOffST = calculations.holdAnalysis.airbnbYearsToPayOff || 0;
    const netYieldLT = calculations.holdAnalysis.rentalYieldOnInvestment || 0;

    return {
      yearsToPayOffLT,
      yearsToPayOffST,
      netYieldLT,
    };
  }, [calculations.holdAnalysis]);

  // Compact card style for client view
  const cardClass = compact 
    ? "bg-theme-card border border-theme-border rounded-xl p-4"
    : "bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-xl p-5 relative overflow-hidden";

  return (
    <div className={compact ? "mb-4" : "mb-6"}>
      {/* Section Header - Hide on compact */}
      {!compact && (
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-theme-accent/15 flex items-center justify-center">
            <Home className="w-4 h-4 text-theme-accent" />
          </div>
          <h2 className="text-lg font-semibold text-theme-text">{t('investmentOverview') || 'Investment Overview'}</h2>
        </div>
      )}

      {/* Cards Grid - 3 cards now */}
      <div className={cn(
        "grid gap-4",
        compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 md:grid-cols-3"
      )}>
        {/* Card 1: Cash to Start */}
        <div className={cardClass}>
          {!compact && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-16 translate-x-16" />}
          
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              "rounded-lg flex items-center justify-center",
              compact ? "w-7 h-7 bg-emerald-500/15" : "w-8 h-8 bg-emerald-500/20"
            )}>
              <Wallet className={cn("text-emerald-400", compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
            </div>
            <span className={cn(
              "font-medium text-theme-text-muted uppercase tracking-wide",
              compact ? "text-[10px]" : "text-xs"
            )}>
              {t('overviewCashToStart') || 'Cash to Start'}
            </span>
          </div>

          <div className="mb-3">
            <p className={cn(
              "font-bold text-emerald-400",
              compact ? "text-xl" : "text-2xl sm:text-3xl"
            )}>
              {formatCurrency(entryData.cashToStart, currency, rate)}
            </p>
            <p className="text-[10px] text-theme-text-muted mt-1">
              {t('includesDownpaymentFees') || 'Includes downpayment + DLD + fees'}
            </p>
          </div>

          {/* Payment Split Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-theme-card-alt text-xs">
            <span className="text-theme-text-muted">{t('paymentPlan') || 'Plan'}:</span>
            <span className="text-theme-accent font-semibold">{entryData.preHandoverPercent}/{entryData.handoverPercent}</span>
          </div>
        </div>

        {/* Card 2: Rental Income & ROI */}
        <div className={cardClass}>
          {!compact && <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -translate-y-16 translate-x-16" />}
          
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              "rounded-lg flex items-center justify-center",
              compact ? "w-7 h-7 bg-cyan-500/15" : "w-8 h-8 bg-cyan-500/20"
            )}>
              <Banknote className={cn("text-cyan-400", compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
            </div>
            <span className={cn(
              "font-medium text-theme-text-muted uppercase tracking-wide",
              compact ? "text-[10px]" : "text-xs"
            )}>
              {t('rentalIncome') || 'Rental Income'}
            </span>
          </div>

          {/* Long Term */}
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-theme-text-muted">{t('longTerm') || 'Long Term'}</span>
              <span className={cn(
                "font-bold text-emerald-400",
                compact ? "text-lg" : "text-xl"
              )}>
                {formatCurrency(rentalData.monthlyRentLT, currency, rate)}<span className="text-xs text-theme-text-muted font-normal">/mo</span>
              </span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[9px] text-theme-text-muted">{t('annualNet') || 'Annual Net'}</span>
              <span className="text-xs text-theme-text">{formatCurrency(rentalData.annualRentLT, currency, rate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-theme-text-muted">ROI</span>
              <span className="text-xs text-cyan-400 font-semibold">{rentalData.roiLT.toFixed(1)}%</span>
            </div>
          </div>

          {/* Short Term - if toggled */}
          {showAirbnb && (
            <div className="pt-2 border-t border-theme-border">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-orange-400">{t('shortTerm') || 'Short Term'}</span>
                <span className={cn(
                  "font-bold text-orange-400",
                  compact ? "text-lg" : "text-xl"
                )}>
                  {formatCurrency(rentalData.monthlyRentST, currency, rate)}<span className="text-xs text-theme-text-muted font-normal">/mo</span>
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[9px] text-theme-text-muted">{t('annualNet') || 'Annual Net'}</span>
                <span className="text-xs text-theme-text">{formatCurrency(rentalData.annualRentST, currency, rate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-theme-text-muted">ROI</span>
                <span className="text-xs text-orange-400 font-semibold">{rentalData.roiST.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Years to Break Even */}
        <div className={cardClass}>
          {!compact && <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -translate-y-16 translate-x-16" />}
          
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              "rounded-lg flex items-center justify-center",
              compact ? "w-7 h-7 bg-violet-500/15" : "w-8 h-8 bg-violet-500/20"
            )}>
              <Clock className={cn("text-violet-400", compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
            </div>
            <span className={cn(
              "font-medium text-theme-text-muted uppercase tracking-wide",
              compact ? "text-[10px]" : "text-xs"
            )}>
              {t('overviewBreakeven') || 'Time to Breakeven'}
            </span>
          </div>

          {/* Long Term Break Even */}
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-theme-text-muted">{t('longTerm') || 'Long Term'}</span>
              <div className="text-right">
                <span className={cn(
                  "font-bold text-violet-400",
                  compact ? "text-xl" : "text-2xl"
                )}>
                  {breakEvenData.yearsToPayOffLT.toFixed(1)}
                </span>
                <span className="text-xs text-theme-text-muted ml-1">{t('years') || 'years'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[9px] text-theme-text-muted">{t('overviewNetYield') || 'Net Yield'}</span>
              <span className="text-xs text-violet-400 font-semibold">{breakEvenData.netYieldLT.toFixed(1)}%</span>
            </div>
          </div>

          {/* Short Term Break Even - if toggled */}
          {showAirbnb && (
            <div className="pt-2 border-t border-theme-border">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-orange-400">{t('shortTerm') || 'Short Term'}</span>
                <div className="text-right">
                  <span className={cn(
                    "font-bold text-orange-400",
                    compact ? "text-xl" : "text-2xl"
                  )}>
                    {breakEvenData.yearsToPayOffST.toFixed(1)}
                  </span>
                  <span className="text-xs text-theme-text-muted ml-1">{t('years') || 'years'}</span>
                </div>
              </div>
              {breakEvenData.yearsToPayOffST < breakEvenData.yearsToPayOffLT && (
                <p className="text-[9px] text-emerald-400 mt-1">
                  ✓ {(breakEvenData.yearsToPayOffLT - breakEvenData.yearsToPayOffST).toFixed(1)} {t('yearsFaster') || 'years faster'}
                </p>
              )}
            </div>
          )}

          {/* Net Yield Badge - only show in non-compact when no airbnb */}
          {!showAirbnb && !compact && (
            <div className="mt-3 flex items-center justify-between bg-theme-card/50 rounded-lg px-3 py-2">
              <span className="text-xs text-theme-text-muted">{t('overviewNetYield') || 'Net Yield'}</span>
              <span className="text-sm font-bold text-violet-400">{breakEvenData.netYieldLT.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
