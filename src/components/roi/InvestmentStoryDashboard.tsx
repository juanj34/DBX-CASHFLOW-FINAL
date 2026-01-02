import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { 
  Wallet, TrendingUp, Trophy, Clock, Banknote, Building2, 
  Key, Target, Home, Zap, DollarSign,
  Calendar, Percent, CreditCard, Info, ChevronDown, ChevronUp,
  Hammer, Coins, FileText, CalendarDays, Sparkles
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
import { RentalCashflowWaterfall } from "./CashflowWaterfall";
import { PropertyShowcase } from "./PropertyShowcase";
import { ProjectionDisclaimer } from "./ProjectionDisclaimer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Staggered animation wrapper component
const AnimatedCard = ({ 
  children, 
  delay = 0, 
  className = "" 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-4",
        className
      )}
    >
      {children}
    </div>
  );
};

interface ClientInfo {
  clients?: { id: string; name: string; country?: string }[];
  clientName?: string;
  clientCountry?: string;
  projectName?: string;
  developer?: string;
  unit?: string;
  unitType?: string;
  zoneName?: string;
  zoneId?: string;
}

interface InvestmentStoryDashboardProps {
  inputs: OIInputs;
  calculations: OICalculations;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
  // New props for showcase section
  clientInfo?: ClientInfo;
  heroImageUrl?: string | null;
  buildingRenderUrl?: string | null;
  developerId?: string;
  projectId?: string;
  zoneId?: string;
  customDifferentiators?: import('./valueDifferentiators').ValueDifferentiator[];
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
  <div className="inline-flex rounded-lg bg-theme-card p-0.5">
    <button
      onClick={() => onChange('LT')}
      className={cn(
        "px-3 py-1 text-xs font-medium rounded-md transition-all",
        value === 'LT' 
          ? "bg-cyan-500 text-white" 
          : "text-theme-text-muted hover:text-theme-text"
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
          : "text-theme-text-muted hover:text-theme-text"
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
    <div className="inline-flex rounded-lg bg-theme-card p-0.5">
      <button
        onClick={() => onChange('month')}
        className={cn(
          "px-2 py-0.5 text-[10px] font-medium rounded-md transition-all",
          value === 'month' 
            ? "bg-theme-card-alt text-theme-text" 
            : "text-theme-text-muted hover:text-theme-text"
        )}
      >
        {t('month') || 'Month'}
      </button>
      <button
        onClick={() => onChange('year')}
        className={cn(
          "px-2 py-0.5 text-[10px] font-medium rounded-md transition-all",
          value === 'year' 
            ? "bg-theme-card-alt text-theme-text" 
            : "text-theme-text-muted hover:text-theme-text"
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
  clientInfo,
  heroImageUrl,
  buildingRenderUrl,
  developerId,
  projectId,
  zoneId,
  customDifferentiators,
}: InvestmentStoryDashboardProps) => {
  const { t } = useLanguage();
  const mortgageEnabled = mortgageInputs.enabled;
  
  // Active section state for story navigation - start with showcase
  const [activeSection, setActiveSection] = useState<StorySection>('showcase');
  
  // Strategy toggles state
  const [incomeStrategy, setIncomeStrategy] = useState<'LT' | 'ST'>('LT');
  const [incomePeriod, setIncomePeriod] = useState<'month' | 'year'>('year');
  const [leveragePeriod, setLeveragePeriod] = useState<'month' | 'year'>('month');
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [highlightedExit, setHighlightedExit] = useState<number | null>(null);

  // Direction tracking for animations
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Define story sections - showcase first
  const storySections: StorySectionConfig[] = useMemo(() => [
    { id: 'showcase', labelKey: 'theProperty', fallbackLabel: 'Property', icon: Sparkles },
    { id: 'entry', labelKey: 'theEntry', fallbackLabel: 'Entry', icon: Wallet },
    { id: 'income', labelKey: 'yourIncome', fallbackLabel: 'Income', icon: Home },
    { id: 'exit', labelKey: 'exitScenarios', fallbackLabel: 'Exits', icon: Target },
    { id: 'leverage', labelKey: 'leverage', fallbackLabel: 'Leverage', icon: CreditCard, show: mortgageEnabled },
  ], [mortgageEnabled]);


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
    const basePrice = calculations.basePrice;
    
    // Correct wealth equation:
    // Property Value (Y10) - Base Price + Rent Collected = Net Gain
    // Or simply: Property Value + Rent - Initial Investment = Net Wealth
    const appreciation10Y = propertyValue10Y - basePrice;
    const netWealthLT = propertyValue10Y + cumulativeRentLT - initialInvestment;
    const netWealthST = propertyValue10Y + cumulativeRentST - initialInvestment;
    const percentGainLT = initialInvestment > 0 ? (netWealthLT / initialInvestment) * 100 : 0;
    const percentGainST = initialInvestment > 0 ? (netWealthST / initialInvestment) * 100 : 0;

    return {
      propertyValue10Y,
      appreciation10Y,
      basePrice,
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
      <div className="h-full flex flex-col">
        {/* Story Navigation */}
        <StoryNavigation 
          sections={storySections}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          projectName={clientInfo?.projectName}
          unitType={clientInfo?.unitType}
          unitNumber={clientInfo?.unit}
          unitSizeSqft={inputs.unitSizeSqf}
        />

        {/* Section Content Container */}
        <div className={cn("p-4 flex-1 flex flex-col min-h-0", sectionAnimationClass)} key={activeSection}>
          
          {/* ===== SECTION 0: PROPERTY SHOWCASE ===== */}
          {activeSection === 'showcase' && (
            <section className="flex-1 flex flex-col overflow-hidden">
              <PropertyShowcase
                inputs={inputs}
                calculations={calculations}
                clientInfo={clientInfo || {}}
                currency={currency}
                rate={rate}
                heroImageUrl={heroImageUrl}
                buildingRenderUrl={buildingRenderUrl}
                developerId={developerId}
                projectId={projectId}
                zoneId={zoneId}
                className="h-full"
              />
            </section>
          )}

          {/* ===== SECTION 1: ENTRY ===== */}
          {activeSection === 'entry' && (
            <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-700/50 rounded-2xl overflow-hidden flex-1 flex flex-col">
              <div className="p-4 space-y-3 flex-1">
                {/* Row 1: Property Info Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Property Price */}
                  <AnimatedCard delay={0}>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 relative overflow-hidden h-full">
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
                  </AnimatedCard>

                  {/* Construction Timeline */}
                  <AnimatedCard delay={50}>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 relative overflow-hidden h-full">
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
                  </AnimatedCard>

                  {/* Payment Split */}
                  <AnimatedCard delay={100} className="lg:col-span-2">
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 relative overflow-hidden h-full">
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
                          <TooltipContent className="bg-slate-800 border-slate-700 text-slate-100">
                            <p className="text-sm font-medium text-white">{formatCurrency(entryData.preHandoverAmount, currency, rate)}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className="bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-center cursor-pointer hover:brightness-110"
                              style={{ width: `${entryData.handoverPercent}%` }}
                            />
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 border-slate-700 text-slate-100">
                            <p className="text-sm font-medium text-white">{formatCurrency(entryData.handoverAmount, currency, rate)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex justify-between mt-1 text-[10px]">
                        <span className="text-emerald-400 font-bold">{entryData.preHandoverPercent}% Pre-Handover</span>
                        <span className="text-cyan-400 font-bold">{entryData.handoverPercent}% At Handover</span>
                      </div>
                    </div>
                  </AnimatedCard>
                </div>

                {/* Two Cards: Booking + Installments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Booking Card (Day 1) */}
                  <AnimatedCard delay={150}>
                    <div className="bg-gradient-to-br from-emerald-500/10 to-slate-800/50 rounded-xl p-4 border border-emerald-500/30 h-full">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <FileText className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="text-xs font-semibold text-white uppercase tracking-wide">Booking</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-400 font-mono mb-2">
                        {formatCurrency(entryData.totalDayOneEntry, currency, rate)}
                      </p>
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-700/50 mb-2">
                        <div className="bg-yellow-500" style={{ width: `${(entryData.eoiFee / entryData.totalDayOneEntry) * 100}%` }} />
                        <div className="bg-emerald-500" style={{ width: `${(entryData.restOfDownpayment / entryData.totalDayOneEntry) * 100}%` }} />
                        <div className="bg-blue-500" style={{ width: `${(entryData.dldFee / entryData.totalDayOneEntry) * 100}%` }} />
                        {entryData.oqoodFee > 0 && <div className="bg-purple-500" style={{ width: `${(entryData.oqoodFee / entryData.totalDayOneEntry) * 100}%` }} />}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />EOI</span>
                          <span className="text-white font-mono">{formatCurrency(entryData.eoiFee, currency, rate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Downpayment</span>
                          <span className="text-white font-mono">{formatCurrency(entryData.restOfDownpayment, currency, rate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />DLD (4%)</span>
                          <span className="text-white font-mono">{formatCurrency(entryData.dldFee, currency, rate)}</span>
                        </div>
                        {entryData.oqoodFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" />Oqood</span>
                            <span className="text-white font-mono">{formatCurrency(entryData.oqoodFee, currency, rate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </AnimatedCard>

                  {/* Installments Card */}
                  <AnimatedCard delay={200}>
                    {(() => {
                      const basePrice = calculations.basePrice;
                      const installmentsTotal = (inputs.additionalPayments || []).reduce((sum, p) => sum + (basePrice * (p.paymentPercent || 0) / 100), 0);
                      const installmentsCount = (inputs.additionalPayments || []).length;
                      return (
                        <div className="bg-gradient-to-br from-cyan-500/10 to-slate-800/50 rounded-xl p-4 border border-cyan-500/30 h-full">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                              <CalendarDays className="w-3 h-3 text-cyan-400" />
                            </div>
                            <span className="text-xs font-semibold text-white uppercase tracking-wide">Installments</span>
                          </div>
                          <p className="text-2xl font-bold text-cyan-400 font-mono mb-2">
                            {formatCurrency(installmentsTotal, currency, rate)}
                          </p>
                          <p className="text-xs text-slate-400 mb-3">
                            During construction (pre-handover)
                          </p>
                          {installmentsCount > 0 ? (
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">
                                {installmentsCount} payment{installmentsCount !== 1 ? 's' : ''}
                              </span>
                              <span className="text-slate-500">scheduled</span>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 italic">
                              No additional installments
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </AnimatedCard>
                </div>

                {/* Payment Schedule */}
                <AnimatedCard delay={200}>
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
                </AnimatedCard>
              </div>

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
                <div className="grid grid-cols-3 gap-3">
                  {/* ROI Card (LT) / ADR Card (ST) */}
                  {incomeStrategy === 'LT' ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-gradient-to-br from-cyan-500/15 to-slate-800/50 rounded-xl p-3 border border-cyan-500/30 cursor-help text-center">
                          <span className="text-[10px] text-slate-400 uppercase">ROI</span>
                          <p className="text-3xl font-bold font-mono text-cyan-400">
                            {incomeData.grossYield.toFixed(1)}%
                          </p>
                          <p className="text-[10px] text-slate-500">Net: {incomeData.netYield.toFixed(1)}%</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 border-slate-700 max-w-xs text-slate-100">
                        <div className="space-y-1 text-xs">
                          <p className="font-medium text-white">Return on Investment</p>
                          <p className="text-slate-300">Gross: {incomeData.grossYield.toFixed(2)}% annual</p>
                          <p className="text-slate-300">Net (after costs): {incomeData.netYield.toFixed(2)}% annual</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-gradient-to-br from-orange-500/15 to-slate-800/50 rounded-xl p-3 border border-orange-500/30 cursor-help text-center">
                          <span className="text-[10px] text-slate-400 uppercase">ADR</span>
                          <p className="text-2xl font-bold font-mono text-orange-400">
                            {formatCurrency(inputs.shortTermRental?.averageDailyRate || 800, currency, rate)}
                          </p>
                          <div className="flex justify-center gap-3 mt-1 text-[10px]">
                            <span className="text-slate-500">Occ: <span className="text-orange-300 font-mono">{incomeData.stOccupancy}%</span></span>
                            <span className="text-slate-500">Exp: <span className="text-orange-300 font-mono">{incomeData.stExpenses}%</span></span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 border-slate-700 max-w-xs text-slate-100">
                        <div className="space-y-1 text-xs">
                          <p className="font-medium text-white">Average Daily Rate</p>
                          <p className="text-slate-300">Occupancy: {incomeData.stOccupancy}%</p>
                          <p className="text-slate-300">Operating Expenses: {incomeData.stExpenses}%</p>
                          {incomeData.stAdminFee > 0 && <p className="text-slate-300">Management Fee: {incomeData.stAdminFee}%</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}

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
                    <TooltipContent className="bg-slate-800 border-slate-700 max-w-xs text-slate-100">
                      <div className="space-y-1 text-xs">
                        <p className="font-medium text-white">Payback Calculation</p>
                        <p className="text-slate-300">Investment: {formatCurrency(incomeData.paybackCalcLT.totalInvested, currency, rate)}</p>
                        <p className="text-slate-300">Annual Income: {formatCurrency(incomeStrategy === 'LT' ? incomeData.annualRentLT : incomeData.annualRentST, currency, rate)}</p>
                        <p className="text-slate-400">Market avg: {incomeData.marketAvgPayoff} years</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>

                </div>

                {/* Cashflow Waterfall Visualization */}
                <RentalCashflowWaterfall
                  grossRent={
                    incomeStrategy === 'LT'
                      ? (incomePeriod === 'month' 
                          ? incomeData.monthlyRentLT + incomeData.serviceCharges / 12 
                          : incomeData.annualRentLT + incomeData.serviceCharges)
                      : (incomePeriod === 'month' 
                          ? incomeData.monthlyRentST + incomeData.annualRentST / 12 * 0.1 
                          : incomeData.annualRentST + incomeData.annualRentST * 0.1)
                  }
                  serviceCharges={
                    incomeStrategy === 'LT'
                      ? (incomePeriod === 'month' ? incomeData.serviceCharges / 12 : incomeData.serviceCharges)
                      : (incomePeriod === 'month' ? incomeData.annualRentST / 12 * 0.1 : incomeData.annualRentST * 0.1)
                  }
                  managementFee={0}
                  mortgagePayment={0}
                  currency={currency}
                  rate={rate}
                  period={incomePeriod}
                  strategy={incomeStrategy}
                />

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

                {/* Net Rent Projection Table (10 Years) */}
                {(() => {
                  // Filter to get only full rental years (skip construction and partial first year)
                  const fullRentYears = calculations.yearlyProjections
                    .filter((p, idx, arr) => {
                      if (p.isConstruction || p.netIncome === null) return false;
                      // Skip first rental year if it's partial (handover year)
                      const rentalYears = arr.filter(y => !y.isConstruction && y.netIncome !== null);
                      const firstFullYearIndex = rentalYears.findIndex((_, i) => i > 0) > 0 ? 1 : 0;
                      const currentRentalIndex = rentalYears.indexOf(p);
                      return currentRentalIndex >= firstFullYearIndex;
                    })
                    .slice(0, 10);
                  
                  // Simpler approach: skip the first rental year (handover year with partial income)
                  const allRentalYears = calculations.yearlyProjections.filter(p => !p.isConstruction && p.netIncome !== null);
                  const rentYears = allRentalYears.slice(1, 11); // Skip first (partial) year, take next 10
                  
                  if (rentYears.length === 0) return null;
                  
                  return (
                    <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Projected Net Rental Income (Years 1–10)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              {rentYears.map((_, idx) => (
                                <th key={idx} className="px-2 py-1 text-slate-500 font-normal text-center whitespace-nowrap">
                                  Y{idx + 1}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {rentYears.map((p, idx) => (
                                <td key={idx} className="px-2 py-1 text-center font-mono text-emerald-400 whitespace-nowrap">
                                  {formatCurrency(p.netIncome || 0, currency, rate)}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

              </div>

            </section>
          )}

          {/* ===== SECTION 3: EXIT ===== */}
          {activeSection === 'exit' && (
            <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-green-950/30 border border-slate-700/50 rounded-2xl overflow-hidden flex-1 flex flex-col h-full">
              <div className="p-4 flex-1 flex flex-col gap-3 min-h-0">
                {/* Exit Scenario Cards - Compact row */}
                <div className="grid grid-cols-3 gap-3 shrink-0">
                  {exitScenariosData.map((scenario, index) => {
                    const months = exitScenarios[index];
                    const displayROE = scenario.exitCosts > 0 ? scenario.netROE : scenario.trueROE;
                    const displayProfit = scenario.exitCosts > 0 ? scenario.netProfit : scenario.trueProfit;
                    const isHighlighted = highlightedExit === index;
                    
                    // Get exit date
                    const exitTotalMonths = inputs.bookingMonth + months;
                    const exitYear = inputs.bookingYear + Math.floor((exitTotalMonths - 1) / 12);
                    const exitMonth = ((exitTotalMonths - 1) % 12) + 1;
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const exitDate = `${monthNames[exitMonth - 1]} ${exitYear}`;
                    
                    return (
                      <AnimatedCard key={index} delay={index * 75}>
                        <div 
                          className={cn(
                            "rounded-xl p-4 border transition-all cursor-pointer",
                            isHighlighted
                              ? "bg-gradient-to-br from-[#CCFF00]/10 to-slate-800/80 border-[#CCFF00]/50 ring-1 ring-[#CCFF00]/30"
                              : "bg-slate-800/60 border-slate-700/40 hover:border-[#CCFF00]/30"
                          )}
                          onMouseEnter={() => setHighlightedExit(index)}
                          onMouseLeave={() => setHighlightedExit(null)}
                        >
                          {/* Header: Exit number, months, and date */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-[#CCFF00]">Exit {index + 1}</span>
                              <span className="px-2 py-0.5 bg-slate-700/60 rounded text-xs text-white font-mono">{months}mo</span>
                            </div>
                            <span className="text-xs text-slate-400">{exitDate}</span>
                          </div>
                          
                          {/* Property Value */}
                          <div className="mb-2">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">Property Value</p>
                            <p className="text-lg font-bold text-white font-mono">
                              {formatCurrency(scenario.exitPrice, currency, rate)}
                            </p>
                          </div>
                          
                          {/* Cash Invested */}
                          <div className="mb-3">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">Cash In</p>
                            <p className="text-sm font-medium text-slate-300 font-mono">
                              {formatCurrency(scenario.equityDeployed + (scenario.totalCapital - scenario.equityDeployed), currency, rate)}
                            </p>
                          </div>
                          
                          {/* Profit and ROE - Compact bottom */}
                          <div className="flex items-end justify-between pt-2 border-t border-slate-700/50">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500">Profit</p>
                              <p className={cn(
                                "text-base font-bold font-mono",
                                displayProfit >= 0 ? "text-emerald-400" : "text-red-400"
                              )}>
                                {displayProfit >= 0 ? '+' : ''}{formatCurrency(displayProfit, currency, rate)}
                              </p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-wider text-slate-500">ROE</p>
                              <p className={cn(
                                "text-2xl font-bold font-mono",
                                displayROE >= 0 ? "text-[#CCFF00]" : "text-red-400"
                              )}>
                                {displayROE.toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </AnimatedCard>
                    );
                  })}
                </div>

                {/* Growth Curve Chart - Takes remaining space */}
                <div className="flex-1 min-h-[280px]">
                  <AnimatedCard delay={300} className="h-full">
                    <OIGrowthCurve
                      calculations={calculations}
                      inputs={inputs}
                      currency={currency}
                      exitScenarios={exitScenarios}
                      rate={rate}
                      highlightedExit={highlightedExit}
                      onExitHover={setHighlightedExit}
                    />
                  </AnimatedCard>
                </div>
              </div>

            </section>
          )}

          {/* ===== SECTION 4: LEVERAGE ===== */}
          {activeSection === 'leverage' && mortgageEnabled && mortgageBreakdown && (
            <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 border border-slate-700/50 rounded-2xl overflow-hidden flex-1 flex flex-col">
              <div className="p-4 space-y-4 flex-1">
                {/* Loan Details Grid - with toggle inline */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[10px] text-slate-500 mb-1">Loan Amount</p>
                    <p className="text-xl font-bold text-blue-400 font-mono">{formatCurrency(entryData.loanAmount, currency, rate)}</p>
                  </div>
                  
                  {/* Monthly Payment with inline toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30 cursor-help">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] text-slate-500">Payment</p>
                          <PeriodToggle value={leveragePeriod} onChange={setLeveragePeriod} />
                        </div>
                        <p className="text-xl font-bold text-white font-mono">
                          {formatCurrency(leveragePeriod === 'month' ? entryData.monthlyMortgage : entryData.monthlyMortgage * 12, currency, rate)}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-slate-700 max-w-xs text-slate-100">
                      <div className="space-y-2 text-xs">
                        <p className="font-medium text-white">Payment Breakdown (Month 1)</p>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Principal:</span>
                            <span className="text-slate-200">{formatCurrency(mortgageBreakdown.principalPortion, currency, rate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Interest:</span>
                            <span className="text-slate-200">{formatCurrency(mortgageBreakdown.interestPortion, currency, rate)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-700 pt-1">
                            <span className="font-medium text-white">Total:</span>
                            <span className="font-medium text-white">{formatCurrency(mortgageBreakdown.monthlyPayment, currency, rate)}</span>
                          </div>
                        </div>
                        <p className="text-slate-400 text-[10px]">Interest rate: {entryData.interestRate}% p.a.</p>
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

                {/* Net Cashflow Cards - Simplified */}
                <div className={cn("grid gap-3", incomeData.showAirbnb ? "grid-cols-2" : "grid-cols-1")}>
                  {/* LT Net Cashflow */}
                  <div className={cn(
                    "rounded-xl p-4 border text-center",
                    incomeData.monthlyRentLT - mortgageAnalysis.monthlyPayment >= 0
                      ? "bg-gradient-to-br from-emerald-500/15 to-slate-800/50 border-emerald-500/30"
                      : "bg-gradient-to-br from-red-500/15 to-slate-800/50 border-red-500/30"
                  )}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Banknote className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-medium text-slate-400">Long-Term</span>
                    </div>
                    <p className={cn(
                      "text-2xl font-bold font-mono",
                      incomeData.monthlyRentLT - mortgageAnalysis.monthlyPayment >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {(incomeData.monthlyRentLT - mortgageAnalysis.monthlyPayment) >= 0 ? '+' : ''}
                      {formatCurrency((incomeData.monthlyRentLT - mortgageAnalysis.monthlyPayment) * (leveragePeriod === 'year' ? 12 : 1), currency, rate)}
                    </p>
                    <p className="text-[10px] text-slate-500">/{leveragePeriod === 'month' ? 'mo' : 'yr'} net cashflow</p>
                  </div>

                  {/* ST Net Cashflow */}
                  {incomeData.showAirbnb && (
                    <div className={cn(
                      "rounded-xl p-4 border text-center",
                      incomeData.monthlyRentST - mortgageAnalysis.monthlyPayment >= 0
                        ? "bg-gradient-to-br from-emerald-500/15 to-slate-800/50 border-emerald-500/30"
                        : "bg-gradient-to-br from-red-500/15 to-slate-800/50 border-red-500/30"
                    )}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Banknote className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-medium text-slate-400">Short-Term</span>
                      </div>
                      <p className={cn(
                        "text-2xl font-bold font-mono",
                        incomeData.monthlyRentST - mortgageAnalysis.monthlyPayment >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {(incomeData.monthlyRentST - mortgageAnalysis.monthlyPayment) >= 0 ? '+' : ''}
                        {formatCurrency((incomeData.monthlyRentST - mortgageAnalysis.monthlyPayment) * (leveragePeriod === 'year' ? 12 : 1), currency, rate)}
                      </p>
                      <p className="text-[10px] text-slate-500">/{leveragePeriod === 'month' ? 'mo' : 'yr'} net cashflow</p>
                    </div>
                  )}
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
                    <TooltipContent className="bg-slate-800 border-slate-700 max-w-sm text-slate-100">
                      <div className="space-y-2 text-xs">
                        <p className="font-medium text-white">Why is there a gap payment?</p>
                        <p className="text-slate-300">
                          The handover payment exceeds what the bank can finance at your LTV.
                        </p>
                        <div className="space-y-1 pt-2 border-t border-slate-700">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Handover Amount:</span>
                            <span className="text-slate-200">{formatCurrency(mortgageBreakdown.handoverAmount, currency, rate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Max Bank Financing:</span>
                            <span className="text-slate-200">{formatCurrency(mortgageBreakdown.loanAmount, currency, rate)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-700 pt-1">
                            <span className="font-medium text-amber-400">Gap (You Pay):</span>
                            <span className="font-medium text-amber-400">{formatCurrency(mortgageBreakdown.gapAmount, currency, rate)}</span>
                          </div>
                        </div>
                        <p className="text-slate-400 text-[10px]">Due at handover before bank disburses the loan.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Debt vs Wealth (10Y Analysis) - Clear breakdown */}
                {(() => {
                  // Calculate 10-year interest paid (not full term)
                  const monthlyRate = (entryData.interestRate / 100) / 12;
                  const totalMonths = 120; // 10 years
                  let remainingBalance = mortgageBreakdown.loanAmount;
                  let totalInterest10Y = 0;
                  
                  for (let m = 0; m < totalMonths && remainingBalance > 0; m++) {
                    const interestPayment = remainingBalance * monthlyRate;
                    const principalPayment = mortgageAnalysis.monthlyPayment - interestPayment;
                    totalInterest10Y += interestPayment;
                    remainingBalance -= principalPayment;
                  }

                  const rent10Y = wealthData.cumulativeRentLT;
                  const netWealth10Y = wealthData.appreciation10Y + rent10Y - totalInterest10Y;
                  const maxValue = Math.max(wealthData.appreciation10Y, rent10Y, totalInterest10Y);

                  return (
                    <div className="bg-gradient-to-br from-emerald-500/10 to-slate-800/50 rounded-xl p-4 border border-emerald-500/30">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase">Debt vs Wealth (10-Year Analysis)</span>
                      </div>
                      
                      {/* Clear breakdown with consistent 10Y timeframe */}
                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Property Appreciation (10Y)</span>
                            <span className="text-emerald-400 font-mono">+{formatCurrency(wealthData.appreciation10Y, currency, rate)}</span>
                          </div>
                          <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 rounded-full" style={{ width: `${(wealthData.appreciation10Y / maxValue) * 100}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Rent Collected (10Y)</span>
                            <span className="text-cyan-400 font-mono">+{formatCurrency(rent10Y, currency, rate)}</span>
                          </div>
                          <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full" style={{ width: `${(rent10Y / maxValue) * 100}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Interest Paid (10Y)</span>
                            <span className="text-red-400 font-mono">-{formatCurrency(totalInterest10Y, currency, rate)}</span>
                          </div>
                          <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full" style={{ width: `${(totalInterest10Y / maxValue) * 100}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Formula display */}
                      <div className="border-t border-slate-700/50 pt-3">
                        <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-2">
                          <span>Appreciation + Rent − Interest =</span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400 mb-1">🚀 Net Wealth Created (10Y)</p>
                          <p className="text-2xl font-bold font-mono text-emerald-400">{formatCurrency(netWealth10Y, currency, rate)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
