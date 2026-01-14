import { useMemo } from "react";
import { OIInputs, OICalculations } from "./useOICalculations";
import { MortgageAnalysis } from "./useMortgageCalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { DollarSign, TrendingUp, Clock, Target, Calendar, ChevronRight, Building, Landmark, FileImage } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";
import { calculateExitScenario } from "./constructionProgress";
import { cn } from "@/lib/utils";

interface UnifiedInvestmentOverviewProps {
  inputs: OIInputs;
  calculations: OICalculations;
  mortgageAnalysis?: MortgageAnalysis;
  mortgageEnabled?: boolean;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
  readOnly?: boolean;
  compact?: boolean;
  // Action links
  developerId?: string;
  projectId?: string;
  floorPlanUrl?: string | null;
  onViewDeveloper?: () => void;
  onViewProject?: () => void;
  onViewFloorPlan?: () => void;
}

export const UnifiedInvestmentOverview = ({
  inputs,
  calculations,
  mortgageAnalysis,
  mortgageEnabled = false,
  exitScenarios,
  currency,
  rate,
  readOnly = false,
  compact = false,
  developerId,
  projectId,
  floorPlanUrl,
  onViewDeveloper,
  onViewProject,
  onViewFloorPlan,
}: UnifiedInvestmentOverviewProps) => {
  const { t, language } = useLanguage();

  // Calculate exit scenarios data
  const exitData = useMemo(() => {
    return exitScenarios.slice(0, 3).map(months => {
      const scenario = calculateExitScenario(
        months,
        calculations.basePrice,
        calculations.totalMonths,
        inputs,
        calculations.totalEntryCosts
      );
      
      const totalMonthsFromJan = inputs.bookingMonth + months;
      const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
      const month = ((totalMonthsFromJan - 1) % 12) + 1;
      const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthNames = language === 'es' ? monthNamesEs : monthNamesEn;
      
      const displayROE = scenario.exitCosts > 0 ? scenario.netROE : scenario.trueROE;
      const displayProfit = scenario.exitCosts > 0 ? scenario.netProfit : scenario.trueProfit;
      
      return {
        months,
        date: `${monthNames[month - 1]} ${inputs.bookingYear + yearOffset}`,
        roe: displayROE,
        profit: displayProfit,
        exitPrice: scenario.exitPrice,
        equityDeployed: scenario.equityDeployed,
      };
    });
  }, [exitScenarios, calculations, inputs, language]);

  // Entry calculations
  const entryData = useMemo(() => {
    const downpaymentAmount = calculations.basePrice * inputs.downpaymentPercent / 100;
    const totalCashToStart = downpaymentAmount + calculations.totalEntryCosts;
    
    let mortgageContribution = 0;
    if (mortgageEnabled && mortgageAnalysis) {
      mortgageContribution = mortgageAnalysis.loanAmount;
    }
    
    return {
      downpayment: downpaymentAmount,
      fees: calculations.totalEntryCosts,
      totalCash: totalCashToStart,
      mortgageContribution,
      paymentPlan: `${inputs.preHandoverPercent}/${100 - inputs.preHandoverPercent}`,
    };
  }, [calculations, inputs, mortgageEnabled, mortgageAnalysis]);

  // Rental data
  const rentalData = useMemo(() => {
    const monthlyRent = calculations.holdAnalysis.annualRent / 12;
    const annualRent = calculations.holdAnalysis.annualRent;
    const yieldOnInvestment = calculations.holdAnalysis.rentalYieldOnInvestment;
    
    return {
      monthlyRent,
      annualRent,
      yieldOnInvestment,
      yearsToBreakeven: calculations.holdAnalysis.yearsToBreakEven,
      netYield: calculations.holdAnalysis.netAnnualRent > 0 
        ? (calculations.holdAnalysis.netAnnualRent / calculations.holdAnalysis.totalCapitalInvested) * 100
        : yieldOnInvestment,
    };
  }, [calculations.holdAnalysis]);

  const hasActionLinks = (developerId && onViewDeveloper) || (projectId && onViewProject) || (floorPlanUrl && onViewFloorPlan);

  const cardClass = cn(
    "bg-theme-card border border-theme-border rounded-xl p-4 relative overflow-hidden",
    "before:absolute before:inset-0 before:bg-gradient-to-br before:from-theme-accent/5 before:to-transparent before:pointer-events-none"
  );

  const getROEColor = (roe: number) => {
    if (roe >= 40) return "text-green-400";
    if (roe >= 25) return "text-[#CCFF00]";
    if (roe >= 15) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* Main Metrics Row */}
      <div className={cn(
        "grid gap-3",
        hasActionLinks ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
      )}>
        {/* Card 1: Cash to Start */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-theme-accent/20 rounded-lg">
              <DollarSign className="w-4 h-4 text-theme-accent" />
            </div>
            <span className="text-xs text-theme-text-muted uppercase tracking-wide">
              {t('cashToStart') || 'Cash to Start'}
            </span>
          </div>
          <p className="text-2xl font-bold text-theme-text font-mono mb-1">
            {formatCurrency(entryData.totalCash, currency, rate)}
          </p>
          <p className="text-xs text-theme-text-muted">
            Plan: <span className="text-theme-accent font-medium">{entryData.paymentPlan}</span>
          </p>
        </div>

        {/* Card 2: Rental Income */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-theme-text-muted uppercase tracking-wide">
              {t('rentalIncome') || 'Rental Income'}
            </span>
          </div>
          <p className="text-2xl font-bold text-theme-text font-mono mb-1">
            {formatCurrency(rentalData.monthlyRent, currency, rate)}<span className="text-sm text-theme-text-muted">/mo</span>
          </p>
          <p className="text-xs text-theme-text-muted">
            ROI: <span className="text-emerald-400 font-medium">{rentalData.yieldOnInvestment.toFixed(1)}%</span>
          </p>
        </div>

        {/* Card 3: Years to Breakeven */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-cyan-500/20 rounded-lg">
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs text-theme-text-muted uppercase tracking-wide">
              {t('yearsToBreakeven') || 'Breakeven'}
            </span>
          </div>
          <p className="text-2xl font-bold text-theme-text font-mono mb-1">
            {rentalData.yearsToBreakeven.toFixed(1)} <span className="text-sm text-theme-text-muted">{t('years') || 'years'}</span>
          </p>
          <p className="text-xs text-theme-text-muted">
            Net Yield: <span className="text-cyan-400 font-medium">{rentalData.netYield.toFixed(1)}%</span>
          </p>
        </div>

        {/* Card 4: Action Links (if available) */}
        {hasActionLinks && (
          <div className={cn(cardClass, "flex flex-col justify-center")}>
            <p className="text-xs text-theme-text-muted uppercase tracking-wide mb-3 relative z-10">
              {t('exploreMore') || 'Explore More'}
            </p>
            <div className="space-y-2 relative z-10">
              {developerId && onViewDeveloper && (
                <button 
                  onClick={onViewDeveloper}
                  className="flex items-center gap-2 w-full p-2 rounded-lg bg-theme-card-alt hover:bg-theme-accent/10 transition-colors text-left group"
                >
                  <Building className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-theme-text group-hover:text-emerald-400 transition-colors flex-1">
                    {t('viewDeveloper') || 'View Developer'}
                  </span>
                  <ChevronRight className="w-3 h-3 text-theme-text-muted" />
                </button>
              )}
              {projectId && onViewProject && (
                <button 
                  onClick={onViewProject}
                  className="flex items-center gap-2 w-full p-2 rounded-lg bg-theme-card-alt hover:bg-theme-accent/10 transition-colors text-left group"
                >
                  <Landmark className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-theme-text group-hover:text-cyan-400 transition-colors flex-1">
                    {t('viewProject') || 'View Project'}
                  </span>
                  <ChevronRight className="w-3 h-3 text-theme-text-muted" />
                </button>
              )}
              {floorPlanUrl && onViewFloorPlan && (
                <button 
                  onClick={onViewFloorPlan}
                  className="flex items-center gap-2 w-full p-2 rounded-lg bg-theme-card-alt hover:bg-theme-accent/10 transition-colors text-left group"
                >
                  <FileImage className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-theme-text group-hover:text-violet-400 transition-colors flex-1">
                    {t('viewFloorPlan') || 'View Floor Plan'}
                  </span>
                  <ChevronRight className="w-3 h-3 text-theme-text-muted" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Exit Scenarios Summary Row */}
      {exitData.length > 0 && (
        <div className="bg-theme-card border border-theme-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#CCFF00]" />
            <h3 className="text-sm font-medium text-theme-text uppercase tracking-wide">
              {t('exitScenarios') || 'Exit Scenarios'}
            </h3>
            <InfoTooltip translationKey="tooltipExitScenarios" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {exitData.map((exit, index) => (
              <div 
                key={index}
                className="bg-[#0d1117] border border-[#2a3142] rounded-lg p-3 hover:border-[#CCFF00]/30 transition-colors"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#CCFF00] font-semibold">
                    {t('exitNumber') || 'Exit'} {index + 1}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {exit.months}mo
                  </span>
                </div>
                
                {/* Date */}
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span className="text-sm text-white font-medium">{exit.date}</span>
                </div>
                
                {/* ROE - Hero metric */}
                <p className={cn("text-2xl font-bold font-mono mb-1", getROEColor(exit.roe))}>
                  {exit.roe.toFixed(0)}%
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">
                  {t('returnOnCash') || 'Return on Cash'}
                </p>
                
                {/* Profit */}
                <div className={cn(
                  "text-center p-2 rounded-lg",
                  exit.profit >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                  <p className={cn("text-sm font-bold font-mono", exit.profit >= 0 ? "text-green-400" : "text-red-400")}>
                    {exit.profit >= 0 ? '+' : ''}{formatCurrency(exit.profit, currency, rate)}
                  </p>
                </div>
                
                {/* Secondary metrics */}
                <div className="mt-2 pt-2 border-t border-[#2a3142] space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500">Cash In</span>
                    <span className="text-white font-mono">{formatCurrency(exit.equityDeployed, currency, rate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500">Exit Value</span>
                    <span className="text-[#CCFF00] font-mono">{formatCurrency(exit.exitPrice, currency, rate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
