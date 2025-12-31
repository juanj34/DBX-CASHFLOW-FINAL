import { OIInputs } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { TrendingUp, Calendar, Wallet, Target, Tag, Plus, Trash2, Pencil, Info, Shield, Zap, Rocket, ChevronDown, ChevronUp, ArrowRight, Key } from "lucide-react";
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
  if (returnPercent >= 40) return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Excellent' };
  if (returnPercent >= 25) return { bg: 'bg-[#CCFF00]/20', text: 'text-[#CCFF00]', label: 'Good' };
  if (returnPercent >= 15) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Fair' };
  return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Low' };
};

// Get construction milestone label based on progress percentage
const getConstructionMilestone = (progressPercent: number): { icon: React.ReactNode; label: string; color: string } => {
  if (progressPercent <= 35) {
    return { icon: <Shield className="w-3 h-3" />, label: 'Early Structure', color: 'text-blue-400 bg-blue-400/10' };
  }
  if (progressPercent <= 50) {
    return { icon: <Shield className="w-3 h-3" />, label: '50% Complete', color: 'text-blue-400 bg-blue-400/10' };
  }
  if (progressPercent <= 65) {
    return { icon: <Zap className="w-3 h-3" />, label: 'Structure Complete', color: 'text-[#CCFF00] bg-[#CCFF00]/10' };
  }
  if (progressPercent <= 85) {
    return { icon: <Zap className="w-3 h-3" />, label: 'Topping Out', color: 'text-[#CCFF00] bg-[#CCFF00]/10' };
  }
  if (progressPercent < 100) {
    return { icon: <Rocket className="w-3 h-3" />, label: 'Pre-Handover', color: 'text-orange-400 bg-orange-400/10' };
  }
  return { icon: <Rocket className="w-3 h-3" />, label: 'Handover Ready', color: 'text-green-400 bg-green-400/10' };
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

  const handleAddExit = () => {
    if (exitScenarios.length >= 5 || !setExitScenarios || readOnly) return;
    const lastExit = exitScenarios[exitScenarios.length - 1] || Math.round(totalMonths * 0.5);
    const newExit = Math.min(lastExit + 6, totalMonths - 3);
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
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden">
      {/* Header with Static Info */}
      <div className="p-4 border-b border-[#2a3142]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#CCFF00]" />
            <div>
              <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">Exit Strategy</h3>
              <p className="text-xs text-gray-500">{scenarioCount} {scenarioLabel} • {t('clickToEdit')}</p>
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
        <div className="grid grid-cols-3 gap-3 p-3 bg-[#0d1117] rounded-lg border border-[#2a3142]">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Contract Price</p>
            <p className="text-sm font-mono text-white">{formatCurrency(basePrice, currency, rate)}</p>
            {unitSizeSqf && unitSizeSqf > 0 && (
              <p className="text-[10px] text-gray-500 font-mono">{formatCurrency(basePrice / unitSizeSqf, currency, rate)}/sqft</p>
            )}
          </div>
          <div className="text-center border-x border-[#2a3142]">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Entry Costs</p>
            <p className="text-sm font-mono text-red-400">{formatCurrency(totalEntryCosts, currency, rate)}</p>
            <p className="text-[10px] text-gray-500">DLD + Fees</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Timeline</p>
            <p className="text-sm font-mono text-white">{totalMonths} months</p>
            <p className="text-[10px] text-gray-500">to handover</p>
          </div>
        </div>
      </div>

      {/* Exit Scenario Cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario, index) => {
          const displayReturn = scenario.exitCosts > 0 ? scenario.netROE : scenario.trueROE;
          const displayAnnualizedReturn = scenario.exitCosts > 0 ? scenario.netAnnualizedROE : scenario.annualizedROE;
          const displayProfit = scenario.exitCosts > 0 ? scenario.netProfit : scenario.trueProfit;
          // Use S-curve to calculate actual construction progress (not linear timeline)
          const constructionProgress = monthToConstruction(exitScenarios[index], totalMonths);
          const progressPercent = Math.round(constructionProgress);
          const returnBadge = getReturnBadgeStyle(displayReturn);
          const milestone = getConstructionMilestone(progressPercent);
          const dateInfo = monthsToDate(exitScenarios[index], inputs.bookingMonth, inputs.bookingYear, language);
          const isHighlighted = highlightedIndex === index;
          const isExpanded = expandedCards.has(index);
          
          return (
            <div 
              key={index}
              className={cn(
                "rounded-xl border transition-all bg-[#0d1117] overflow-hidden",
                isHighlighted 
                  ? "border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.3)] scale-[1.02]" 
                  : "border-[#2a3142] hover:border-[#CCFF00]/30"
              )}
              onMouseEnter={() => onCardHover?.(index)}
              onMouseLeave={() => onCardHover?.(null)}
            >
              {/* Card Header - Redesigned with milestone and date primary */}
              <div className="p-3 bg-[#1a1f2e] border-b border-[#2a3142]">
                <div className="flex items-center justify-between mb-2">
                  {(() => {
                    // Calculate if NOC threshold is met (can resell)
                    const thresholdPercent = inputs.minimumExitThreshold || 40;
                    const thresholdAmount = basePrice * (thresholdPercent / 100);
                    const canResell = scenario.equityDeployed >= thresholdAmount;
                    
                    return (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#CCFF00]">{t('exitNumber')}{index + 1}</span>
                        {/* Construction Milestone Tag */}
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${milestone.color}`}>
                          {milestone.icon}
                          {milestone.label}
                        </span>
                        {/* NOC Ready Badge */}
                        {canResell && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Key className="w-2.5 h-2.5" />
                            NOC Ready
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  {!readOnly && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-[#CCFF00]"
                        onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      {exitScenarios.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-500 hover:text-red-400"
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
                    <Calendar className="w-3.5 h-3.5 text-[#CCFF00]" />
                    <span className="text-sm font-semibold text-white">{dateInfo.date}</span>
                    <span className="text-xs text-gray-500 font-mono">· {dateInfo.monthsLabel}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 bg-[#0d1117] px-1.5 py-0.5 rounded">
                    {progressPercent}% built
                  </span>
                </div>
              </div>

              {/* Edit Slider */}
              {!readOnly && editingIndex === index && (
                <div className="p-3 bg-[#1a1f2e]/50 border-b border-[#CCFF00]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{t('exitAfter')}</span>
                    <span className="text-sm font-bold text-[#CCFF00]">{exitScenarios[index]} {t('months')}</span>
                  </div>
                  <Slider
                    value={[exitScenarios[index]]}
                    onValueChange={([v]) => handleUpdateExitMonths(index, v)}
                    min={6}
                    max={totalMonths - 1}
                    step={1}
                    className="roi-slider-lime"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>6{t('mo')}</span>
                    <span>{totalMonths - 1}{t('mo')}</span>
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
                    <p className="text-sm text-gray-400 mt-1">
                      Return on Cash Invested
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${returnBadge.bg} ${returnBadge.text}`}>
                        {returnBadge.label}
                      </span>
                      <span className="text-xs text-gray-500">·</span>
                      <span className="text-xs text-[#CCFF00] font-mono">{displayAnnualizedReturn.toFixed(1)}%/year</span>
                    </div>
                  </div>
                </ROEBreakdownTooltip>

                {/* SECONDARY: Profit Display - Hero Number */}
                <div className={`text-center p-4 rounded-lg border ${displayProfit >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                    Profit to Pocket {scenario.exitCosts > 0 ? '(Net)' : ''}
                  </p>
                  <p className={`text-2xl font-bold font-mono ${displayProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {displayProfit >= 0 ? '+' : ''}{formatCurrency(displayProfit, currency, rate)}
                  </p>
                </div>

                {/* TERTIARY: Cash Invested → Exit Value (The missing context) */}
                <div className="mt-4 p-3 bg-[#1a1f2e]/50 rounded-lg space-y-2">
                  {/* Cash at Exit */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-400">Cash at Exit</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono text-white font-medium">
                        {formatCurrency(scenario.equityDeployed, currency, rate)}
                      </span>
                    </div>
                  </div>
                  {/* Entry Costs (small subtext) */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 pl-5">+ Entry Costs</span>
                    <span className="text-gray-500 font-mono">
                      {formatCurrency(scenario.totalCapital - scenario.equityDeployed, currency, rate)}
                    </span>
                  </div>
                  
                  {/* Exit Value */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#2a3142]">
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-[#CCFF00]" />
                      <span className="text-xs text-gray-400">Exit Value</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono text-[#CCFF00] font-medium">
                        {formatCurrency(scenario.exitPrice, currency, rate)}
                      </span>
                    </div>
                  </div>
                  {/* Base Price (small subtext) */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 pl-5">Base Price</span>
                    <span className="text-gray-500 font-mono">
                      {formatCurrency(basePrice, currency, rate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Breakdown Toggle */}
              <button
                onClick={() => toggleCardExpansion(index)}
                className="w-full px-4 py-2 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors border-t border-[#2a3142] bg-[#0d1117]"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide Breakdown
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    View Breakdown
                  </>
                )}
              </button>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 space-y-1 border-t border-[#2a3142] bg-[#0d1117]/50 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Cash Deployed</span>
                    <span className="text-gray-300 font-mono">{formatCurrency(scenario.equityDeployed, currency, rate)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Total Invested</span>
                    <span className="text-white font-mono font-medium">{formatCurrency(scenario.totalCapital, currency, rate)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs border-t border-[#2a3142] pt-1">
                    <span className="text-gray-500">Exit Price</span>
                    <div className="text-right">
                      <span className="text-white font-mono">{formatCurrency(scenario.exitPrice, currency, rate)}</span>
                      {unitSizeSqf && unitSizeSqf > 0 && (
                        <span className="text-gray-500 font-mono text-[10px] ml-1">
                          ({formatCurrency(scenario.exitPrice / unitSizeSqf, currency, rate)}/sqft)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Exit Costs if applicable */}
                  {scenario.exitCosts > 0 && (
                    <div className="pt-1 border-t border-[#2a3142] space-y-0.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Gross Profit</span>
                        <span className="text-green-400/70 font-mono">+{formatCurrency(scenario.trueProfit, currency, rate)}</span>
                      </div>
                      {scenario.agentCommission > 0 && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-red-400/60">Agent (2%)</span>
                          <span className="text-red-400/60 font-mono">-{formatCurrency(scenario.agentCommission, currency, rate)}</span>
                        </div>
                      )}
                      {scenario.nocFee > 0 && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-red-400/60">NOC Fee</span>
                          <span className="text-red-400/60 font-mono">-{formatCurrency(scenario.nocFee, currency, rate)}</span>
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
