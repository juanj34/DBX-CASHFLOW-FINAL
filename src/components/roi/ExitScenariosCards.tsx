import { OIInputs } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { TrendingUp, Calendar, Wallet, Target, Tag, Plus, Trash2, Pencil, Info, Shield, Zap, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { InfoTooltip } from "./InfoTooltip";
import { 
  calculateExitScenario, 
  calculateExitPrice, 
  ExitScenarioResult 
} from "./constructionProgress";
import { ROEBreakdownTooltip } from "./ROEBreakdownTooltip";

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

// Convert months to readable date
const monthsToDate = (months: number, bookingMonth: number, bookingYear: number, language: string): string => {
  const totalMonthsFromJan = bookingMonth + months;
  const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
  const month = ((totalMonthsFromJan - 1) % 12) + 1;
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthNames = language === 'es' ? monthNamesEs : monthNamesEn;
  return `${monthNames[month - 1]} ${bookingYear + yearOffset}`;
};

// ROE Badge color helper
const getROEBadgeStyle = (roe: number): { bg: string; text: string; label: string } => {
  if (roe >= 40) return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Excellent' };
  if (roe >= 25) return { bg: 'bg-[#CCFF00]/20', text: 'text-[#CCFF00]', label: 'Good' };
  if (roe >= 15) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Fair' };
  return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Low' };
};

// Scenario confidence tag
const getScenarioTag = (index: number, total: number, progressPercent: number): { icon: React.ReactNode; label: string; color: string } => {
  if (progressPercent <= 50) {
    return { icon: <Shield className="w-3 h-3" />, label: 'Conservative', color: 'text-blue-400 bg-blue-400/10' };
  }
  if (progressPercent <= 75) {
    return { icon: <Zap className="w-3 h-3" />, label: 'Base Case', color: 'text-[#CCFF00] bg-[#CCFF00]/10' };
  }
  return { icon: <Rocket className="w-3 h-3" />, label: 'Aggressive', color: 'text-orange-400 bg-orange-400/10' };
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
}: ExitScenariosCardsProps) => {
  const { t, language } = useLanguage();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const scenarios = exitScenarios.map(months => 
    calculateExitScenario(months, basePrice, totalMonths, inputs, totalEntryCosts)
  );

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
              <h3 className="font-semibold text-white">{t('exitScenarios')}</h3>
              <p className="text-xs text-gray-400">{scenarioCount} {scenarioLabel} • {t('clickToEdit')}</p>
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
          const displayROE = scenario.exitCosts > 0 ? scenario.netROE : scenario.trueROE;
          const displayAnnualizedROE = scenario.exitCosts > 0 ? scenario.netAnnualizedROE : scenario.annualizedROE;
          const displayProfit = scenario.exitCosts > 0 ? scenario.netProfit : scenario.trueProfit;
          const progressPercent = Math.round((exitScenarios[index] / totalMonths) * 100);
          const roeBadge = getROEBadgeStyle(displayROE);
          const scenarioTag = getScenarioTag(index, exitScenarios.length, progressPercent);
          
          return (
            <div 
              key={index}
              className="rounded-xl border transition-all bg-[#0d1117] border-[#2a3142] hover:border-[#CCFF00]/30 overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-3 bg-[#1a1f2e] border-b border-[#2a3142]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#CCFF00]">{t('exitNumber')}{index + 1}</span>
                    {/* Scenario Confidence Tag */}
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${scenarioTag.color}`}>
                      {scenarioTag.icon}
                      {scenarioTag.label}
                    </span>
                  </div>
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
                
                {/* Timeline Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm font-mono text-white">{exitScenarios[index]} months</span>
                    <span className="text-xs text-gray-500">
                      ({monthsToDate(exitScenarios[index], inputs.bookingMonth, inputs.bookingYear, language)})
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 bg-[#0d1117] px-1.5 py-0.5 rounded">
                    Milestone: {progressPercent}%
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

              {/* KEY METRICS - Hero Section */}
              <div className="p-4">
                {/* ROE with Badge */}
                <ROEBreakdownTooltip scenario={scenario} currency={currency} rate={rate}>
                  <div className="text-center mb-4 cursor-help">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${roeBadge.bg} ${roeBadge.text}`}>
                        {roeBadge.label}
                      </span>
                      <Info className="w-3 h-3 text-gray-500" />
                    </div>
                    <p className={`text-3xl font-bold font-mono ${roeBadge.text}`}>
                      {displayROE.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ROE <span className="text-gray-500">•</span> <span className="text-[#CCFF00]">{displayAnnualizedROE.toFixed(1)}% IRR</span>
                    </p>
                  </div>
                </ROEBreakdownTooltip>

                {/* Profit Display */}
                <div className={`text-center p-3 rounded-lg border ${displayProfit >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                    {scenario.exitCosts > 0 ? 'Net Profit' : 'Gross Profit'}
                  </p>
                  <p className={`text-xl font-bold font-mono ${displayProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {displayProfit >= 0 ? '+' : ''}{formatCurrency(displayProfit, currency, rate)}
                  </p>
                </div>
              </div>

              {/* Compact Details */}
              <div className="px-4 pb-4 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Cash Deployed</span>
                  <span className="text-gray-300 font-mono">{formatCurrency(scenario.equityDeployed, currency, rate)}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Total Capital</span>
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
