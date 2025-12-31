import { useMemo, useState, useCallback, useEffect } from "react";
import { 
  Wallet, TrendingUp, Trophy, Clock, ArrowRight, Banknote, Building2, 
  Key, Target, Home, Zap, DollarSign,
  Calendar, Percent, CreditCard, Shield, Check, Info, ChevronDown, ChevronUp,
  Hammer, ChevronRight, Coins, PiggyBank, Building, Landmark
} from "lucide-react";
import { OIInputs, OICalculations } from "./useOICalculations";
import { CumulativeIncomeChart } from "./CumulativeIncomeChart";
import { MortgageAnalysis, MortgageInputs } from "./useMortgageCalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PaymentHorizontalTimeline } from "./PaymentHorizontalTimeline";
import { AnimatedNumber, AnimatedCurrency } from "./AnimatedNumber";
import { StoryNavigation, StorySection, StorySectionConfig } from "./StoryNavigation";
import { OIGrowthCurve } from "./OIGrowthCurve";
import { calculateExitScenario } from "./constructionProgress";
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

// Next Section Navigator Component
const SectionNavigator = ({ 
  nextSection, 
  onNavigate 
}: { 
  nextSection: StorySectionConfig; 
  onNavigate: () => void;
}) => {
  const Icon = nextSection.icon;
  return (
    <button
      onClick={onNavigate}
      className="mt-4 w-full flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 rounded-xl transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-left">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Up Next</p>
          <p className="text-sm font-medium text-slate-300">{nextSection.fallbackLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors">
        <span className="text-xs">Continue</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
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
  
  // Active section state for story navigation
  const [activeSection, setActiveSection] = useState<StorySection>('entry');
  
  // Strategy toggles state
  const [incomeStrategy, setIncomeStrategy] = useState<'LT' | 'ST'>('LT');
  const [incomePeriod, setIncomePeriod] = useState<'month' | 'year'>('year');
  const [leveragePeriod, setLeveragePeriod] = useState<'month' | 'year'>('month');
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [highlightedExit, setHighlightedExit] = useState<number | null>(null);

  // Direction tracking for animations
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Define story sections
  const storySections: StorySectionConfig[] = useMemo(() => [
    { id: 'entry', labelKey: 'theEntry', fallbackLabel: 'Entry', icon: Wallet },
    { id: 'income', labelKey: 'yourIncome', fallbackLabel: 'Income', icon: Home },
    { id: 'exit', labelKey: 'exitScenarios', fallbackLabel: 'Exits', icon: Target },
    { id: 'leverage', labelKey: 'leverage', fallbackLabel: 'Leverage', icon: CreditCard, show: mortgageEnabled },
  ], [mortgageEnabled]);

  // Get next section for navigator
  const getNextSection = useCallback(() => {
    const visibleSections = storySections.filter(s => s.show !== false);
    const currentIndex = visibleSections.findIndex(s => s.id === activeSection);
    if (currentIndex < visibleSections.length - 1) {
      return visibleSections[currentIndex + 1];
    }
    return null;
  }, [activeSection, storySections]);

  // Handle section change with direction tracking
  const handleSectionChange = useCallback((newSection: StorySection) => {
    const currentIndex = storySections.findIndex(s => s.id === activeSection);
    const newIndex = storySections.findIndex(s => s.id === newSection);
    setSlideDirection(newIndex > currentIndex ? 'right' : 'left');
    setActiveSection(newSection);
  }, [activeSection, storySections]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const visibleSections = storySections.filter(s => s.show !== false);
      const currentIndex = visibleSections.findIndex(s => s.id === activeSection);
      
      if (e.key === 'ArrowRight' && currentIndex < visibleSections.length - 1) {
        handleSectionChange(visibleSections[currentIndex + 1].id);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        handleSectionChange(visibleSections[currentIndex - 1].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, storySections, handleSectionChange]);

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

  // ===== CALCULATE EXIT SCENARIOS using consistent function =====
  const exitScenariosData = useMemo(() => {
    return exitScenarios.map((months) => {
      return calculateExitScenario(
        months,
        calculations.basePrice,
        calculations.totalMonths,
        inputs,
        calculations.totalEntryCosts
      );
    });
  }, [exitScenarios, calculations, inputs]);

  // ===== ACT 3: WEALTH DATA (for 10-year hold) =====
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

    return {
      propertyValue10Y,
      cumulativeRentLT,
      cumulativeRentST,
      initialInvestment,
      netWealthLT,
      netWealthST,
      percentGainLT,
      percentGainST,
      showAirbnb: inputs.showAirbnbComparison,
    };
  }, [calculations, inputs.showAirbnbComparison]);

  // Get exit scenario names
  const getExitName = (months: number) => {
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

  // Animation classes based on direction
  const sectionAnimationClass = slideDirection === 'right' 
    ? "animate-fade-in" 
    : "animate-fade-in";

  const nextSection = getNextSection();

  // Mortgage calculations for leverage section
  const mortgageBreakdown = useMemo(() => {
    if (!mortgageEnabled) return null;
    
    const monthlyRate = mortgageInputs.interestRate / 100 / 12;
    const totalPayments = mortgageInputs.loanTermYears * 12;
    const monthlyPayment = mortgageAnalysis.monthlyPayment;
    
    // For first payment breakdown
    const interestPortion = mortgageAnalysis.loanAmount * monthlyRate;
    const principalPortion = monthlyPayment - interestPortion;
    
    // Gap calculation explanation
    const handoverAmount = calculations.basePrice * (100 - inputs.preHandoverPercent) / 100;
    
    return {
      monthlyPayment,
      interestPortion,
      principalPortion,
      totalPayments,
      handoverAmount,
      gapAmount: mortgageAnalysis.gapAmount,
      hasGap: mortgageAnalysis.hasGap,
      loanAmount: mortgageAnalysis.loanAmount,
    };
  }, [mortgageEnabled, mortgageInputs, mortgageAnalysis, calculations, inputs]);

  return (
    <TooltipProvider>
      <div className="space-y-0">
        {/* Story Navigation */}
        <StoryNavigation 
          sections={storySections}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        {/* Section Content Container */}
        <div className={cn("p-4 min-h-[calc(100vh-280px)] flex flex-col", sectionAnimationClass)} key={activeSection}>
          
          {/* ===== SECTION 1: ENTRY ===== */}
          {activeSection === 'entry' && (
            <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-700/50 rounded-2xl overflow-hidden flex-1 flex flex-col">
              <div className="p-4 space-y-3 flex-1">
                {/* Row 1: Property Info Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Property Price */}
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Building2 className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide">{t('propertyPrice') || 'Property Price'}</span>
                    </div>
                    <p className="text-xl font-bold text-white font-mono">{formatCurrency(entryData.basePrice, currency, rate)}</p>
                    {entryData.pricePerSqft > 0 && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        {formatCurrency(entryData.pricePerSqft, currency, rate)}/sqft • {entryData.unitSize.toLocaleString()} sqft
                      </p>
                    )}
                  </div>

                  {/* Construction Timeline */}
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Hammer className="w-3 h-3 text-purple-400" />
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide">{t('constructionTime') || 'Construction'}</span>
                    </div>
                    <p className="text-xl font-bold text-purple-400 font-mono">{entryData.constructionMonths} <span className="text-sm text-purple-400/70">mo</span></p>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Key className="w-3 h-3" /> {formatHandoverDate()}
                    </p>
                  </div>

                  {/* Payment Split */}
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 lg:col-span-2 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <CreditCard className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide">{t('paymentSplit') || 'Payment Split'}</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-slate-700 shadow-inner">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="bg-gradient-to-r from-emerald-600 to-emerald-400 flex items-center justify-center cursor-pointer hover:brightness-110"
                            style={{ width: `${entryData.preHandoverPercent}%` }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-700">
                          <p className="text-sm font-medium">{formatCurrency(entryData.preHandoverAmount, currency, rate)}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-center cursor-pointer hover:brightness-110"
                            style={{ width: `${entryData.handoverPercent}%` }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-700">
                          <p className="text-sm font-medium">{formatCurrency(entryData.handoverAmount, currency, rate)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex justify-between mt-1 text-[10px]">
                      <span className="text-emerald-400 font-bold">{entryData.preHandoverPercent}% Pre-Handover</span>
                      <span className="text-cyan-400 font-bold">{entryData.handoverPercent}% At Handover</span>
                    </div>
                  </div>
                </div>

                {/* Day 1 Cash Required */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-slate-800/50 rounded-xl p-4 border border-emerald-500/30 relative overflow-hidden">
                  <div className="text-center mb-3 relative">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{t('totalCashRequiredNow') || 'Total Cash Required Now'}</p>
                    <p className="text-3xl font-bold text-emerald-400 font-mono">
                      {formatCurrency(entryData.totalDayOneEntry, currency, rate)}
                    </p>
                    <div className="flex h-2 rounded-full overflow-hidden bg-slate-700/50 mt-3 max-w-md mx-auto">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-yellow-500" style={{ width: `${(entryData.eoiFee / entryData.totalDayOneEntry) * 100}%` }} />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-700">
                          <p className="text-xs">EOI: {formatCurrency(entryData.eoiFee, currency, rate)}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-emerald-500" style={{ width: `${(entryData.restOfDownpayment / entryData.totalDayOneEntry) * 100}%` }} />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-700">
                          <p className="text-xs">Downpayment: {formatCurrency(entryData.restOfDownpayment, currency, rate)}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-blue-500" style={{ width: `${(entryData.dldFee / entryData.totalDayOneEntry) * 100}%` }} />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-700">
                          <p className="text-xs">DLD (4%): {formatCurrency(entryData.dldFee, currency, rate)}</p>
                        </TooltipContent>
                      </Tooltip>
                      {entryData.oqoodFee > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="bg-purple-500" style={{ width: `${(entryData.oqoodFee / entryData.totalDayOneEntry) * 100}%` }} />
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 border-slate-700">
                            <p className="text-xs">Oqood: {formatCurrency(entryData.oqoodFee, currency, rate)}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-2 text-[10px]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> EOI</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Downpayment</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> DLD</span>
                      {entryData.oqoodFee > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Oqood</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowEntryDetails(!showEntryDetails)}
                    className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors py-2 border-t border-slate-700/50"
                  >
                    <span>{showEntryDetails ? 'Hide Details' : 'View Breakdown'}</span>
                    {showEntryDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {showEntryDetails && (
                    <div className="mt-3 space-y-1 pt-3 border-t border-slate-700/50 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">EOI</span><span className="text-white font-mono">{formatCurrency(entryData.eoiFee, currency, rate)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Rest of Downpayment</span><span className="text-white font-mono">{formatCurrency(entryData.restOfDownpayment, currency, rate)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">DLD (4%)</span><span className="text-white font-mono">{formatCurrency(entryData.dldFee, currency, rate)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Oqood</span><span className="text-white font-mono">{formatCurrency(entryData.oqoodFee, currency, rate)}</span></div>
                    </div>
                  )}
                </div>

                {/* Payment Schedule */}
                <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Calendar className="w-3 h-3 text-purple-400" />
                    </div>
                    <span className="text-xs font-semibold text-white">{t('yourPaymentSchedule') || 'Payment Schedule'}</span>
                  </div>
                  <PaymentHorizontalTimeline
                    inputs={inputs}
                    currency={currency}
                    rate={rate}
                    totalMonths={calculations.totalMonths}
                  />
                </div>
              </div>

              {/* Next Section Navigator */}
              {nextSection && (
                <div className="px-4 pb-4">
                  <SectionNavigator nextSection={nextSection} onNavigate={() => handleSectionChange(nextSection.id)} />
                </div>
              )}
            </section>
          )}

          {/* ===== SECTION 2: INCOME ===== */}
          {activeSection === 'income' && (
            <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-700/50 rounded-2xl overflow-hidden flex-1 flex flex-col">
              <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {incomeData.showAirbnb && (
                    <StrategyToggle 
                      value={incomeStrategy} 
                      onChange={setIncomeStrategy}
                      ltLabel={t('longTerm') || 'Long-Term'}
                      stLabel={t('shortTerm') || 'Short-Term'}
                    />
                  )}
                </div>
                <PeriodToggle value={incomePeriod} onChange={setIncomePeriod} />
              </div>

              <div className="p-3 space-y-3 flex-1">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* ROI Card */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "bg-gradient-to-br rounded-xl p-3 border cursor-help text-center",
                        incomeStrategy === 'LT' 
                          ? "from-cyan-500/15 to-slate-800/50 border-cyan-500/30" 
                          : "from-orange-500/15 to-slate-800/50 border-orange-500/30"
                      )}>
                        <span className="text-[10px] text-slate-400 uppercase">ROI</span>
                        <p className={cn("text-3xl font-bold font-mono", incomeStrategy === 'LT' ? "text-cyan-400" : "text-orange-400")}>
                          {incomeData.grossYield.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-slate-500">Net: {incomeData.netYield.toFixed(1)}%</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-slate-700 max-w-xs">
                      <div className="space-y-1 text-xs">
                        <p className="font-medium">Return on Investment</p>
                        <p>Gross: {incomeData.grossYield.toFixed(2)}% annual</p>
                        <p>Net (after costs): {incomeData.netYield.toFixed(2)}% annual</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Rental Income */}
                  <div className={cn(
                    "bg-gradient-to-br rounded-xl p-3 border text-center",
                    incomeStrategy === 'LT' 
                      ? "from-emerald-500/15 to-slate-800/50 border-emerald-500/30" 
                      : "from-orange-500/15 to-slate-800/50 border-orange-500/30"
                  )}>
                    <span className="text-[10px] text-slate-400 uppercase">{incomePeriod === 'month' ? 'Monthly' : 'Yearly'} Rent</span>
                    <p className="text-2xl font-bold text-emerald-400 font-mono">
                      {formatCurrency(
                        incomeStrategy === 'LT' 
                          ? (incomePeriod === 'month' ? incomeData.monthlyRentLT : incomeData.annualRentLT)
                          : (incomePeriod === 'month' ? incomeData.monthlyRentST : incomeData.annualRentST),
                        currency, 
                        rate
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500">Net after costs</p>
                  </div>

                  {/* Payback Period */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 text-center cursor-help">
                        <span className="text-[10px] text-slate-400 uppercase">Payback</span>
                        <p className="text-2xl font-bold text-white font-mono">
                          {(incomeStrategy === 'LT' ? incomeData.yearsToPayOffLT : incomeData.yearsToPayOffST).toFixed(1)}
                        </p>
                        <p className="text-[10px] text-slate-500">years</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-slate-700 max-w-xs">
                      <div className="space-y-1 text-xs">
                        <p className="font-medium">Payback Calculation</p>
                        <p>Investment: {formatCurrency(incomeData.paybackCalcLT.totalInvested, currency, rate)}</p>
                        <p>Annual Income: {formatCurrency(incomeStrategy === 'LT' ? incomeData.annualRentLT : incomeData.annualRentST, currency, rate)}</p>
                        <p className="text-slate-500">Market avg: {incomeData.marketAvgPayoff} years</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* 10Y Wealth */}
                  <div className="bg-gradient-to-br from-yellow-500/15 to-slate-800/50 rounded-xl p-3 border border-yellow-500/30 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">10Y Net Wealth</span>
                    <p className="text-2xl font-bold text-yellow-400 font-mono">
                      {formatCurrency(incomeStrategy === 'LT' ? wealthData.netWealthLT : wealthData.netWealthST, currency, rate)}
                    </p>
                    <p className="text-[10px] text-emerald-400">+{(incomeStrategy === 'LT' ? wealthData.percentGainLT : wealthData.percentGainST).toFixed(0)}%</p>
                  </div>
                </div>

                {/* Cumulative Income Chart - Compact */}
                <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30 flex-1 min-h-0">
                  <CumulativeIncomeChart
                    projections={calculations.yearlyProjections}
                    currency={currency}
                    rate={rate}
                    totalCapitalInvested={calculations.holdAnalysis.totalCapitalInvested}
                    showAirbnbComparison={incomeData.showAirbnb}
                  />
                </div>
              </div>

              {/* Next Section Navigator */}
              {nextSection && (
                <div className="px-4 pb-4">
                  <SectionNavigator nextSection={nextSection} onNavigate={() => handleSectionChange(nextSection.id)} />
                </div>
              )}
            </section>
          )}

          {/* ===== SECTION 3: EXIT ===== */}
          {activeSection === 'exit' && (
            <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-green-950/30 border border-slate-700/50 rounded-2xl overflow-hidden flex-1 flex flex-col">
              <div className="p-4 space-y-4 flex-1">
                {/* Exit Scenario Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {exitScenariosData.map((scenario, index) => {
                    const months = exitScenarios[index];
                    const displayROE = scenario.exitCosts > 0 ? scenario.netROE : scenario.trueROE;
                    const displayProfit = scenario.exitCosts > 0 ? scenario.netProfit : scenario.trueProfit;
                    const isHighlighted = highlightedExit === index;
                    
                    return (
                      <div 
                        key={index}
                        className={cn(
                          "rounded-xl p-3 border transition-all cursor-pointer",
                          isHighlighted
                            ? "bg-gradient-to-br from-green-500/20 to-slate-800/50 border-green-500/40 ring-1 ring-green-500/30"
                            : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600/50"
                        )}
                        onMouseEnter={() => setHighlightedExit(index)}
                        onMouseLeave={() => setHighlightedExit(null)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-400">
                            {getExitName(months)}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {months}mo
                          </span>
                        </div>
                        
                        {/* Property Worth */}
                        <p className="text-lg font-bold text-white font-mono mb-1">
                          {formatCurrency(scenario.exitPrice, currency, rate)}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn(
                              "text-sm font-bold font-mono",
                              displayProfit >= 0 ? "text-green-400" : "text-red-400"
                            )}>
                              {displayProfit >= 0 ? '+' : ''}{formatCurrency(displayProfit, currency, rate)}
                            </p>
                            <p className="text-[10px] text-slate-500">Profit</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold font-mono text-green-400">
                              {displayROE.toFixed(0)}%
                            </p>
                            <p className="text-[10px] text-slate-500">ROE</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Growth Curve Chart */}
                <OIGrowthCurve
                  calculations={calculations}
                  inputs={inputs}
                  currency={currency}
                  exitScenarios={exitScenarios}
                  rate={rate}
                  highlightedExit={highlightedExit}
                  onExitHover={setHighlightedExit}
                />
              </div>

              {/* Next Section Navigator */}
              {nextSection && (
                <div className="px-4 pb-4">
                  <SectionNavigator nextSection={nextSection} onNavigate={() => handleSectionChange(nextSection.id)} />
                </div>
              )}
            </section>
          )}

          {/* ===== SECTION 4: LEVERAGE ===== */}
          {activeSection === 'leverage' && mortgageEnabled && mortgageBreakdown && (
            <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 border border-slate-700/50 rounded-2xl overflow-hidden flex-1 flex flex-col">
              <div className="p-3 border-b border-slate-700/50 flex items-center justify-end">
                <PeriodToggle value={leveragePeriod} onChange={setLeveragePeriod} />
              </div>

              <div className="p-4 space-y-4 flex-1">
                {/* Loan Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[10px] text-slate-500 mb-1">Loan Amount</p>
                    <p className="text-xl font-bold text-blue-400 font-mono">{formatCurrency(entryData.loanAmount, currency, rate)}</p>
                  </div>
                  
                  {/* Monthly Payment with Tooltip */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 cursor-help">
                        <p className="text-[10px] text-slate-500 mb-1">{leveragePeriod === 'month' ? 'Monthly' : 'Yearly'} Payment</p>
                        <p className="text-xl font-bold text-white font-mono">
                          {formatCurrency(leveragePeriod === 'month' ? entryData.monthlyMortgage : entryData.monthlyMortgage * 12, currency, rate)}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-slate-700 max-w-xs">
                      <div className="space-y-2 text-xs">
                        <p className="font-medium">Payment Breakdown (Month 1)</p>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Principal:</span>
                            <span>{formatCurrency(mortgageBreakdown.principalPortion, currency, rate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Interest:</span>
                            <span>{formatCurrency(mortgageBreakdown.interestPortion, currency, rate)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-700 pt-1">
                            <span className="font-medium">Total:</span>
                            <span className="font-medium">{formatCurrency(mortgageBreakdown.monthlyPayment, currency, rate)}</span>
                          </div>
                        </div>
                        <p className="text-slate-500 text-[10px]">Interest rate: {entryData.interestRate}% p.a.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[10px] text-slate-500 mb-1">Interest Rate</p>
                    <p className="text-xl font-bold text-white font-mono">{entryData.interestRate}%</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[10px] text-slate-500 mb-1">Loan Term</p>
                    <p className="text-xl font-bold text-white font-mono">{entryData.loanTerm} yrs</p>
                  </div>
                </div>

                {/* Cash after Mortgage with Tooltip */}
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium text-slate-400 uppercase">{leveragePeriod === 'month' ? 'Monthly' : 'Yearly'} Cashflow After Mortgage</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center cursor-help">
                          <p className="text-xs text-cyan-400 mb-1">Long-Term</p>
                          <p className={cn(
                            "text-2xl font-bold font-mono",
                            incomeData.monthlyRentLT - mortgageAnalysis.monthlyPayment >= 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                            {(incomeData.monthlyRentLT - mortgageAnalysis.monthlyPayment) >= 0 ? '+' : ''}
                            {formatCurrency(
                              (incomeData.monthlyRentLT - mortgageAnalysis.monthlyPayment) * (leveragePeriod === 'year' ? 12 : 1), 
                              currency, 
                              rate
                            )}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 border-slate-700 max-w-xs">
                        <div className="space-y-1 text-xs">
                          <p className="font-medium">Cashflow Breakdown</p>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Gross Rent:</span>
                            <span>{formatCurrency(incomeData.monthlyRentLT, currency, rate)}/mo</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Mortgage:</span>
                            <span className="text-red-400">-{formatCurrency(mortgageAnalysis.monthlyPayment, currency, rate)}/mo</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-700 pt-1">
                            <span className="font-medium">Net Cashflow:</span>
                            <span className={incomeData.monthlyRentLT - mortgageAnalysis.monthlyPayment >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {formatCurrency(incomeData.monthlyRentLT - mortgageAnalysis.monthlyPayment, currency, rate)}/mo
                            </span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    
                    {incomeData.showAirbnb && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center cursor-help">
                            <p className="text-xs text-orange-400 mb-1">Short-Term</p>
                            <p className={cn(
                              "text-2xl font-bold font-mono",
                              incomeData.monthlyRentST - mortgageAnalysis.monthlyPayment >= 0 ? "text-emerald-400" : "text-red-400"
                            )}>
                              {(incomeData.monthlyRentST - mortgageAnalysis.monthlyPayment) >= 0 ? '+' : ''}
                              {formatCurrency(
                                (incomeData.monthlyRentST - mortgageAnalysis.monthlyPayment) * (leveragePeriod === 'year' ? 12 : 1), 
                                currency, 
                                rate
                              )}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-700 max-w-xs">
                          <div className="space-y-1 text-xs">
                            <p className="font-medium">Cashflow Breakdown</p>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Gross Rent:</span>
                              <span>{formatCurrency(incomeData.monthlyRentST, currency, rate)}/mo</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Mortgage:</span>
                              <span className="text-red-400">-{formatCurrency(mortgageAnalysis.monthlyPayment, currency, rate)}/mo</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-700 pt-1">
                              <span className="font-medium">Net Cashflow:</span>
                              <span className={incomeData.monthlyRentST - mortgageAnalysis.monthlyPayment >= 0 ? "text-emerald-400" : "text-red-400"}>
                                {formatCurrency(incomeData.monthlyRentST - mortgageAnalysis.monthlyPayment, currency, rate)}/mo
                              </span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* Gap Warning with Tooltip */}
                {entryData.hasGap && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 cursor-help">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <div>
                          <p className="text-sm font-medium text-amber-300">Gap Payment Required at Handover</p>
                          <p className="text-lg font-bold font-mono text-amber-400">{formatCurrency(entryData.gapAmount, currency, rate)}</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-slate-700 max-w-sm">
                      <div className="space-y-2 text-xs">
                        <p className="font-medium">Why is there a gap payment?</p>
                        <p className="text-slate-400">
                          The handover payment exceeds what the bank can finance at your LTV.
                        </p>
                        <div className="space-y-1 pt-2 border-t border-slate-700">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Handover Amount:</span>
                            <span>{formatCurrency(mortgageBreakdown.handoverAmount, currency, rate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Max Bank Financing:</span>
                            <span>{formatCurrency(mortgageBreakdown.loanAmount, currency, rate)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-700 pt-1">
                            <span className="font-medium text-amber-400">Gap (You Pay):</span>
                            <span className="font-medium text-amber-400">{formatCurrency(mortgageBreakdown.gapAmount, currency, rate)}</span>
                          </div>
                        </div>
                        <p className="text-slate-500 text-[10px]">Due at handover before bank disburses the loan.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Wealth Equation */}
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase">10-Year Wealth Equation</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1">
                        <Wallet className="w-5 h-5 text-emerald-400" />
                      </div>
                      <p className="text-xs text-slate-500">Cash In</p>
                      <p className="text-sm font-bold font-mono text-white">{formatCurrency(wealthData.initialInvestment, currency, rate)}</p>
                    </div>
                    <span className="text-xl text-slate-500">+</span>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-1">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                      </div>
                      <p className="text-xs text-slate-500">Growth</p>
                      <p className="text-sm font-bold font-mono text-white">{formatCurrency(wealthData.propertyValue10Y - calculations.basePrice, currency, rate)}</p>
                    </div>
                    <span className="text-xl text-slate-500">+</span>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mb-1">
                        <Coins className="w-5 h-5 text-cyan-400" />
                      </div>
                      <p className="text-xs text-slate-500">Rent</p>
                      <p className="text-sm font-bold font-mono text-white">{formatCurrency(wealthData.cumulativeRentLT, currency, rate)}</p>
                    </div>
                    <span className="text-xl text-slate-500">=</span>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mb-1">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                      </div>
                      <p className="text-xs text-slate-500">Net Wealth</p>
                      <p className="text-sm font-bold font-mono text-yellow-400">{formatCurrency(wealthData.netWealthLT, currency, rate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
