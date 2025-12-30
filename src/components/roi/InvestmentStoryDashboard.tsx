import { useMemo, useState } from "react";
import { 
  Wallet, TrendingUp, Trophy, Clock, ArrowRight, Banknote, Building2, 
  Key, Gem, Target, Home, Zap, DollarSign,
  Calendar, Percent, CreditCard, Shield, Check
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

// Strategy Toggle Component
const StrategyToggle = ({ 
  value, 
  onChange, 
  ltLabel, 
  stLabel 
}: { 
  value: 'LT' | 'ST'; 
  onChange: (val: 'LT' | 'ST') => void;
  ltLabel: string;
  stLabel: string;
}) => (
  <div className="inline-flex rounded-lg bg-slate-800 p-0.5">
    <button
      onClick={() => onChange('LT')}
      className={cn(
        "px-3 py-1 text-xs font-medium rounded-md transition-all",
        value === 'LT' 
          ? "bg-cyan-500 text-white" 
          : "text-slate-400 hover:text-white"
      )}
    >
      {ltLabel}
    </button>
    <button
      onClick={() => onChange('ST')}
      className={cn(
        "px-3 py-1 text-xs font-medium rounded-md transition-all",
        value === 'ST' 
          ? "bg-orange-500 text-white" 
          : "text-slate-400 hover:text-white"
      )}
    >
      {stLabel}
    </button>
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
  
  // Strategy toggles state
  const [cashflowStrategy, setCashflowStrategy] = useState<'LT' | 'ST'>('LT');
  const [wealthStrategy, setWealthStrategy] = useState<'LT' | 'ST'>('LT');

  // ===== ACT 1: ENTRY DATA =====
  const entryData = useMemo(() => {
    const basePrice = calculations.basePrice;
    const dldFee = basePrice * 0.04;
    const oqoodFee = inputs.oqoodFee || 0;
    const eoiFee = inputs.eoiFee || 0;
    
    // Cash to Keys = Pre-handover % of base price + DLD + Oqood (what payment plan says)
    const preHandoverAmount = basePrice * inputs.preHandoverPercent / 100;
    let cashToKeys = preHandoverAmount + dldFee + oqoodFee + eoiFee;
    
    if (mortgageEnabled) {
      cashToKeys += mortgageAnalysis.gapAmount + mortgageAnalysis.totalUpfrontFees;
    }

    const cashPercent = inputs.preHandoverPercent;
    const financedPercent = mortgageEnabled ? 100 - inputs.preHandoverPercent : 0;

    return {
      basePrice,
      cashToKeys,
      cashPercent,
      financedPercent,
      downpaymentPercent: inputs.downpaymentPercent,
      preHandoverPercent: inputs.preHandoverPercent,
      loanAmount: mortgageEnabled ? mortgageAnalysis.loanAmount : 0,
      monthlyMortgage: mortgageEnabled ? mortgageAnalysis.monthlyPayment : 0,
      interestRate: mortgageInputs.interestRate,
      loanTerm: mortgageInputs.loanTermYears,
      hasGap: mortgageAnalysis.hasGap,
      gapAmount: mortgageAnalysis.gapAmount,
    };
  }, [inputs, calculations, mortgageAnalysis, mortgageEnabled, mortgageInputs]);

  // ===== ACT 2: INCOME DATA =====
  const incomeData = useMemo(() => {
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

    // Gross and Net Yields
    const grossYield = inputs.rentalYieldPercent;
    const netYield = calculations.holdAnalysis.rentalYieldOnInvestment;

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
      grossYield,
      netYield,
    };
  }, [calculations, mortgageAnalysis, mortgageEnabled, inputs.showAirbnbComparison, inputs.rentalYieldPercent]);

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
      scenarios: calculations.scenarios,
      showAirbnb: inputs.showAirbnbComparison,
    };
  }, [calculations, inputs.showAirbnbComparison]);

  // Get exit scenario names
  const getExitName = (index: number, months: number) => {
    const totalMonths = calculations.totalMonths;
    if (months <= totalMonths) {
      return t('duringConstruction') || 'During Construction';
    }
    const yearsAfterHandover = Math.round((months - totalMonths) / 12);
    if (yearsAfterHandover <= 0) return t('atHandoverLabel') || 'At Handover';
    return `${t('postHandoverYear') || 'Post-Handover Y'}${yearsAfterHandover}`;
  };

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
                {formatCurrency(entryData.cashToKeys, currency, rate)}
              </p>
              <p className="text-xs text-slate-400 mb-3">
                {entryData.preHandoverPercent}% + {t('fees') || 'Fees'} ({t('paymentPlan') || 'Payment Plan'})
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
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-400">{t('cashPurchase') || 'Cash Purchase'}</p>
                      <p className="text-xs text-slate-400">100% {t('equity') || 'Equity'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('noMonthlyPayments') || 'No monthly payments'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('fullOwnership') || 'Full ownership'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('noInterestCosts') || 'No interest costs'}</span>
                    </div>
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

          {/* Row 2: Payment Timeline with prominent header */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{t('yourPaymentSchedule') || 'Your Payment Schedule'}</h3>
                  <p className="text-[10px] text-slate-400">{t('whenYouPay') || 'When you pay during construction'}</p>
                </div>
              </div>
            </div>
            <PaymentHorizontalTimeline
              inputs={inputs}
              currency={currency}
              rate={rate}
              totalMonths={calculations.totalMonths}
            />
          </div>
        </div>
      </section>

      {/* ===== ACT 2: YOUR INCOME ===== */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Home className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{t('yourIncome') || 'Your Income'}</h2>
            <p className="text-xs text-slate-400">{t('rentalPerformance') || 'Rental performance & sustainability'}</p>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Annual Rental Income with Yields */}
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
                    <span className="text-cyan-400 font-bold font-mono">{formatCurrency(incomeData.annualRentLT, currency, rate)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-700">
                    <div 
                      className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                      style={{ width: incomeData.showAirbnb ? `${Math.min(100, (incomeData.annualRentLT / Math.max(incomeData.annualRentLT, incomeData.annualRentST)) * 100)}%` : '100%' }}
                    />
                  </div>
                </div>
                
                {/* Short-Term */}
                {incomeData.showAirbnb && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-orange-400">{t('shortTerm') || 'Short-Term'}</span>
                      <span className="text-orange-400 font-bold font-mono">{formatCurrency(incomeData.annualRentST, currency, rate)}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-700">
                      <div 
                        className="h-full rounded-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (incomeData.annualRentST / Math.max(incomeData.annualRentLT, incomeData.annualRentST)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Gross & Net Yields */}
              <div className="mt-4 pt-3 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t('grossYieldLabel') || 'Gross'}:</span>
                  <span className="font-bold text-emerald-400 font-mono">{incomeData.grossYield.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-slate-400">{t('netYieldLabel') || 'Net'}:</span>
                  <span className="font-bold text-cyan-400 font-mono">{incomeData.netYield.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Monthly Cashflow with Toggle */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('monthlyCashflow') || 'Monthly Cashflow'}</span>
                </div>
                {incomeData.showAirbnb && (
                  <StrategyToggle 
                    value={cashflowStrategy} 
                    onChange={setCashflowStrategy}
                    ltLabel={t('lt') || 'LT'}
                    stLabel={t('st') || 'ST'}
                  />
                )}
              </div>

              {/* Cashflow Display */}
              <div className="text-center py-2">
                <p className={cn(
                  "text-3xl font-bold font-mono",
                  (cashflowStrategy === 'LT' ? incomeData.isSelfFundingLT : incomeData.isSelfFundingST) ? "text-emerald-400" : "text-red-400"
                )}>
                  {(cashflowStrategy === 'LT' ? incomeData.monthlyCashflowLT : incomeData.monthlyCashflowST) >= 0 ? '+' : ''}
                  {formatCurrency(cashflowStrategy === 'LT' ? incomeData.monthlyCashflowLT : incomeData.monthlyCashflowST, currency, rate)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {cashflowStrategy === 'LT' ? (t('longTerm') || 'Long-Term') : (t('shortTerm') || 'Short-Term')} /mo
                </p>
              </div>

              {/* Status Badge */}
              <div className={cn(
                "mt-2 text-center py-2 rounded-lg text-xs font-semibold",
                (cashflowStrategy === 'LT' ? incomeData.isSelfFundingLT : incomeData.isSelfFundingST)
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              )}>
                {(cashflowStrategy === 'LT' ? incomeData.isSelfFundingLT : incomeData.isSelfFundingST)
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
                    (cashflowStrategy === 'LT' ? incomeData.coveragePercentLT : incomeData.coveragePercentST) >= 100 ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {(cashflowStrategy === 'LT' ? incomeData.coveragePercentLT : incomeData.coveragePercentST).toFixed(0)}%
                  </p>
                </div>
              )}
            </div>

            {/* Time to Payback - Both Options */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('timeToPayback') || 'Time to Payback'}</span>
              </div>

              {/* Side by side payback cards */}
              <div className="grid grid-cols-2 gap-2">
                {/* LT Payback */}
                <div className={cn(
                  "p-3 rounded-lg border text-center",
                  !incomeData.showAirbnb || incomeData.yearsToPayOffLT <= incomeData.yearsToPayOffST
                    ? "bg-violet-500/10 border-violet-500/30"
                    : "bg-slate-800/50 border-slate-700/30"
                )}>
                  <div className="relative w-14 h-14 mx-auto mb-2">
                    <DonutProgress 
                      value={incomeData.yearsToPayOffLT} 
                      max={incomeData.marketAvgPayoff} 
                      color={incomeData.yearsToPayOffLT < incomeData.marketAvgPayoff ? '#a78bfa' : '#fbbf24'}
                      size={56}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-white font-mono">
                        {incomeData.yearsToPayOffLT.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-cyan-400">{t('longTerm') || 'LT'}</p>
                  <p className="text-[10px] text-slate-500">{incomeData.yearsToPayOffLT.toFixed(1)} {t('years') || 'yrs'}</p>
                </div>

                {/* ST Payback */}
                {incomeData.showAirbnb && incomeData.yearsToPayOffST < 999 ? (
                  <div className={cn(
                    "p-3 rounded-lg border text-center",
                    incomeData.yearsToPayOffST < incomeData.yearsToPayOffLT
                      ? "bg-orange-500/10 border-orange-500/30"
                      : "bg-slate-800/50 border-slate-700/30"
                  )}>
                    <div className="relative w-14 h-14 mx-auto mb-2">
                      <DonutProgress 
                        value={incomeData.yearsToPayOffST} 
                        max={incomeData.marketAvgPayoff} 
                        color={incomeData.yearsToPayOffST < incomeData.marketAvgPayoff ? '#fb923c' : '#fbbf24'}
                        size={56}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-white font-mono">
                          {incomeData.yearsToPayOffST.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-orange-400">{t('shortTerm') || 'ST'}</p>
                    <p className="text-[10px] text-slate-500">{incomeData.yearsToPayOffST.toFixed(1)} {t('years') || 'yrs'}</p>
                    {incomeData.yearsToPayOffST < incomeData.yearsToPayOffLT && (
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-500/20 text-[9px] text-orange-400">
                        <Trophy className="w-2.5 h-2.5" /> Faster
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border bg-slate-800/50 border-slate-700/30 text-center flex items-center justify-center">
                    <p className="text-xs text-slate-500">{t('stNotEnabled') || 'ST not enabled'}</p>
                  </div>
                )}
              </div>

              <div className="mt-2 text-center">
                <p className="text-[10px] text-slate-500">
                  {t('marketAvg') || 'Market Avg'}: {incomeData.marketAvgPayoff}y
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ACT 3: THE WEALTH ===== */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Gem className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t('yourWealth') || 'Your Wealth'}</h2>
              <p className="text-xs text-slate-400">{t('wealthCreation10Years') || '10-year wealth creation'}</p>
            </div>
          </div>
          {wealthData.showAirbnb && (
            <StrategyToggle 
              value={wealthStrategy} 
              onChange={setWealthStrategy}
              ltLabel={t('longTerm') || 'Long-Term'}
              stLabel={t('shortTerm') || 'Short-Term'}
            />
          )}
        </div>

        <div className="p-4">
          <div className="bg-gradient-to-br from-amber-500/10 to-slate-800/50 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('netWealthCreated') || 'Net Wealth Created (10Y)'}</span>
            </div>

            {/* Hero Number */}
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-amber-400 font-mono">
                {formatCurrency(wealthStrategy === 'LT' ? wealthData.netWealthLT : wealthData.netWealthST, currency, rate)}
              </p>
              <p className="text-sm text-emerald-400 mt-1">
                +{(wealthStrategy === 'LT' ? wealthData.percentGainLT : wealthData.percentGainST).toFixed(0)}% {t('returnOnInvestment') || 'return on investment'}
              </p>
              {wealthData.showAirbnb && (
                <p className="text-xs text-slate-400 mt-2">
                  {wealthStrategy === 'LT' 
                    ? `${t('shortTerm') || 'ST'}: ${formatCurrency(wealthData.netWealthST, currency, rate)} (+${wealthData.percentGainST.toFixed(0)}%)`
                    : `${t('longTerm') || 'LT'}: ${formatCurrency(wealthData.netWealthLT, currency, rate)} (+${wealthData.percentGainLT.toFixed(0)}%)`
                  }
                </p>
              )}
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-amber-500/20">
              <div className="text-center">
                <p className="text-xs text-slate-500">{t('propertyValue') || 'Property Value'}</p>
                <p className="text-lg font-bold text-white font-mono">{formatCurrency(wealthData.propertyValue10Y, currency, rate)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">{t('cumulativeRent') || 'Cumulative Rent'}</p>
                <p className={cn(
                  "text-lg font-bold font-mono",
                  wealthStrategy === 'LT' ? "text-cyan-400" : "text-orange-400"
                )}>
                  +{formatCurrency(wealthStrategy === 'LT' ? wealthData.cumulativeRentLT : wealthData.cumulativeRentST, currency, rate)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">{t('initialInvestment') || 'Initial Investment'}</p>
                <p className="text-lg font-bold text-red-400 font-mono">-{formatCurrency(wealthData.initialInvestment, currency, rate)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ACT 4: EXIT SCENARIOS (Separate Section) ===== */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-green-950/30 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{t('exitScenarios') || 'Exit Scenarios'}</h2>
            <p className="text-xs text-slate-400">{t('whenToSell') || 'When to sell for maximum returns'}</p>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {wealthData.scenarios.map((scenario, index) => {
              const isBest = scenario.trueROE === wealthData.bestScenario?.trueROE;
              const months = exitScenarios[index];
              const exitName = getExitName(index, months);
              const maxROE = Math.max(...wealthData.scenarios.map(s => s.trueROE));
              const roeWidth = maxROE > 0 ? (scenario.trueROE / maxROE) * 100 : 0;
              
              return (
                <div 
                  key={index}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    isBest 
                      ? "bg-green-500/10 border-green-500/30" 
                      : "bg-slate-800/50 border-slate-700/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isBest && <Trophy className="w-4 h-4 text-green-400" />}
                      <span className="text-sm font-medium text-white">{exitName}</span>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {t('month') || 'Month'} {months}
                    </span>
                  </div>
                  
                  {/* ROE Bar */}
                  <div className="mb-2">
                    <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          isBest ? "bg-green-500" : "bg-slate-500"
                        )}
                        style={{ width: `${roeWidth}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn(
                        "text-lg font-bold font-mono",
                        scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrency(scenario.trueProfit, currency, rate)}
                      </p>
                      <p className="text-[10px] text-slate-500">{t('profit') || 'Profit'}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-xl font-bold font-mono",
                        isBest ? "text-green-400" : "text-white"
                      )}>
                        {scenario.trueROE.toFixed(0)}%
                      </p>
                      <p className="text-[10px] text-slate-500">ROE</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Best ROE highlight */}
          <div className="mt-4 text-center bg-green-500/10 rounded-lg p-3 border border-green-500/20">
            <p className="text-xs text-slate-400">{t('recommendedExit') || 'Recommended Exit'}</p>
            <p className="text-2xl font-bold text-green-400 font-mono">
              {wealthData.bestScenario?.trueROE.toFixed(0)}% ROE
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {t('at') || 'at'} {getExitName(wealthData.scenarios.indexOf(wealthData.bestScenario!), exitScenarios[wealthData.scenarios.indexOf(wealthData.bestScenario!)])}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
