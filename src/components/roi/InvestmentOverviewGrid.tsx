import { useMemo } from "react";
import { Wallet, TrendingUp, Trophy, Clock, ArrowRight, Banknote, Building2 } from "lucide-react";
import { OIInputs, OICalculations } from "./useOICalculations";
import { MortgageAnalysis } from "./useMortgageCalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface InvestmentOverviewGridProps {
  inputs: OIInputs;
  calculations: OICalculations;
  mortgageAnalysis: MortgageAnalysis;
  mortgageEnabled: boolean;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
}

export const InvestmentOverviewGrid = ({
  inputs,
  calculations,
  mortgageAnalysis,
  mortgageEnabled,
  exitScenarios,
  currency,
  rate,
}: InvestmentOverviewGridProps) => {
  const { t } = useLanguage();

  // Card 1: The Entry - Cash to Start
  const entryData = useMemo(() => {
    const basePrice = calculations.basePrice;
    const downpayment = basePrice * inputs.downpaymentPercent / 100;
    const dldFee = basePrice * 0.04;
    const oqoodFee = inputs.oqoodFee || 0;
    
    // Base cash needed without mortgage
    let cashToStart = downpayment + dldFee + oqoodFee;
    
    // If mortgage is enabled, add the gap and upfront fees
    if (mortgageEnabled) {
      cashToStart += mortgageAnalysis.gapAmount + mortgageAnalysis.totalUpfrontFees;
    }

    const cashPercent = inputs.preHandoverPercent;
    const financedPercent = mortgageEnabled ? 100 - inputs.preHandoverPercent : 0;

    // Find next payment milestone
    const additionalPayments = inputs.additionalPayments || [];
    const nextPayment = additionalPayments.length > 0 ? additionalPayments[0] : null;

    return {
      cashToStart,
      cashPercent,
      financedPercent,
      nextPayment,
      totalMonths: calculations.totalMonths,
    };
  }, [inputs, calculations, mortgageAnalysis, mortgageEnabled]);

  // Card 2: The Sustainability - Monthly Cashflow
  const sustainabilityData = useMemo(() => {
    const monthlyRent = calculations.holdAnalysis.netAnnualRent / 12;
    const monthlyMortgage = mortgageEnabled ? mortgageAnalysis.monthlyPayment : 0;
    const monthlyCashflow = monthlyRent - monthlyMortgage;
    const isSelfFunding = monthlyCashflow >= 0;

    return {
      monthlyRent,
      monthlyMortgage,
      monthlyCashflow,
      isSelfFunding,
      mortgageEnabled,
    };
  }, [calculations.holdAnalysis.netAnnualRent, mortgageAnalysis.monthlyPayment, mortgageEnabled]);

  // Card 3: The Prize - Wealth Projection
  const prizeData = useMemo(() => {
    // Use the recommended exit (middle scenario or 5 years post-handover)
    const recommendedExitMonths = exitScenarios.length > 0 
      ? exitScenarios[Math.floor(exitScenarios.length / 2)] 
      : calculations.totalMonths + 60; // 5 years post-handover
    
    // Find the best exit scenario
    const bestScenario = calculations.scenarios.reduce((best, current) => 
      current.trueROE > best.trueROE ? current : best, calculations.scenarios[0]);
    
    // Calculate years post-handover for recommended exit
    const yearsPostHandover = Math.max(1, Math.round((recommendedExitMonths - calculations.totalMonths) / 12));

    // Calculate cumulative rent profit up to exit
    const handoverYearIndex = calculations.yearlyProjections.findIndex(p => p.isHandover);
    const rentProfit = calculations.yearlyProjections
      .slice(handoverYearIndex, handoverYearIndex + yearsPostHandover)
      .reduce((sum, p) => sum + (p.netIncome || 0), 0);

    // Use best scenario for display
    const saleProfit = bestScenario?.trueProfit || 0;
    const totalWealth = saleProfit + rentProfit;
    const roe = bestScenario?.trueROE || 0;

    return {
      totalWealth,
      saleProfit,
      rentProfit,
      roe,
      recommendedExitYears: yearsPostHandover,
    };
  }, [calculations, exitScenarios]);

  // Card 4: The Speed - Efficiency Metrics
  const speedData = useMemo(() => {
    const yearsToPayOff = calculations.holdAnalysis.yearsToPayOff || 0;
    const netYield = calculations.holdAnalysis.rentalYieldOnInvestment || 0;
    const marketAvgPayoff = 14.5; // Typical market average

    return {
      yearsToPayOff,
      netYield,
      marketAvgPayoff,
      isFasterThanMarket: yearsToPayOff < marketAvgPayoff,
    };
  }, [calculations.holdAnalysis]);

  // Progress bar for donut visualization
  const DonutProgress = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const percentage = Math.min(100, (value / max) * 100);
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-theme-border"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
    );
  };

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-theme-accent/15 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-theme-accent" />
        </div>
        <h2 className="text-lg font-semibold text-theme-text">{t('investmentOverview') || 'Investment Overview'}</h2>
      </div>

      {/* 4-Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: The Entry */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-16 translate-x-16" />
          
          <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {t('overviewCashToStart') || 'Cash to Start'}
            </span>
          </div>

          <div className="mb-4">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400">
              {formatCurrency(entryData.cashToStart, currency, rate)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t('includesDownpaymentFees') || 'Includes downpayment + DLD + fees'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-700">
              <div 
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${entryData.cashPercent}%` }}
              />
              {mortgageEnabled && (
                <div 
                  className="bg-blue-500/60 transition-all duration-500"
                  style={{ width: `${entryData.financedPercent}%` }}
                />
              )}
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {t('cash') || 'Cash'} {entryData.cashPercent}%
              </span>
              {mortgageEnabled && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500/60" />
                  {t('financed') || 'Financed'} {entryData.financedPercent}%
                </span>
              )}
            </div>
          </div>

          {entryData.nextPayment && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 rounded-lg px-2.5 py-1.5">
              <ArrowRight className="w-3 h-3" />
              <span>{t('nextMilestone') || 'Next'}: {entryData.nextPayment.label}</span>
            </div>
          )}
        </div>

        {/* Card 2: The Sustainability */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -translate-y-16 translate-x-16" />
          
          <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {t('overviewMonthlyPerformance') || 'Monthly Performance'}
            </span>
          </div>

          {/* Comparison Bars */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{t('rentIncome') || 'Rent Income'}</span>
                <span className="text-emerald-400 font-medium">
                  {formatCurrency(sustainabilityData.monthlyRent, currency, rate)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-700">
                <div 
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            
            {mortgageEnabled && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{t('mortgageCost') || 'Mortgage Cost'}</span>
                  <span className="text-slate-300 font-medium">
                    {formatCurrency(sustainabilityData.monthlyMortgage, currency, rate)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-700">
                  <div 
                    className="h-full rounded-full bg-slate-500"
                    style={{ 
                      width: `${Math.min(100, (sustainabilityData.monthlyMortgage / sustainabilityData.monthlyRent) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
            sustainabilityData.isSelfFunding 
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-amber-500/20 text-amber-400"
          )}>
            {sustainabilityData.isSelfFunding ? '✓' : '!'} {' '}
            {sustainabilityData.isSelfFunding 
              ? `${t('selfFunding') || 'Self-Funding'} (+${formatCurrency(sustainabilityData.monthlyCashflow, currency, rate)}/mo)`
              : `${t('monthlyGap') || 'Gap'}: ${formatCurrency(Math.abs(sustainabilityData.monthlyCashflow), currency, rate)}/mo`
            }
          </div>

          <p className="text-[10px] text-slate-500 mt-2">
            {sustainabilityData.isSelfFunding 
              ? (t('propertyPaysItself') || 'Property pays for itself')
              : (t('monthlyContributionNeeded') || 'Monthly contribution needed')
            }
          </p>
        </div>

        {/* Card 3: The Prize */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-16 translate-x-16" />
          
          <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {t('overviewProjectedProfit') || 'Projected Net Profit'}
            </span>
          </div>

          <div className="mb-3">
            <p className="text-2xl sm:text-3xl font-bold text-amber-400">
              {formatCurrency(prizeData.totalWealth, currency, rate)}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-medium">
              <TrendingUp className="w-3 h-3" />
              {t('recommendedExit') || 'Recommended Exit'}: {prizeData.recommendedExitYears} {t('years') || 'years'}
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">{t('profitFromSale') || 'Profit from Sale'}</span>
              <span className="text-slate-300">{formatCurrency(prizeData.saleProfit, currency, rate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t('profitFromRent') || 'Profit from Rent'}</span>
              <span className="text-slate-300">{formatCurrency(prizeData.rentProfit, currency, rate)}</span>
            </div>
          </div>

          {/* ROE Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold">
            ROE: {prizeData.roe.toFixed(0)}%
          </div>
        </div>

        {/* Card 4: The Speed */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -translate-y-16 translate-x-16" />
          
          <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {t('overviewBreakeven') || 'Time to Breakeven'}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-3">
            {/* Donut Chart */}
            <div className="relative">
              <DonutProgress 
                value={speedData.yearsToPayOff} 
                max={speedData.marketAvgPayoff} 
                color={speedData.isFasterThanMarket ? '#a78bfa' : '#fbbf24'}
              />
              <div className="absolute inset-0 flex items-center justify-center rotate-90">
                <span className="text-lg font-bold text-white">
                  {speedData.yearsToPayOff.toFixed(1)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold text-violet-400">
                {speedData.yearsToPayOff.toFixed(1)} <span className="text-sm font-normal text-slate-400">{t('years') || 'yrs'}</span>
              </p>
              <p className="text-[10px] text-slate-500">
                {t('marketAvg') || 'Market Avg'}: {speedData.marketAvgPayoff}y
              </p>
            </div>
          </div>

          {/* Net Yield KPI */}
          <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
            <span className="text-xs text-slate-400">{t('overviewNetYield') || 'Net Yield'}</span>
            <span className="text-sm font-bold text-violet-400">{speedData.netYield.toFixed(1)}%</span>
          </div>

          {speedData.isFasterThanMarket && (
            <p className="text-[10px] text-emerald-400 mt-2">
              ✓ {t('fasterThanMarket') || 'Faster than market average'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
