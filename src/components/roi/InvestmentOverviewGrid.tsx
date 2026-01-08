import { useMemo, useState } from "react";
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
  renderImageUrl?: string | null; // For 4th card with project image
}

export const InvestmentOverviewGrid = ({
  inputs,
  calculations,
  mortgageAnalysis,
  mortgageEnabled = false,
  currency,
  rate,
  compact = false,
  renderImageUrl,
}: InvestmentOverviewGridProps) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'lt' | 'st'>('lt');

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

  // Currently selected view's data
  const isShortTerm = viewMode === 'st';
  const currentMonthlyRent = isShortTerm ? rentalData.monthlyRentST : rentalData.monthlyRentLT;
  const currentAnnualRent = isShortTerm ? rentalData.annualRentST : rentalData.annualRentLT;
  const currentROI = isShortTerm ? rentalData.roiST : rentalData.roiLT;
  const currentBreakeven = isShortTerm ? breakEvenData.yearsToPayOffST : breakEvenData.yearsToPayOffLT;
  const accentColor = isShortTerm ? 'text-orange-400' : 'text-emerald-400';
  const accentBg = isShortTerm ? 'bg-orange-500/15' : 'bg-emerald-500/15';

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

      {/* LT/ST Toggle - Only show when Airbnb comparison is enabled */}
      {showAirbnb && (
        <div className="flex gap-1 mb-4">
          <button 
            onClick={() => setViewMode('lt')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              viewMode === 'lt' 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-theme-card-alt text-theme-text-muted hover:text-theme-text"
            )}
          >
            {t('longTerm') || 'Long Term'}
          </button>
          <button 
            onClick={() => setViewMode('st')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              viewMode === 'st' 
                ? "bg-orange-500/20 text-orange-400" 
                : "bg-theme-card-alt text-theme-text-muted hover:text-theme-text"
            )}
          >
            {t('shortTerm') || 'Short Term'}
          </button>
        </div>
      )}

      {/* Cards Grid - 3 or 4 cards based on render image */}
      <div className={cn(
        "grid gap-4",
        renderImageUrl 
          ? (compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 md:grid-cols-4")
          : (compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 md:grid-cols-3")
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
              compact ? "text-xs" : "text-xs"
            )}>
              {t('overviewCashToStart') || 'Cash to Start'}
            </span>
          </div>

          <div className="mb-3">
            <p className={cn(
              "font-bold text-emerald-400",
              compact ? "text-2xl sm:text-3xl" : "text-2xl sm:text-3xl"
            )}>
              {formatCurrency(entryData.cashToStart, currency, rate)}
            </p>
            <p className="text-xs text-theme-text-muted mt-1">
              {t('includesDownpaymentFees') || 'Includes downpayment + DLD + fees'}
            </p>
          </div>

          {/* Payment Split Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-theme-card-alt text-sm">
            <span className="text-theme-text-muted">{t('paymentPlan') || 'Plan'}:</span>
            <span className="text-theme-accent font-semibold">{entryData.preHandoverPercent}/{entryData.handoverPercent}</span>
          </div>
        </div>

        {/* Card 2: Rental Income - Shows only selected view (LT or ST) with bigger text */}
        <div className={cardClass}>
          {!compact && <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -translate-y-16 translate-x-16" />}
          
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              "rounded-lg flex items-center justify-center",
              compact ? `w-7 h-7 ${accentBg}` : `w-8 h-8 ${accentBg}`
            )}>
              <Banknote className={cn(accentColor, compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
            </div>
            <span className={cn(
              "font-medium text-theme-text-muted uppercase tracking-wide",
              compact ? "text-xs" : "text-xs"
            )}>
              {t('rentalIncome') || 'Rental Income'}
            </span>
          </div>

          <div className="mb-2">
            <p className={cn(
              "font-bold",
              accentColor,
              compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
            )}>
              {formatCurrency(currentMonthlyRent, currency, rate)}<span className="text-sm text-theme-text-muted font-normal">/mo</span>
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-theme-text-muted">{t('annualNet') || 'Annual Net'}</span>
              <span className="text-sm text-theme-text font-medium">{formatCurrency(currentAnnualRent, currency, rate)}</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs text-theme-text-muted">ROI</span>
              <span className={cn("text-sm font-semibold", accentColor)}>{currentROI.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Years to Break Even - Shows only selected view with bigger text */}
        <div className={cardClass}>
          {!compact && <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -translate-y-16 translate-x-16" />}
          
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              "rounded-lg flex items-center justify-center",
              compact ? `w-7 h-7 ${accentBg}` : `w-8 h-8 ${accentBg}`
            )}>
              <Clock className={cn(accentColor, compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
            </div>
            <span className={cn(
              "font-medium text-theme-text-muted uppercase tracking-wide",
              compact ? "text-xs" : "text-xs"
            )}>
              {t('overviewBreakeven') || 'Time to Breakeven'}
            </span>
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-bold",
                accentColor,
                compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
              )}>
                {currentBreakeven.toFixed(1)}
              </span>
              <span className="text-sm text-theme-text-muted">{t('years') || 'years'}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-theme-text-muted">{t('overviewNetYield') || 'Net Yield'}</span>
              <span className={cn("text-sm font-semibold", accentColor)}>{currentROI.toFixed(1)}%</span>
            </div>
          </div>

          {/* Comparison note when showing short-term */}
          {showAirbnb && isShortTerm && breakEvenData.yearsToPayOffST < breakEvenData.yearsToPayOffLT && (
            <p className="text-xs text-emerald-400 mt-2">
              ✓ {(breakEvenData.yearsToPayOffLT - breakEvenData.yearsToPayOffST).toFixed(1)} {t('yearsFaster') || 'years faster than LT'}
            </p>
          )}
        </div>

        {/* Card 4: Project Render Image (if available) */}
        {renderImageUrl && (
          <div className={cn(cardClass, "p-0 overflow-hidden flex items-center justify-center min-h-[120px]")}>
            <img 
              src={renderImageUrl} 
              alt="Project Render"
              className="w-full h-full object-cover"
              style={{ aspectRatio: '4/3' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};