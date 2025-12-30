import { OIInputs } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { TrendingUp, Calendar, Wallet, Target, Tag, Plus, Trash2, Pencil, Info } from "lucide-react";
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
  // Exit 3: Always 6 months before handover
  const exit3 = Math.max(12, totalMonths - 6);
  
  // Exit 1: ~50% of construction period (min 6 months)
  const exit1 = Math.max(6, Math.round(totalMonths * 0.50));
  
  // Exit 2: ~67% of construction period
  const exit2 = Math.max(exit1 + 3, Math.round(totalMonths * 0.67));
  
  // Ensure proper ordering and constraints
  return [
    Math.min(exit1, exit3 - 6),
    Math.min(Math.max(exit2, exit1 + 3), exit3 - 3),
    exit3
  ];
};

// Convert months to readable date using booking month/year
const monthsToDate = (months: number, bookingMonth: number, bookingYear: number, language: string): string => {
  const totalMonthsFromJan = bookingMonth + months;
  const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
  const month = ((totalMonthsFromJan - 1) % 12) + 1;
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthNames = language === 'es' ? monthNamesEs : monthNamesEn;
  return `${monthNames[month - 1]} ${bookingYear + yearOffset}`;
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
  
  // Use shared calculation function for all scenarios
  const scenarios = exitScenarios.map(months => 
    calculateExitScenario(months, basePrice, totalMonths, inputs, totalEntryCosts)
  );

  const handleAddExit = () => {
    if (exitScenarios.length >= 5 || !setExitScenarios || readOnly) return;
    // Add a new exit scenario between the last one and handover
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
      <div className="p-4 border-b border-[#2a3142] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#CCFF00]" />
          <div>
            <h3 className="font-semibold text-white">{t('exitScenarios')}</h3>
            <p className="text-xs text-gray-400">{scenarioCount} {scenarioLabel} • {t('clickToEdit')}</p>
          </div>
        </div>
        {!readOnly && exitScenarios.length < 5 && setExitScenarios && (
          <Button
            variant="outlineAccent"
            size="sm"
            onClick={handleAddExit}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('addExit')}
          </Button>
        )}
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario, index) => {
          const displayROE = scenario.exitCosts > 0 ? scenario.netROE : scenario.trueROE;
          const displayAnnualizedROE = scenario.exitCosts > 0 ? scenario.netAnnualizedROE : scenario.annualizedROE;
          const displayProfit = scenario.exitCosts > 0 ? scenario.netProfit : scenario.trueProfit;
          
          return (
            <div 
              key={index}
              className="rounded-xl border transition-all bg-[#0d1117] border-[#2a3142] hover:border-[#CCFF00]/30 overflow-hidden"
            >
              {/* Header */}
              <div className="p-3 bg-[#1a1f2e] border-b border-[#2a3142]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#CCFF00]">{t('exitNumber')}{index + 1}</span>
                    <span className="text-xs text-gray-500">• ~{Math.round((exitScenarios[index] / totalMonths) * 100)}% {t('construction')}</span>
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
                
                {/* Time Info */}
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-mono text-white">{exitScenarios[index]} {t('months')}</span>
                  <span className="text-xs text-gray-500">
                    ({monthsToDate(exitScenarios[index], inputs.bookingMonth, inputs.bookingYear, language)})
                  </span>
                </div>
              </div>

              {/* Edit Mode - Slider */}
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

              {/* KEY METRICS - Prominent Section */}
              <div className="p-4 bg-gradient-to-b from-[#CCFF00]/5 to-transparent">
                <div className="grid grid-cols-2 gap-3">
                  {/* Net Profit */}
                  <div className="text-center p-3 rounded-lg bg-[#1a1f2e] border border-[#2a3142]">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                      {scenario.exitCosts > 0 ? t('netProfit') : t('grossProfit')}
                    </p>
                    <p className={`text-lg font-bold font-mono ${displayProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {displayProfit >= 0 ? '+' : ''}{formatCurrency(displayProfit, currency, rate)}
                    </p>
                  </div>
                  
                  {/* ROE */}
                  <ROEBreakdownTooltip scenario={scenario} currency={currency} rate={rate}>
                    <div className="text-center p-3 rounded-lg bg-[#1a1f2e] border border-[#2a3142] cursor-help hover:border-[#CCFF00]/50 transition-colors">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center justify-center gap-1">
                        {t('roe')}
                        <Info className="w-2.5 h-2.5" />
                      </p>
                      <p className={`text-xl font-bold font-mono ${displayROE >= 0 ? 'text-[#CCFF00]' : 'text-red-400'}`}>
                        {displayROE.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {displayAnnualizedROE.toFixed(1)}% {t('annualized')}
                      </p>
                    </div>
                  </ROEBreakdownTooltip>
                </div>
              </div>

              {/* Details Section */}
              <div className="px-4 pb-4 space-y-1.5">
                {/* Original & Exit Price */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {t('original')}
                  </span>
                  <div className="text-right">
                    <span className="text-gray-400 font-mono">{formatCurrency(basePrice, currency, rate)}</span>
                    {unitSizeSqf && unitSizeSqf > 0 && (
                      <span className="text-gray-500 font-mono ml-1">
                        ({formatCurrency(basePrice / unitSizeSqf, currency, rate)}/sqft)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Wallet className="w-3 h-3" />
                    {t('payments')}
                  </span>
                  <span className="text-gray-300 font-mono">{formatCurrency(scenario.equityDeployed, currency, rate)}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-red-400/80 flex items-center gap-1">
                    {t('plusEntryCosts')}
                    <InfoTooltip translationKey="tooltipEntryCosts" />
                  </span>
                  <span className="text-red-400/80 font-mono">{formatCurrency(scenario.entryCosts, currency, rate)}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs border-t border-[#2a3142] pt-1.5">
                  <span className="text-gray-400 font-medium flex items-center gap-1">
                    {t('totalCapitalEquals')}
                    <InfoTooltip translationKey="tooltipTotalCapital" />
                  </span>
                  <span className="text-white font-mono font-medium">{formatCurrency(scenario.totalCapital, currency, rate)}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">{t('exitPrice')}</span>
                  <div className="text-right">
                    <span className="text-white font-mono">{formatCurrency(scenario.exitPrice, currency, rate)}</span>
                    {unitSizeSqf && unitSizeSqf > 0 && (
                      <span className="text-gray-500 font-mono ml-1">
                        ({formatCurrency(scenario.exitPrice / unitSizeSqf, currency, rate)}/sqft)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs border-t border-[#2a3142] pt-1.5">
                  <span className="text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {t('grossProfit')}
                  </span>
                  <span className={`font-mono ${scenario.trueProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrency(scenario.trueProfit, currency, rate)}
                  </span>
                </div>
                
                {/* Exit Costs Deductions */}
                {scenario.exitCosts > 0 && (
                  <>
                    {scenario.agentCommission > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-red-400/80">{t('agentCommission')}</span>
                        <span className="text-red-400/80 font-mono">-{formatCurrency(scenario.agentCommission, currency, rate)}</span>
                      </div>
                    )}
                    {scenario.nocFee > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-red-400/80">{t('nocFee')}</span>
                        <span className="text-red-400/80 font-mono">-{formatCurrency(scenario.nocFee, currency, rate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs border-t border-[#2a3142] pt-1.5">
                      <span className="text-gray-400 font-medium">{t('netProfit')}</span>
                      <span className={`font-mono font-medium ${scenario.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {scenario.netProfit >= 0 ? '+' : ''}{formatCurrency(scenario.netProfit, currency, rate)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
