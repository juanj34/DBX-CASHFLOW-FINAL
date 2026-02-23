import { OIInputs } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { TrendingUp, Calendar, Wallet, Target, Tag, Plus, Trash2, Pencil, Info, Shield, Zap, Rocket, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { InfoTooltip } from "./InfoTooltip";
import { 
  calculateExitScenario, 
  calculateExitPrice, 
  ExitScenarioResult,
  monthToConstruction 
} from "./constructionProgress";
import { ROEBreakdownTooltip } from "./ROEBreakdownTooltip";
import { cn } from "@/lib/utils";

interface ExitScenariosCardsProps {
  inputs: OIInputs;
  currency: Currency;
  totalMonths: number;
  basePrice: number;
  totalEntryCosts: number;
  exitScenarios: number[];
  setExitScenarios?: (scenarios: number[]) => void;
  rate: number;
  readOnly?: boolean;
  unitSizeSqf?: number;
  highlightedIndex?: number | null;
  onCardHover?: (index: number | null) => void;
}

// Re-export for backwards compatibility
export const calculateEquityAtExit = (
  exitMonths: number,
  inputs: OIInputs,
  totalMonths: number,
  basePrice: number
): number => {
  const result = calculateExitScenario(exitMonths, basePrice, totalMonths, inputs, 0);
  return result.equityDeployed;
};

// Re-export for backwards compatibility
export const calculatePhasedExitPrice = (
  months: number,
  inputs: OIInputs,
  totalMonths: number,
  basePrice: number
): number => {
  return calculateExitPrice(months, basePrice, totalMonths, inputs);
};

// Auto-calculate exit scenarios based on project timeline
export const calculateAutoExitScenarios = (totalMonths: number): number[] => {
  const exit3 = Math.max(12, totalMonths - 6);
  const exit1 = Math.max(6, Math.round(totalMonths * 0.50));
  const exit2 = Math.max(exit1 + 3, Math.round(totalMonths * 0.67));
  return [
    Math.min(exit1, exit3 - 6),
    Math.min(Math.max(exit2, exit1 + 3), exit3 - 3),
    exit3
  ];
};

// Convert months to readable date - Returns date as primary with months secondary
const monthsToDate = (months: number, bookingMonth: number, bookingYear: number, language: string): { date: string; monthsLabel: string } => {
  const totalMonthsFromJan = bookingMonth + months;
  const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
  const month = ((totalMonthsFromJan - 1) % 12) + 1;
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthNames = language === 'es' ? monthNamesEs : monthNamesEn;
  return {
    date: `${monthNames[month - 1]} ${bookingYear + yearOffset}`,
    monthsLabel: `${months}mo`
  };
};

// Return Badge color helper - renamed from ROE for client-friendly terminology
const getReturnBadgeStyle = (returnPercent: number): { bg: string; text: string; label: string } => {
  if (returnPercent >= 40) return { bg: 'bg-theme-positive/20', text: 'text-theme-positive', label: 'excellentLabel' };
  if (returnPercent >= 25) return { bg: 'bg-theme-accent/20', text: 'text-theme-accent', label: 'goodLabel' };
  if (returnPercent >= 15) return { bg: 'bg-theme-accent/20', text: 'text-theme-accent', label: 'fairLabel' };
  return { bg: 'bg-theme-negative/20', text: 'text-theme-negative', label: 'lowLabel' };
};

// Get construction milestone label based on progress percentage
const getConstructionMilestone = (progressPercent: number): { icon: React.ReactNode; label: string; color: string } => {
  if (progressPercent <= 35) {
    return { icon: <Shield className="w-3 h-3" />, label: 'earlyStructureLabel', color: 'text-theme-text-muted bg-theme-text-muted/10' };
  }
  if (progressPercent <= 50) {
    return { icon: <Shield className="w-3 h-3" />, label: 'fiftyPercentCompleteLabel', color: 'text-theme-text-muted bg-theme-text-muted/10' };
  }
  if (progressPercent <= 65) {
    return { icon: <Zap className="w-3 h-3" />, label: 'structureCompleteLabel', color: 'text-theme-accent bg-theme-accent/10' };
  }
  if (progressPercent <= 85) {
    return { icon: <Zap className="w-3 h-3" />, label: 'toppingOutLabel', color: 'text-theme-accent bg-theme-accent/10' };
  }
  if (progressPercent < 100) {
    return { icon: <Rocket className="w-3 h-3" />, label: 'preHandoverLabel', color: 'text-theme-accent bg-theme-accent/10' };
  }
  return { icon: <Rocket className="w-3 h-3" />, label: 'handoverReadyLabel', color: 'text-theme-positive bg-theme-positive/10' };
};

// Get phase label for post-handover exits
const getPostHandoverPhase = (monthsAfterHandover: number, growthPeriodYears: number): { icon: React.ReactNode; label: string; color: string } => {
  const yearsAfter = monthsAfterHandover / 12;
  if (yearsAfter <= growthPeriodYears) {
    return {
      icon: <Rocket className="w-3 h-3" />,
      label: 'growthPhaseLabel',
      color: 'text-theme-positive bg-theme-positive/10'
    };
  }
  return {
    icon: <Shield className="w-3 h-3" />,
    label: 'maturePhaseLabel',
    color: 'text-theme-text-muted bg-theme-text-muted/10'
  };
};

// Format post-handover offset nicely
const formatPostHandoverOffset = (monthsAfterHandover: number): string => {
  if (monthsAfterHandover >= 12 && monthsAfterHandover % 12 === 0) {
    return `+${monthsAfterHandover / 12}yr`;
  }
  return `+${monthsAfterHandover}mo`;
};

export const ExitScenariosCards = ({ 
  inputs, 
  currency, 
  totalMonths, 
  basePrice, 
  totalEntryCosts,
  exitScenarios,
  setExitScenarios,
  rate,
  readOnly = false,
  unitSizeSqf,
  highlightedIndex,
  onCardHover,
}: ExitScenariosCardsProps) => {
  const { t, language } = useLanguage();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  
  const scenarios = exitScenarios.map(months => 
    calculateExitScenario(months, basePrice, totalMonths, inputs, totalEntryCosts)
  );

  const toggleCardExpansion = (index: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Max exit month includes 5 years post-handover
  const maxExitMonth = totalMonths + 60;

  const handleAddExit = () => {
    if (exitScenarios.length >= 5 || !setExitScenarios || readOnly) return;
    const lastExit = exitScenarios[exitScenarios.length - 1] || Math.round(totalMonths * 0.5);
    const newExit = Math.min(lastExit + 6, maxExitMonth - 3);
    setExitScenarios([...exitScenarios, newExit]);
  };

  const handleRemoveExit = (index: number) => {
    if (exitScenarios.length <= 1 || !setExitScenarios || readOnly) return;
    setExitScenarios(exitScenarios.filter((_, i) => i !== index));
  };

  const handleUpdateExitMonths = (index: number, months: number) => {
    if (!setExitScenarios || readOnly) return;
    const newScenarios = [...exitScenarios];
    newScenarios[index] = months;
    setExitScenarios(newScenarios);
  };

  const scenarioCount = exitScenarios.length;
  const scenarioLabel = scenarioCount === 1 ? t('scenario') : t('scenarios');

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden">
      {/* Header with Static Info */}
      <div className="p-4 border-b border-theme-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-theme-accent" />
            <div>
              <h3 className="text-sm font-medium uppercase tracking-wider text-theme-text-muted">{t('exitStrategyLabel')}</h3>
              <p className="text-xs text-theme-text-muted">{scenarioCount} {scenarioLabel} • {t('clickToEdit')}</p>
            </div>
          </div>
          {!readOnly && exitScenarios.length < 5 && setExitScenarios && (
            <Button variant="outlineAccent" size="sm" onClick={handleAddExit}>
              <Plus className="w-4 h-4 mr-1" />
              {t('addExit')}
            </Button>
          )}
        </div>
        
        {/* Static Investment Summary - Moved from cards */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-theme-bg rounded-lg border border-theme-border">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-theme-text-muted">{t('contractPriceLabel')}</p>
            <p className="text-sm font-mono text-theme-text">{formatCurrency(basePrice, currency, rate)}</p>
            {unitSizeSqf && unitSizeSqf > 0 && (
              <p className="text-[10px] text-theme-text-muted font-mono">{formatCurrency(basePrice / unitSizeSqf, currency, rate)}/sqft</p>
            )}
          </div>
          <div className="text-center border-x border-theme-border">
            <p className="text-[10px] uppercase tracking-wider text-theme-text-muted">{t('entryCostsLabel')}</p>
            <p className="text-sm font-mono text-theme-negative">{formatCurrency(totalEntryCosts, currency, rate)}</p>
            <p className="text-[10px] text-theme-text-muted">{t('dldFeesShortLabel')}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-theme-text-muted">{t('timelineLabel')}</p>
            <p className="text-sm font-mono text-theme-text">{totalMonths} {t('months')}</p>
            <p className="text-[10px] text-theme-text-muted">{t('toHandoverLabel')}</p>
          </div>
        </div>
      </div>

      {/* Exit Scenario Cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario, index) => {
          const displayReturn = scenario.exitCosts > 0 ? scenario.netROE : scenario.trueROE;
          const displayAnnualizedReturn = scenario.exitCosts > 0 ? scenario.netAnnualizedROE : scenario.annualizedROE;
          const displayProfit = scenario.exitCosts > 0 ? scenario.netProfit : scenario.trueProfit;
          
          // Determine if post-handover and calculate phase
          const exitMonth = exitScenarios[index];
          const isPostHandover = exitMonth > totalMonths;
          const monthsAfterHandover = isPostHandover ? exitMonth - totalMonths : 0;
          
          // Use S-curve to calculate actual construction progress (not linear timeline)
          const constructionProgress = monthToConstruction(exitMonth, totalMonths);
          const progressPercent = Math.round(constructionProgress);
          const returnBadge = getReturnBadgeStyle(displayReturn);
          
          // Get phase or milestone based on timing
          const phaseOrMilestone = isPostHandover 
            ? getPostHandoverPhase(monthsAfterHandover, inputs.growthPeriodYears || 5)
            : getConstructionMilestone(progressPercent);
          
          const dateInfo = monthsToDate(exitMonth, inputs.bookingMonth, inputs.bookingYear, language);
          const isHighlighted = highlightedIndex === index;
          const isExpanded = expandedCards.has(index);
          
          return (
            <div 
              key={index}
              className={cn(
                "rounded-xl border transition-all bg-theme-bg overflow-hidden",
                isHighlighted 
                  ? "border-theme-accent shadow-lg scale-[1.02]" 
                  : isPostHandover
                    ? "border-theme-positive/30 hover:border-theme-positive/50"
                    : "border-theme-border hover:border-theme-accent/30"
              )}
              onMouseEnter={() => onCardHover?.(index)}
              onMouseLeave={() => onCardHover?.(null)}
            >
              {/* Card Header - Redesigned with milestone/phase and date primary */}
              <div className="p-3 bg-theme-card border-b border-theme-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-theme-accent">{t('exitNumber')}{index + 1}</span>
                    {/* Phase/Milestone Tag */}
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${phaseOrMilestone.color}`}>
                      {phaseOrMilestone.icon}
                      {t(phaseOrMilestone.label)}
                    </span>
                    {/* Post-handover offset badge */}
                    {isPostHandover && (
                      <span className="text-[10px] font-mono text-theme-positive bg-theme-positive/10 px-1.5 py-0.5 rounded">
                        {formatPostHandoverOffset(monthsAfterHandover)}
                      </span>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-theme-text-muted hover:text-theme-accent"
                        onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      {exitScenarios.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-theme-text-muted hover:text-theme-negative"
                          onClick={() => handleRemoveExit(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Timeline Info - Date primary, months secondary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-theme-accent" />
                    <span className="text-sm font-semibold text-theme-text">{dateInfo.date}</span>
                    <span className="text-xs text-theme-text-muted font-mono">· {dateInfo.monthsLabel}</span>
                  </div>
                  {isPostHandover ? (
                    <span className="text-[10px] text-theme-positive bg-theme-positive/10 px-1.5 py-0.5 rounded">
                      {t('postHandoverBadgeLabel')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-theme-text-muted bg-theme-bg px-1.5 py-0.5 rounded">
                      {progressPercent}% {t('percentBuiltSuffix')}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Slider - Extended for post-handover */}
              {!readOnly && editingIndex === index && (
                <div className="p-3 bg-theme-card/50 border-b border-theme-accent/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-theme-text-muted">{t('exitAfter')}</span>
                    <span className="text-sm font-bold text-theme-accent">
                      {isPostHandover 
                        ? formatPostHandoverOffset(monthsAfterHandover)
                        : `${exitMonth} ${t('months')}`
                      }
                    </span>
                  </div>
                  <Slider
                    value={[exitMonth]}
                    onValueChange={([v]) => handleUpdateExitMonths(index, v)}
                    min={6}
                    max={maxExitMonth}
                    step={1}
                    className="roi-slider-lime"
                  />
                  <div className="flex justify-between text-xs text-theme-text-muted mt-1">
                    <span>6{t('mo')}</span>
                    <span className="text-theme-accent">{t('handover')} ({totalMonths}{t('mo')})</span>
                    <span className="text-theme-positive">+5yr</span>
                  </div>
                </div>
              )}

              {/* REDESIGNED HERO SECTION - Clear hierarchy */}
              <div className="p-4">
                {/* PRIMARY: Return % - Largest, most prominent */}
                <ROEBreakdownTooltip scenario={scenario} currency={currency} rate={rate}>
                  <div className="text-center mb-4 cursor-help">
                    <p className={`text-4xl font-bold font-mono ${returnBadge.text}`}>
                      {displayReturn.toFixed(0)}%
                    </p>
                    <p className="text-sm text-theme-text-muted mt-1">
                      {t('returnOnCashInvestedLabel')}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${returnBadge.bg} ${returnBadge.text}`}>
                        {t(returnBadge.label)}
                      </span>
                      <span className="text-xs text-theme-text-muted">·</span>
                      <span className="text-xs text-theme-accent font-mono">{displayAnnualizedReturn.toFixed(1)}%{t('perYearSuffix')}</span>
                    </div>
                  </div>
                </ROEBreakdownTooltip>

                {/* SECONDARY: Profit Display - Hero Number */}
                <div className={`text-center p-4 rounded-lg border ${displayProfit >= 0 ? 'bg-theme-positive/10 border-theme-positive/20' : 'bg-theme-negative/10 border-theme-negative/20'}`}>
                  <p className="text-[10px] uppercase tracking-wider text-theme-text-muted mb-1">
                    {t('profitToPocketLabel')} {scenario.exitCosts > 0 ? t('profitToPocketNetLabel') : ''}
                  </p>
                  <p className={`text-2xl font-bold font-mono ${displayProfit >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                    {displayProfit >= 0 ? '+' : ''}{formatCurrency(displayProfit, currency, rate)}
                  </p>
                </div>

                {/* TERTIARY: Cash Invested → Exit Value (The missing context) */}
                <div className="mt-4 p-3 bg-theme-card/50 rounded-lg space-y-2">
                  {/* Cash at Exit */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5 text-theme-text-muted" />
                      <span className="text-xs text-theme-text-muted">{t('cashAtExitLabel')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono text-theme-text font-medium">
                        {formatCurrency(scenario.equityDeployed, currency, rate)}
                      </span>
                    </div>
                  </div>
                  {/* Entry Costs (small subtext) */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-theme-text-muted pl-5">{t('plusEntryCostsLabel')}</span>
                    <span className="text-theme-text-muted font-mono">
                      {formatCurrency(scenario.totalCapital - scenario.equityDeployed, currency, rate)}
                    </span>
                  </div>
                  
                  {/* Exit Value */}
                  <div className="flex items-center justify-between pt-2 border-t border-theme-border">
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-theme-accent" />
                      <span className="text-xs text-theme-text-muted">{t('exitValueLabel')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono text-theme-accent font-medium">
                        {formatCurrency(scenario.exitPrice, currency, rate)}
                      </span>
                    </div>
                  </div>
                  {/* Base Price (small subtext) */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-theme-text-muted pl-5">{t('basePriceLabel')}</span>
                    <span className="text-theme-text-muted font-mono">
                      {formatCurrency(basePrice, currency, rate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Breakdown Toggle */}
              <button
                onClick={() => toggleCardExpansion(index)}
                className="w-full px-4 py-2 flex items-center justify-center gap-1 text-xs text-theme-text-muted hover:text-theme-text transition-colors border-t border-theme-border bg-theme-bg"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    {t('hideBreakdownLabel')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    {t('viewBreakdownLabel')}
                  </>
                )}
              </button>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 space-y-1 border-t border-theme-border bg-theme-bg/50 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-theme-text-muted">{t('cashDeployedLabel')}</span>
                    <span className="text-theme-text font-mono">{formatCurrency(scenario.equityDeployed, currency, rate)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-theme-text-muted">{t('totalInvestedLabel')}</span>
                    <span className="text-theme-text font-mono font-medium">{formatCurrency(scenario.totalCapital, currency, rate)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs border-t border-theme-border pt-1">
                    <span className="text-theme-text-muted">{t('exitPriceLabel')}</span>
                    <div className="text-right">
                      <span className="text-theme-text font-mono">{formatCurrency(scenario.exitPrice, currency, rate)}</span>
                      {unitSizeSqf && unitSizeSqf > 0 && (
                        <span className="text-theme-text-muted font-mono text-[10px] ml-1">
                          ({formatCurrency(scenario.exitPrice / unitSizeSqf, currency, rate)}/sqft)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Exit Costs if applicable */}
                  {scenario.exitCosts > 0 && (
                    <div className="pt-1 border-t border-theme-border space-y-0.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-theme-text-muted">{t('grossProfitLabel')}</span>
                        <span className="text-theme-positive/70 font-mono">+{formatCurrency(scenario.trueProfit, currency, rate)}</span>
                      </div>
                      {scenario.agentCommission > 0 && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-theme-negative/60">{t('agentCommissionLabel')}</span>
                          <span className="text-theme-negative/60 font-mono">-{formatCurrency(scenario.agentCommission, currency, rate)}</span>
                        </div>
                      )}
                      {scenario.nocFee > 0 && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-theme-negative/60">{t('nocFeeLabel')}</span>
                          <span className="text-theme-negative/60 font-mono">-{formatCurrency(scenario.nocFee, currency, rate)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
