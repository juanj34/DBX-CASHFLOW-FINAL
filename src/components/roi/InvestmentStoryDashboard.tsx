import { useMemo, useState } from "react";
import { 
  Wallet, TrendingUp, Trophy, Clock, ArrowRight, Banknote, Building2, 
  Key, Target, Home, Zap, DollarSign,
  Calendar, Percent, CreditCard, Shield, Check, Info, ChevronDown, ChevronUp,
  Hammer
} from "lucide-react";
import { OIInputs, OICalculations } from "./useOICalculations";
import { CumulativeIncomeChart } from "./CumulativeIncomeChart";
import { MortgageAnalysis, MortgageInputs } from "./useMortgageCalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PaymentHorizontalTimeline } from "./PaymentHorizontalTimeline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

// Period Toggle (Month/Year)
const PeriodToggle = ({ 
  value, 
  onChange 
}: { 
  value: 'month' | 'year'; 
  onChange: (val: 'month' | 'year') => void;
}) => {
  const { t } = useLanguage();
  return (
    <div className="inline-flex rounded-lg bg-slate-800 p-0.5">
      <button
        onClick={() => onChange('month')}
        className={cn(
          "px-2 py-0.5 text-[10px] font-medium rounded-md transition-all",
          value === 'month' 
            ? "bg-slate-600 text-white" 
            : "text-slate-400 hover:text-white"
        )}
      >
        {t('month') || 'Month'}
      </button>
      <button
        onClick={() => onChange('year')}
        className={cn(
          "px-2 py-0.5 text-[10px] font-medium rounded-md transition-all",
          value === 'year' 
            ? "bg-slate-600 text-white" 
            : "text-slate-400 hover:text-white"
        )}
      >
        {t('year') || 'Year'}
      </button>
    </div>
  );
};

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
  const [incomeStrategy, setIncomeStrategy] = useState<'LT' | 'ST'>('LT');
  const [incomePeriod, setIncomePeriod] = useState<'month' | 'year'>('year');
  const [showEntryDetails, setShowEntryDetails] = useState(false);

  // ===== ACT 1: ENTRY DATA =====
  const entryData = useMemo(() => {
    const basePrice = calculations.basePrice;
    const dldFee = basePrice * 0.04;
    const oqoodFee = inputs.oqoodFee || 0;
    const eoiFee = inputs.eoiFee || 0;
    const downpaymentPercent = inputs.downpaymentPercent || 20;
    
    // Day 1 Entry = EOI + Rest of downpayment + DLD + Oqood
    const downpaymentAmount = basePrice * (downpaymentPercent / 100);
    const restOfDownpayment = downpaymentAmount - eoiFee;
    const totalDayOneEntry = eoiFee + restOfDownpayment + dldFee + oqoodFee;
    
    // Pre-handover for display
    const preHandoverAmount = basePrice * inputs.preHandoverPercent / 100;
    const handoverAmount = basePrice * (100 - inputs.preHandoverPercent) / 100;

    // Price per sqft
    const unitSize = inputs.unitSizeSqf || 0;
    const pricePerSqft = unitSize > 0 ? basePrice / unitSize : 0;

    return {
      basePrice,
      totalDayOneEntry,
      eoiFee,
      restOfDownpayment,
      downpaymentPercent,
      downpaymentAmount,
      dldFee,
      oqoodFee,
      preHandoverPercent: inputs.preHandoverPercent,
      preHandoverAmount,
      handoverPercent: 100 - inputs.preHandoverPercent,
      handoverAmount,
      pricePerSqft,
      unitSize,
      constructionMonths: calculations.totalMonths,
      // Handover date formatted
      handoverQ: inputs.handoverQuarter,
      handoverY: inputs.handoverYear,
      // For Leverage section
      loanAmount: mortgageEnabled ? mortgageAnalysis.loanAmount : 0,
      monthlyMortgage: mortgageEnabled ? mortgageAnalysis.monthlyPayment : 0,
      interestRate: mortgageInputs.interestRate,
      loanTerm: mortgageInputs.loanTermYears,
      hasGap: mortgageAnalysis.hasGap,
      gapAmount: mortgageAnalysis.gapAmount,
      financedPercent: mortgageEnabled ? 100 - inputs.preHandoverPercent : 0,
      totalUpfrontFees: mortgageEnabled ? mortgageAnalysis.totalUpfrontFees : 0,
    };
  }, [inputs, calculations, mortgageAnalysis, mortgageEnabled, mortgageInputs]);

  // ===== ACT 2: INCOME DATA =====
  const incomeData = useMemo(() => {
    // Base rental income WITHOUT mortgage deduction
    const monthlyRentLT = calculations.holdAnalysis.netAnnualRent / 12;
    const annualRentLT = calculations.holdAnalysis.netAnnualRent;
    
    // Short-term calculations
    const showAirbnb = inputs.showAirbnbComparison;
    const firstFullYear = calculations.yearlyProjections.find(p => !p.isConstruction && !p.isHandover);
    const annualRentST = firstFullYear?.airbnbNetIncome || 0;
    const monthlyRentST = annualRentST / 12;

    // Payback periods (using rent income only, not cashflow after mortgage)
    const yearsToPayOffLT = calculations.holdAnalysis.yearsToPayOff;
    const yearsToPayOffST = calculations.holdAnalysis.airbnbYearsToPayOff;
    const marketAvgPayoff = 14.5;

    // Gross and Net Yields
    const grossYield = inputs.rentalYieldPercent;
    const netYield = calculations.holdAnalysis.rentalYieldOnInvestment;

    // Service charges - use correct property names
    const serviceCharges = (inputs.serviceChargePerSqft || 0) * (inputs.unitSizeSqf || 0);

    // ST Parameters - get from shortTermRental config
    const stOccupancy = inputs.shortTermRental?.occupancyPercent || 70;
    const stExpenses = inputs.shortTermRental?.operatingExpensePercent || 30;
    const stAdminFee = inputs.shortTermRental?.managementFeePercent || 0;

    // LT Parameters  
    const ltMaintenancePercent = 5;
    const ltVacancyWeeks = 2;

    // Payback calculation details
    const totalInvested = calculations.holdAnalysis.totalCapitalInvested;
    const paybackCalcLT = {
      totalInvested,
      annualIncome: annualRentLT,
      years: yearsToPayOffLT,
    };
    const paybackCalcST = {
      totalInvested,
      annualIncome: annualRentST,
      years: yearsToPayOffST,
    };

    return {
      monthlyRentLT,
      monthlyRentST,
      annualRentLT,
      annualRentST,
      yearsToPayOffLT,
      yearsToPayOffST,
      marketAvgPayoff,
      showAirbnb,
      grossYield,
      netYield,
      serviceCharges,
      stOccupancy,
      stExpenses,
      stAdminFee,
      ltMaintenancePercent,
      ltVacancyWeeks,
      paybackCalcLT,
      paybackCalcST,
    };
  }, [calculations, inputs]);

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

  // Format handover date
  const formatHandoverDate = () => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const q = quarters[entryData.handoverQ - 1] || 'Q1';
    return `${q} ${entryData.handoverY}`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ===== ACT 1: THE ENTRY - Day 1 Money ===== */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t('theEntry') || 'THE ENTRY'}</h2>
              <p className="text-xs text-slate-400">{formatHandoverDate()}</p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Row 1: Property Info Cards with Visual Enhancements */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Property Price - Enhanced with visual tier indicator */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">{t('propertyPrice') || 'Property Price'}</span>
                </div>
                <p className="text-2xl font-bold text-white font-mono">{formatCurrency(entryData.basePrice, currency, rate)}</p>
                {entryData.pricePerSqft > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500">
                      {formatCurrency(entryData.pricePerSqft, currency, rate)}/{t('sqft') || 'sqft'}
                    </span>
                    {entryData.unitSize > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                        {entryData.unitSize.toLocaleString()} sqft
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Construction Timeline - Enhanced with circular progress */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Hammer className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide">{t('constructionTime') || 'Construction'}</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-400 font-mono">{entryData.constructionMonths} <span className="text-sm text-purple-400/70">{t('months') || 'mo'}</span></p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Key className="w-3 h-3" /> {formatHandoverDate()}
                    </p>
                  </div>
                  {/* Mini circular progress */}
                  <div className="relative flex items-center justify-center">
                    <DonutProgress 
                      value={100} 
                      max={100} 
                      color="#a855f7" 
                      size={48} 
                    />
                    <Calendar className="w-4 h-4 text-purple-400 absolute" />
                  </div>
                </div>
              </div>

              {/* Payment Split - Enhanced with icons and hover states */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 lg:col-span-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">{t('paymentSplit') || 'Payment Split'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    {/* Enhanced gradient bar */}
                    <div className="flex h-4 rounded-full overflow-hidden bg-slate-700 shadow-inner relative">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 flex items-center justify-center cursor-pointer hover:brightness-110"
                            style={{ width: `${entryData.preHandoverPercent}%` }}
                          >
                            <Hammer className="w-3 h-3 text-white/80" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-700">
                          <p className="text-sm font-medium">{formatCurrency(entryData.preHandoverAmount, currency, rate)}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500 flex items-center justify-center cursor-pointer hover:brightness-110"
                            style={{ width: `${entryData.handoverPercent}%` }}
                          >
                            <Key className="w-3 h-3 text-white/80" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-700">
                          <p className="text-sm font-medium">{formatCurrency(entryData.handoverAmount, currency, rate)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
                        <span className="text-emerald-400 font-bold">{entryData.preHandoverPercent}%</span>
                        <span className="text-slate-500">{t('preHandover') || 'Pre-Handover'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400" />
                        <span className="text-cyan-400 font-bold">{entryData.handoverPercent}%</span>
                        <span className="text-slate-500">{t('atHandoverLabel') || 'At Handover'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Day 1 Cash Required - Hero Card with Visual Breakdown */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-slate-800/50 rounded-xl p-5 border border-emerald-500/30 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl" />
              
              {/* Total Cash Required - BIG with pulse effect */}
              <div className="text-center mb-4 relative">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">{t('totalCashRequiredNow') || 'Total Cash Required Now'}</p>
                <p className="text-4xl md:text-5xl font-bold text-emerald-400 font-mono animate-pulse">
                  {formatCurrency(entryData.totalDayOneEntry, currency, rate)}
                </p>
                {/* Visual breakdown bar below the number */}
                <div className="flex h-2 rounded-full overflow-hidden bg-slate-700/50 mt-4 max-w-md mx-auto">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="bg-yellow-500 transition-all duration-500"
                        style={{ width: `${(entryData.eoiFee / entryData.totalDayOneEntry) * 100}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-slate-700">
                      <p className="text-xs">EOI: {formatCurrency(entryData.eoiFee, currency, rate)}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="bg-emerald-500 transition-all duration-500"
                        style={{ width: `${(entryData.restOfDownpayment / entryData.totalDayOneEntry) * 100}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-slate-700">
                      <p className="text-xs">Downpayment: {formatCurrency(entryData.restOfDownpayment, currency, rate)}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="bg-blue-500 transition-all duration-500"
                        style={{ width: `${(entryData.dldFee / entryData.totalDayOneEntry) * 100}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-slate-700">
                      <p className="text-xs">DLD (4%): {formatCurrency(entryData.dldFee, currency, rate)}</p>
                    </TooltipContent>
                  </Tooltip>
                  {entryData.oqoodFee > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="bg-purple-500 transition-all duration-500"
                          style={{ width: `${(entryData.oqoodFee / entryData.totalDayOneEntry) * 100}%` }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 border-slate-700">
                        <p className="text-xs">Oqood: {formatCurrency(entryData.oqoodFee, currency, rate)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {/* Legend for the breakdown bar */}
                <div className="flex flex-wrap justify-center gap-3 mt-2 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> EOI</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Downpayment</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> DLD</span>
                  {entryData.oqoodFee > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Oqood</span>}
                </div>
              </div>

              {/* Toggle to show details */}
              <button
                onClick={() => setShowEntryDetails(!showEntryDetails)}
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors py-2 border-t border-slate-700/50"
              >
                <span>{showEntryDetails ? (t('hideDetails') || 'Hide Details') : (t('viewBreakdown') || 'View Breakdown')}</span>
                {showEntryDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Details */}
              {showEntryDetails && (
                <div className="mt-4 space-y-2 pt-4 border-t border-slate-700/50">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{t('eoiBookingFee') || 'EOI / Booking Fee'}</span>
                      <Tooltip>
                        <TooltipTrigger><Info className="w-3 h-3 text-slate-500" /></TooltipTrigger>
                        <TooltipContent><p>{t('eoiTooltip') || 'Expression of Interest fee'}</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-white font-mono">{formatCurrency(entryData.eoiFee, currency, rate)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{t('restOfDownpayment') || `Rest of Downpayment (${entryData.downpaymentPercent}% - EOI)`}</span>
                      <Tooltip>
                        <TooltipTrigger><Info className="w-3 h-3 text-slate-500" /></TooltipTrigger>
                        <TooltipContent><p>{t('restOfDownpaymentTooltip') || 'Remaining portion of the downpayment after EOI'}</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-white font-mono">{formatCurrency(entryData.restOfDownpayment, currency, rate)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{t('dldRegistrationFee') || 'DLD Registration Fee (4%)'}</span>
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{t('govtFee') || 'Govt'}</span>
                      <Tooltip>
                        <TooltipTrigger><Info className="w-3 h-3 text-slate-500" /></TooltipTrigger>
                        <TooltipContent><p>{t('dldTooltip') || 'Dubai Land Department registration fee'}</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-white font-mono">{formatCurrency(entryData.dldFee, currency, rate)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{t('oqoodFee') || 'Oqood Fee'}</span>
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{t('adminFee') || 'Admin'}</span>
                      <Tooltip>
                        <TooltipTrigger><Info className="w-3 h-3 text-slate-500" /></TooltipTrigger>
                        <TooltipContent><p>{t('oqoodTooltip') || 'Initial registration fee for off-plan properties'}</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-white font-mono">{formatCurrency(entryData.oqoodFee, currency, rate)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Row 3: Payment Timeline with prominent header */}
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

        {/* ===== ACT 2: YOUR INCOME & WEALTH ===== */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-700/50 rounded-2xl overflow-hidden">
          {/* Header with LT/ST Toggle */}
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Home className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t('yourIncome') || 'Your Income'}</h2>
                <p className="text-xs text-slate-400">{t('rentalPerformance') || 'Rental performance & sustainability'}</p>
              </div>
            </div>
            {incomeData.showAirbnb && (
              <StrategyToggle 
                value={incomeStrategy} 
                onChange={setIncomeStrategy}
                ltLabel={t('longTerm') || 'Long-Term'}
                stLabel={t('shortTerm') || 'Short-Term'}
              />
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Row 1: Three Key Metrics - Equal Size, High Emphasis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ROI Card */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "bg-gradient-to-br rounded-xl p-5 border cursor-help flex flex-col items-center justify-center text-center transition-all duration-300",
                    incomeStrategy === 'LT' 
                      ? "from-cyan-500/15 to-slate-800/50 border-cyan-500/30" 
                      : "from-orange-500/15 to-slate-800/50 border-orange-500/30"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">ROI</span>
                    </div>
                    <p className={cn(
                      "text-5xl font-bold font-mono transition-all duration-300",
                      incomeStrategy === 'LT' ? "text-cyan-400" : "text-orange-400"
                    )}>
                      {incomeData.grossYield.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500 mt-2">{t('annualYield') || 'Annual Yield'}</p>
                    <div className="mt-3 pt-3 border-t border-slate-700/30 w-full">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-slate-500">{t('netRoi') || 'Net'}:</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono transition-all duration-300">{incomeData.netYield.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-slate-800 border-slate-700 p-3">
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-white">
                      {incomeStrategy === 'LT' ? (t('ltCalculation') || 'Long-Term Calculation') : (t('stCalculation') || 'Short-Term Calculation')}
                    </p>
                    {incomeStrategy === 'LT' ? (
                      <>
                        <p className="text-slate-400">{t('maintenance') || 'Maintenance'}: {incomeData.ltMaintenancePercent}%</p>
                        <p className="text-slate-400">{t('vacancyAllowance') || 'Vacancy'}: {incomeData.ltVacancyWeeks} {t('weeksYear') || 'weeks/year'}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-400">{t('occupancy') || 'Occupancy'}: {incomeData.stOccupancy}%</p>
                        <p className="text-slate-400">{t('expensesLabel') || 'Expenses'}: {incomeData.stExpenses}%</p>
                        <p className="text-slate-400">{t('adminFee') || 'Admin Fee'}: {incomeData.stAdminFee}%</p>
                      </>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Rental Income Card */}
              <div className={cn(
                "bg-gradient-to-br rounded-xl p-5 border flex flex-col items-center justify-center text-center transition-all duration-300",
                incomeStrategy === 'LT' 
                  ? "from-emerald-500/15 to-slate-800/50 border-emerald-500/30" 
                  : "from-amber-500/15 to-slate-800/50 border-amber-500/30"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('rentalIncome') || 'Rental Income'}</span>
                  <PeriodToggle value={incomePeriod} onChange={setIncomePeriod} />
                </div>
                <p className={cn(
                  "text-5xl font-bold font-mono transition-all duration-300",
                  incomeStrategy === 'LT' ? "text-emerald-400" : "text-amber-400"
                )}>
                  {formatCurrency(
                    incomeStrategy === 'LT' 
                      ? (incomePeriod === 'year' ? incomeData.annualRentLT : incomeData.monthlyRentLT)
                      : (incomePeriod === 'year' ? incomeData.annualRentST : incomeData.monthlyRentST),
                    currency,
                    rate
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-2 transition-all duration-300">
                  {incomeStrategy === 'LT' ? (t('longTerm') || 'Long-Term') : (t('shortTerm') || 'Short-Term')} /{incomePeriod === 'year' ? t('year') || 'yr' : t('month') || 'mo'}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-700/30 w-full">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-slate-500">{t('serviceCharges') || 'Service Charges'}:</span>
                    <span className="text-sm font-mono text-amber-400 transition-all duration-300">
                      -{formatCurrency(incomePeriod === 'year' ? incomeData.serviceCharges : incomeData.serviceCharges / 12, currency, rate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Time to Payback Card */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "bg-gradient-to-br rounded-xl p-5 border cursor-help flex flex-col items-center justify-center text-center transition-all duration-300",
                    incomeStrategy === 'LT' 
                      ? "from-violet-500/15 to-slate-800/50 border-violet-500/30" 
                      : "from-pink-500/15 to-slate-800/50 border-pink-500/30"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('timeToPayback') || 'Time to Payback'}</span>
                    </div>
                    <p className={cn(
                      "text-5xl font-bold font-mono transition-all duration-300",
                      incomeStrategy === 'LT' ? "text-violet-400" : "text-pink-400"
                    )}>
                      {(incomeStrategy === 'LT' ? incomeData.yearsToPayOffLT : incomeData.yearsToPayOffST).toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">{t('years') || 'years'}</p>
                    <div className="mt-3 pt-3 border-t border-slate-700/30 w-full">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-slate-500">{t('marketAvg') || 'Market Avg'}:</span>
                        <span className="text-sm font-mono text-slate-400">{incomeData.marketAvgPayoff}y</span>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 p-3 max-w-xs">
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-white">{t('paybackCalculation') || 'Payback Calculation'}</p>
                    <p className="text-slate-400">
                      {t('totalInvested') || 'Total Invested'}: {formatCurrency(
                        incomeStrategy === 'LT' ? incomeData.paybackCalcLT.totalInvested : incomeData.paybackCalcST.totalInvested, 
                        currency, rate
                      )}
                    </p>
                    <p className="text-slate-400">
                      {t('annualIncome') || 'Annual Income'}: {formatCurrency(
                        incomeStrategy === 'LT' ? incomeData.paybackCalcLT.annualIncome : incomeData.paybackCalcST.annualIncome, 
                        currency, rate
                      )}
                    </p>
                    <p className={cn("font-mono transition-all duration-300", incomeStrategy === 'LT' ? "text-violet-400" : "text-pink-400")}>
                      {(incomeStrategy === 'LT' ? incomeData.paybackCalcLT.totalInvested : incomeData.paybackCalcST.totalInvested).toLocaleString()} ÷ {(incomeStrategy === 'LT' ? incomeData.paybackCalcLT.annualIncome : incomeData.paybackCalcST.annualIncome).toLocaleString()} = {(incomeStrategy === 'LT' ? incomeData.yearsToPayOffLT : incomeData.yearsToPayOffST).toFixed(1)} {t('years') || 'yrs'}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Row 2: Net Wealth Created (10Y) */}
            <div className="bg-gradient-to-br from-amber-500/10 to-slate-800/50 rounded-xl p-5 border border-amber-500/20 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('netWealthCreated') || 'Net Wealth Created (10Y)'}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Hero Number */}
                <div className="text-center md:text-left">
                  <p className="text-4xl md:text-5xl font-bold text-amber-400 font-mono transition-all duration-300">
                    {formatCurrency(incomeStrategy === 'LT' ? wealthData.netWealthLT : wealthData.netWealthST, currency, rate)}
                  </p>
                  <p className="text-sm text-emerald-400 mt-1 transition-all duration-300">
                    +{(incomeStrategy === 'LT' ? wealthData.percentGainLT : wealthData.percentGainST).toFixed(0)}% {t('returnOnInvestment') || 'return on investment'}
                  </p>
                </div>

                {/* Breakdown */}
                <div className="flex flex-wrap justify-center md:justify-end gap-4">
                  <div className="text-center px-4 py-2 bg-slate-800/50 rounded-lg">
                    <p className="text-[10px] text-slate-500 uppercase">{t('propertyValue') || 'Property Value'}</p>
                    <p className="text-lg font-bold text-white font-mono">{formatCurrency(wealthData.propertyValue10Y, currency, rate)}</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-slate-800/50 rounded-lg transition-all duration-300">
                    <p className="text-[10px] text-slate-500 uppercase">{t('cumulativeRent') || 'Cumulative Rent'}</p>
                    <p className={cn(
                      "text-lg font-bold font-mono transition-all duration-300",
                      incomeStrategy === 'LT' ? "text-cyan-400" : "text-orange-400"
                    )}>
                      +{formatCurrency(incomeStrategy === 'LT' ? wealthData.cumulativeRentLT : wealthData.cumulativeRentST, currency, rate)}
                    </p>
                  </div>
                  <div className="text-center px-4 py-2 bg-slate-800/50 rounded-lg">
                    <p className="text-[10px] text-slate-500 uppercase">{t('initialInvestment') || 'Initial Investment'}</p>
                    <p className="text-lg font-bold text-red-400 font-mono">-{formatCurrency(wealthData.initialInvestment, currency, rate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Cumulative Income Chart */}
            <CumulativeIncomeChart
              projections={calculations.yearlyProjections}
              currency={currency}
              rate={rate}
              totalCapitalInvested={wealthData.initialInvestment}
              showAirbnbComparison={incomeStrategy === 'ST' && incomeData.showAirbnb}
            />
          </div>
        </section>

        {/* ===== ACT 4: EXIT SCENARIOS ===== */}
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

        {/* ===== ACT 5: LEVERAGE (Financing) ===== */}
        {mortgageEnabled && (
          <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t('leverage') || 'Leverage'}</h2>
                <p className="text-xs text-slate-400">{t('financingDetails') || 'Your financing details'}</p>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">{t('loanAmount') || 'Loan Amount'}</p>
                  <p className="text-xl font-bold text-blue-400 font-mono">{formatCurrency(entryData.loanAmount, currency, rate)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">{t('monthlyPayment') || 'Monthly Payment'}</p>
                  <p className="text-xl font-bold text-white font-mono">{formatCurrency(entryData.monthlyMortgage, currency, rate)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">{t('interestRate') || 'Interest Rate'}</p>
                  <p className="text-xl font-bold text-white font-mono">{entryData.interestRate}%</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">{t('loanTerm') || 'Loan Term'}</p>
                  <p className="text-xl font-bold text-white font-mono">{entryData.loanTerm} {t('years') || 'yrs'}</p>
                </div>
              </div>

              {/* Cash after Mortgage */}
              <div className="mt-4 bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                <div className="flex items-center gap-2 mb-3">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('monthlyCashflowAfterMortgage') || 'Monthly Cashflow After Mortgage'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* LT Cashflow */}
                  <div className="text-center">
                    <p className="text-xs text-cyan-400 mb-1">{t('longTerm') || 'Long-Term'}</p>
                    <p className={cn(
                      "text-2xl font-bold font-mono",
                      incomeData.monthlyRentLT - mortgageAnalysis.monthlyPayment >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {incomeData.monthlyRentLT - mortgageAnalysis.monthlyPayment >= 0 ? '+' : ''}
                      {formatCurrency(incomeData.monthlyRentLT - mortgageAnalysis.monthlyPayment, currency, rate)}
                    </p>
                  </div>
                  {/* ST Cashflow */}
                  {incomeData.showAirbnb && (
                    <div className="text-center">
                      <p className="text-xs text-orange-400 mb-1">{t('shortTerm') || 'Short-Term'}</p>
                      <p className={cn(
                        "text-2xl font-bold font-mono",
                        incomeData.monthlyRentST - mortgageAnalysis.monthlyPayment >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {incomeData.monthlyRentST - mortgageAnalysis.monthlyPayment >= 0 ? '+' : ''}
                        {formatCurrency(incomeData.monthlyRentST - mortgageAnalysis.monthlyPayment, currency, rate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Gap Warning */}
              {entryData.hasGap && (
                <div className="mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">{t('gapPaymentRequired') || 'Gap Payment Required at Handover'}</p>
                    <p className="text-lg font-bold font-mono text-amber-400">{formatCurrency(entryData.gapAmount, currency, rate)}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </TooltipProvider>
  );
};
