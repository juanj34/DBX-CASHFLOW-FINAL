import { useMemo } from "react";
import { 
  Wallet, TrendingUp, Trophy, Clock, ArrowRight, Banknote, Building2, 
  Key, Gem, Target, BarChart3, Home, Building, Zap, DollarSign,
  Calendar, Percent, CreditCard, Shield
} from "lucide-react";
import { OIInputs, OICalculations } from "./useOICalculations";
import { MortgageAnalysis, MortgageInputs } from "./useMortgageCalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PaymentHorizontalTimeline } from "./PaymentHorizontalTimeline";

interface InvestmentStoryDashboardProps {
  inputs: OIInputs;
  calculations: OICalculations;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
}

// Donut Progress Component
const DonutProgress = ({ value, max, color, size = 64 }: { value: number; max: number; color: string; size?: number }) => {
  const percentage = Math.min(100, (value / max) * 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg className="-rotate-90" style={{ width: size, height: size }} viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        className="text-slate-700/50"
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
        className="transition-all duration-700"
      />
    </svg>
  );
};

// Mini KPI Badge Component
const KPIBadge = ({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: React.ElementType }) => (
  <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/30">
    <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", `bg-${color}-500/20`)}>
      <Icon className={cn("w-3.5 h-3.5", `text-${color}-400`)} />
    </div>
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={cn("text-sm font-bold font-mono", `text-${color}-400`)}>{value}</p>
    </div>
  </div>
);

export const InvestmentStoryDashboard = ({
  inputs,
  calculations,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  currency,
  rate,
}: InvestmentStoryDashboardProps) => {
  const { t } = useLanguage();
  const mortgageEnabled = mortgageInputs.enabled;

  // ===== ACT 1: ENTRY DATA =====
  const entryData = useMemo(() => {
    const basePrice = calculations.basePrice;
    const downpayment = basePrice * inputs.downpaymentPercent / 100;
    const dldFee = basePrice * 0.04;
    const oqoodFee = inputs.oqoodFee || 0;
    
    let cashToStart = downpayment + dldFee + oqoodFee;
    let totalCashPreHandover = basePrice * inputs.preHandoverPercent / 100 + dldFee + oqoodFee;
    
    if (mortgageEnabled) {
      cashToStart += mortgageAnalysis.gapAmount + mortgageAnalysis.totalUpfrontFees;
      totalCashPreHandover += mortgageAnalysis.gapAmount + mortgageAnalysis.totalUpfrontFees;
    }

    const cashPercent = inputs.preHandoverPercent;
    const financedPercent = mortgageEnabled ? 100 - inputs.preHandoverPercent : 0;

    return {
      basePrice,
      cashToStart,
      totalCashPreHandover,
      cashPercent,
      financedPercent,
      downpaymentPercent: inputs.downpaymentPercent,
      loanAmount: mortgageEnabled ? mortgageAnalysis.loanAmount : 0,
      monthlyMortgage: mortgageEnabled ? mortgageAnalysis.monthlyPayment : 0,
      interestRate: mortgageInputs.interestRate,
      loanTerm: mortgageInputs.loanTermYears,
      hasGap: mortgageAnalysis.hasGap,
      gapAmount: mortgageAnalysis.gapAmount,
    };
  }, [inputs, calculations, mortgageAnalysis, mortgageEnabled, mortgageInputs]);

  // ===== ACT 2: HOLDING DATA =====
  const holdingData = useMemo(() => {
    const monthlyRentLT = calculations.holdAnalysis.netAnnualRent / 12;
    const monthlyMortgage = mortgageEnabled ? mortgageAnalysis.monthlyPayment : 0;
    const monthlyInsurance = mortgageEnabled ? mortgageAnalysis.totalAnnualInsurance / 12 : 0;
    const totalMortgageCost = monthlyMortgage + monthlyInsurance;
    const monthlyCashflowLT = monthlyRentLT - totalMortgageCost;
    
    // Short-term calculations
    const showAirbnb = inputs.showAirbnbComparison;
    const firstFullYear = calculations.yearlyProjections.find(p => !p.isConstruction && !p.isHandover);
    const monthlyRentST = firstFullYear?.airbnbNetIncome ? firstFullYear.airbnbNetIncome / 12 : 0;
    const monthlyCashflowST = monthlyRentST - totalMortgageCost;

    // Payback periods
    const yearsToPayOffLT = calculations.holdAnalysis.yearsToPayOff;
    const yearsToPayOffST = calculations.holdAnalysis.airbnbYearsToPayOff;
    const marketAvgPayoff = 14.5;

    // Coverage calculation
    const coveragePercentLT = totalMortgageCost > 0 ? (monthlyRentLT / totalMortgageCost) * 100 : 100;
    const coveragePercentST = totalMortgageCost > 0 ? (monthlyRentST / totalMortgageCost) * 100 : 100;

    return {
      monthlyRentLT,
      monthlyRentST,
      monthlyMortgage: totalMortgageCost,
      monthlyCashflowLT,
      monthlyCashflowST,
      isSelfFundingLT: monthlyCashflowLT >= 0,
      isSelfFundingST: monthlyCashflowST >= 0,
      coveragePercentLT,
      coveragePercentST,
      yearsToPayOffLT,
      yearsToPayOffST,
      marketAvgPayoff,
      showAirbnb,
      annualRentLT: calculations.holdAnalysis.netAnnualRent,
      annualRentST: firstFullYear?.airbnbNetIncome || 0,
    };
  }, [calculations, mortgageAnalysis, mortgageEnabled, inputs.showAirbnbComparison]);

  // ===== ACT 3: WEALTH DATA =====
  const wealthData = useMemo(() => {
    const lastYear = calculations.yearlyProjections[calculations.yearlyProjections.length - 1];
    const propertyValue10Y = lastYear?.propertyValue || 0;
    const cumulativeRentLT = lastYear?.cumulativeNetIncome || 0;
    const cumulativeRentST = lastYear?.airbnbCumulativeNetIncome || 0;
    const initialInvestment = calculations.holdAnalysis.totalCapitalInvested;
    
    const netWealthLT = propertyValue10Y + cumulativeRentLT - initialInvestment;
    const netWealthST = propertyValue10Y + cumulativeRentST - initialInvestment;
    const percentGainLT = initialInvestment > 0 ? (netWealthLT / initialInvestment) * 100 : 0;
    const percentGainST = initialInvestment > 0 ? (netWealthST / initialInvestment) * 100 : 0;

    // Best exit scenario
    const bestScenario = calculations.scenarios.reduce((best, current) => 
      current.trueROE > best.trueROE ? current : best, calculations.scenarios[0]);
    
    // Calculate appreciation
    const totalAppreciation = ((propertyValue10Y - calculations.basePrice) / calculations.basePrice) * 100;

    return {
      propertyValue10Y,
      cumulativeRentLT,
      cumulativeRentST,
      initialInvestment,
      netWealthLT,
      netWealthST,
      percentGainLT,
      percentGainST,
      bestScenario,
      totalAppreciation,
      scenarios: calculations.scenarios,
      showAirbnb: inputs.showAirbnbComparison,
    };
  }, [calculations, inputs.showAirbnbComparison]);

  // ===== ACT 4: KPI DATA =====
  const kpiData = useMemo(() => {
    return {
      netYield: calculations.holdAnalysis.rentalYieldOnInvestment,
      grossYield: inputs.rentalYieldPercent,
      bestROE: wealthData.bestScenario?.trueROE || 0,
      paybackYears: holdingData.yearsToPayOffLT,
      appreciation: wealthData.totalAppreciation / 10, // Annual CAGR
      mortgageCoverage: holdingData.coveragePercentLT,
    };
  }, [calculations, inputs, wealthData, holdingData]);

  return (
    <div className="space-y-6">
      {/* ===== ACT 1: THE ENTRY ===== */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{t('yourEntry') || 'Your Entry'}</h2>
            <p className="text-xs text-slate-400">{t('whatYouNeedToStart') || 'What you need to start'}</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Row 1: Cash Summary + Financing */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cash to Keys - Hero */}
            <div className="lg:col-span-1 bg-slate-800/50 rounded-xl p-4 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('cashToKeys') || 'Cash to Keys'}</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono mb-2">
                {formatCurrency(entryData.cashToStart, currency, rate)}
              </p>
              <p className="text-xs text-slate-400 mb-3">
                {t('includesDownpaymentFees') || 'Downpayment + DLD + Fees'}
              </p>
              
              {/* Cash vs Financed Bar */}
              <div className="space-y-1.5">
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
                <div className="flex justify-between text-[10px] text-slate-500">
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
            </div>

            {/* Financing Summary */}
            <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('financing') || 'Financing'}</span>
              </div>
              
              {mortgageEnabled ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">{t('loanAmount') || 'Loan Amount'}</p>
                    <p className="text-lg font-bold text-blue-400 font-mono">{formatCurrency(entryData.loanAmount, currency, rate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('monthlyPayment') || 'Monthly'}</p>
                    <p className="text-lg font-bold text-white font-mono">{formatCurrency(entryData.monthlyMortgage, currency, rate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('interestRate') || 'Interest'}</p>
                    <p className="text-lg font-bold text-white font-mono">{entryData.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('loanTerm') || 'Term'}</p>
                    <p className="text-lg font-bold text-white font-mono">{entryData.loanTerm} {t('years') || 'yrs'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-400">{t('cashPurchase') || 'Cash Purchase'}</p>
                    <p className="text-xs text-slate-400">{t('noMortgageRequired') || 'No mortgage required'}</p>
                  </div>
                </div>
              )}

              {/* Gap Warning */}
              {mortgageEnabled && entryData.hasGap && (
                <div className="mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-300">
                    {t('gapPaymentRequired') || 'Gap payment'}: <span className="font-bold font-mono">{formatCurrency(entryData.gapAmount, currency, rate)}</span> at handover
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Payment Timeline */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
            <PaymentHorizontalTimeline
              inputs={inputs}
              currency={currency}
              rate={rate}
              totalMonths={calculations.totalMonths}
            />
          </div>
        </div>
      </section>

      {/* ===== ACT 2: THE HOLDING ===== */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Home className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{t('yourHolding') || 'Your Holding'}</h2>
            <p className="text-xs text-slate-400">{t('monthlyPerformanceAndPayback') || 'Monthly performance & payback'}</p>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Rental Income Comparison */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('annualRentalIncome') || 'Annual Rental Income'}</span>
              </div>
              
              <div className="space-y-3">
                {/* Long-Term */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-cyan-400">{t('longTerm') || 'Long-Term'}</span>
                    <span className="text-cyan-400 font-bold font-mono">{formatCurrency(holdingData.annualRentLT, currency, rate)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-700">
                    <div 
                      className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                      style={{ width: holdingData.showAirbnb ? `${Math.min(100, (holdingData.annualRentLT / Math.max(holdingData.annualRentLT, holdingData.annualRentST)) * 100)}%` : '100%' }}
                    />
                  </div>
                </div>
                
                {/* Short-Term */}
                {holdingData.showAirbnb && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-orange-400">{t('shortTerm') || 'Short-Term'}</span>
                      <span className="text-orange-400 font-bold font-mono">{formatCurrency(holdingData.annualRentST, currency, rate)}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-700">
                      <div 
                        className="h-full rounded-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (holdingData.annualRentST / Math.max(holdingData.annualRentLT, holdingData.annualRentST)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Winner Badge */}
              {holdingData.showAirbnb && (
                <div className={cn(
                  "mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
                  holdingData.annualRentST > holdingData.annualRentLT 
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-cyan-500/20 text-cyan-400"
                )}>
                  <Trophy className="w-3 h-3" />
                  {holdingData.annualRentST > holdingData.annualRentLT 
                    ? `+${formatCurrency(holdingData.annualRentST - holdingData.annualRentLT, currency, rate)} ST`
                    : `+${formatCurrency(holdingData.annualRentLT - holdingData.annualRentST, currency, rate)} LT`
                  }
                </div>
              )}
            </div>

            {/* Monthly Sustainability */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-3">
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('monthlyCashflow') || 'Monthly Cashflow'}</span>
              </div>

              {/* Long-Term Cashflow */}
              <div className="text-center py-2">
                <p className={cn(
                  "text-3xl font-bold font-mono",
                  holdingData.isSelfFundingLT ? "text-emerald-400" : "text-red-400"
                )}>
                  {holdingData.monthlyCashflowLT >= 0 ? '+' : ''}{formatCurrency(holdingData.monthlyCashflowLT, currency, rate)}
                </p>
                <p className="text-xs text-slate-400 mt-1">{t('longTerm') || 'Long-Term'} /mo</p>
              </div>

              {/* Status Badge */}
              <div className={cn(
                "mt-2 text-center py-2 rounded-lg text-xs font-semibold",
                holdingData.isSelfFundingLT 
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              )}>
                {holdingData.isSelfFundingLT 
                  ? `✓ ${t('selfFunding') || 'Self-Funding'}`
                  : `! ${t('monthlyGapNeeded') || 'Monthly Gap Needed'}`
                }
              </div>

              {/* Coverage if mortgage enabled */}
              {mortgageEnabled && (
                <div className="mt-3 text-center">
                  <p className="text-[10px] text-slate-500">{t('mortgageCoverage') || 'Mortgage Coverage'}</p>
                  <p className={cn(
                    "text-lg font-bold font-mono",
                    holdingData.coveragePercentLT >= 100 ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {holdingData.coveragePercentLT.toFixed(0)}%
                  </p>
                </div>
              )}
            </div>

            {/* Time to Payback */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('timeToPayback') || 'Time to Payback'}</span>
              </div>

              <div className="flex items-center justify-center gap-4">
                {/* Donut Chart */}
                <div className="relative">
                  <DonutProgress 
                    value={holdingData.yearsToPayOffLT} 
                    max={holdingData.marketAvgPayoff} 
                    color={holdingData.yearsToPayOffLT < holdingData.marketAvgPayoff ? '#a78bfa' : '#fbbf24'}
                    size={80}
                  />
                  <div className="absolute inset-0 flex items-center justify-center rotate-90">
                    <span className="text-xl font-bold text-white font-mono">
                      {holdingData.yearsToPayOffLT.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-2xl font-bold text-violet-400 font-mono">
                    {holdingData.yearsToPayOffLT.toFixed(1)} <span className="text-sm font-normal text-slate-400">{t('years') || 'yrs'}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {t('marketAvg') || 'Market Avg'}: {holdingData.marketAvgPayoff}y
                  </p>
                  {holdingData.yearsToPayOffLT < holdingData.marketAvgPayoff && (
                    <p className="text-[10px] text-emerald-400 mt-1">
                      ✓ {t('fasterThanMarket') || 'Faster than market'}
                    </p>
                  )}
                </div>
              </div>

              {/* Short-term comparison */}
              {holdingData.showAirbnb && holdingData.yearsToPayOffST < 999 && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 text-center">
                  <p className="text-xs text-orange-400">
                    {t('shortTerm') || 'Short-Term'}: <span className="font-bold font-mono">{holdingData.yearsToPayOffST.toFixed(1)}y</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== ACT 3: THE WEALTH ===== */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Gem className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{t('yourWealth') || 'Your Wealth'}</h2>
            <p className="text-xs text-slate-400">{t('wealthCreation10Years') || '10-year wealth creation'}</p>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Wealth Created Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-amber-500/10 to-slate-800/50 rounded-xl p-4 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('netWealthCreated') || 'Net Wealth Created (10Y)'}</span>
              </div>

              {/* Hero Number */}
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-amber-400 font-mono">
                  {formatCurrency(wealthData.netWealthLT, currency, rate)}
                </p>
                <p className="text-sm text-emerald-400 mt-1">
                  +{wealthData.percentGainLT.toFixed(0)}% {t('returnOnInvestment') || 'return on investment'}
                </p>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-amber-500/20">
                <div className="text-center">
                  <p className="text-xs text-slate-500">{t('propertyValue') || 'Property Value'}</p>
                  <p className="text-lg font-bold text-white font-mono">{formatCurrency(wealthData.propertyValue10Y, currency, rate)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">{t('cumulativeRent') || 'Cumulative Rent'}</p>
                  <p className="text-lg font-bold text-cyan-400 font-mono">+{formatCurrency(wealthData.cumulativeRentLT, currency, rate)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">{t('initialInvestment') || 'Initial Investment'}</p>
                  <p className="text-lg font-bold text-red-400 font-mono">-{formatCurrency(wealthData.initialInvestment, currency, rate)}</p>
                </div>
              </div>

              {/* Short-term wealth comparison */}
              {wealthData.showAirbnb && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-400">{t('withShortTerm') || 'With Short-Term Strategy'}:</span>
                    <span className="text-lg font-bold text-orange-400 font-mono">
                      {formatCurrency(wealthData.netWealthST, currency, rate)}
                      <span className="text-xs text-slate-400 ml-2">(+{wealthData.percentGainST.toFixed(0)}%)</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Exit Windows */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('exitWindows') || 'Exit Windows'}</span>
              </div>

              <div className="space-y-2">
                {wealthData.scenarios.slice(0, 3).map((scenario, index) => {
                  const isBest = scenario.trueROE === wealthData.bestScenario?.trueROE;
                  return (
                    <div 
                      key={index}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        isBest 
                          ? "bg-green-500/10 border-green-500/30" 
                          : "bg-slate-800/30 border-slate-700/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isBest && <Trophy className="w-3 h-3 text-green-400" />}
                          <span className="text-xs text-slate-400">
                            {exitScenarios[index]} {t('months') || 'mo'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-sm font-bold font-mono",
                            scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400"
                          )}>
                            {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrency(scenario.trueProfit, currency, rate)}
                          </p>
                          <p className="text-[10px] text-slate-500">ROE: {scenario.trueROE.toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Best ROE highlight */}
              <div className="mt-3 text-center">
                <p className="text-[10px] text-slate-500">{t('bestROE') || 'Best ROE'}</p>
                <p className="text-xl font-bold text-green-400 font-mono">{wealthData.bestScenario?.trueROE.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ACT 4: KEY METRICS DASHBOARD ===== */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{t('keyMetrics') || 'Key Metrics'}</h2>
            <p className="text-xs text-slate-400">{t('investmentKPIs') || 'Investment performance indicators'}</p>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Net Yield */}
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 text-center">
              <div className="w-8 h-8 mx-auto rounded-lg bg-cyan-500/20 flex items-center justify-center mb-2">
                <Percent className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{t('netYield') || 'Net Yield'}</p>
              <p className="text-xl font-bold text-cyan-400 font-mono">{kpiData.netYield.toFixed(1)}%</p>
            </div>

            {/* Best ROE */}
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 text-center">
              <div className="w-8 h-8 mx-auto rounded-lg bg-green-500/20 flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{t('bestROE') || 'Best ROE'}</p>
              <p className="text-xl font-bold text-green-400 font-mono">{kpiData.bestROE.toFixed(0)}%</p>
            </div>

            {/* Payback */}
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 text-center">
              <div className="w-8 h-8 mx-auto rounded-lg bg-violet-500/20 flex items-center justify-center mb-2">
                <Clock className="w-4 h-4 text-violet-400" />
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{t('payback') || 'Payback'}</p>
              <p className="text-xl font-bold text-violet-400 font-mono">{kpiData.paybackYears.toFixed(1)}y</p>
            </div>

            {/* Appreciation */}
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 text-center">
              <div className="w-8 h-8 mx-auto rounded-lg bg-amber-500/20 flex items-center justify-center mb-2">
                <Building className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{t('appreciation') || 'CAGR'}</p>
              <p className="text-xl font-bold text-amber-400 font-mono">{kpiData.appreciation.toFixed(1)}%</p>
            </div>

            {/* Gross Yield */}
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 text-center">
              <div className="w-8 h-8 mx-auto rounded-lg bg-emerald-500/20 flex items-center justify-center mb-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{t('grossYield') || 'Gross Yield'}</p>
              <p className="text-xl font-bold text-emerald-400 font-mono">{kpiData.grossYield.toFixed(1)}%</p>
            </div>

            {/* Coverage */}
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 text-center">
              <div className="w-8 h-8 mx-auto rounded-lg bg-blue-500/20 flex items-center justify-center mb-2">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{t('coverage') || 'Coverage'}</p>
              <p className={cn(
                "text-xl font-bold font-mono",
                kpiData.mortgageCoverage >= 100 ? "text-emerald-400" : "text-amber-400"
              )}>
                {mortgageEnabled ? `${kpiData.mortgageCoverage.toFixed(0)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
