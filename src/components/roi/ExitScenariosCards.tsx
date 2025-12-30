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
        {scenarios.map((scenario, index) => (
          <div 
            key={index}
            className="p-4 rounded-xl border transition-all bg-[#0d1117] border-[#2a3142] hover:border-[#CCFF00]/30"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-medium text-[#CCFF00]">{t('exitNumber')}{index + 1}</span>
                <p className="text-xs text-gray-500">~{Math.round((exitScenarios[index] / totalMonths) * 100)}% {t('construction')}</p>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-500 hover:text-[#CCFF00]"
                    onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {exitScenarios.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-500 hover:text-red-400"
                      onClick={() => handleRemoveExit(index)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Edit Mode - Slider */}
            {!readOnly && editingIndex === index && (
              <div className="mb-3 p-3 bg-[#1a1f2e] rounded-lg border border-[#CCFF00]/20">
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

            {/* Time Info */}
            <div className="mb-3 p-2 bg-[#1a1f2e] rounded-lg">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-lg font-bold font-mono">{exitScenarios[index]} {t('months')}</span>
              </div>
              <div className="text-xs text-gray-500 ml-6">
                {monthsToDate(exitScenarios[index], inputs.bookingMonth, inputs.bookingYear, language)}
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-2">
              {/* Original Price */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {t('original')}
                </span>
                <div className="text-right">
                  <span className="text-sm text-gray-400 font-mono">{formatCurrency(basePrice, currency, rate)}</span>
                  {unitSizeSqf && unitSizeSqf > 0 && (
                    <p className="text-[10px] text-gray-400 font-mono">
                      {formatCurrency(basePrice / unitSizeSqf, currency, rate)}/sqft
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  {t('payments')}
                </span>
                <span className="text-sm text-gray-300 font-mono">{formatCurrency(scenario.equityDeployed, currency, rate)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-red-400 flex items-center gap-1">
                  {t('plusEntryCosts')}
                  <InfoTooltip translationKey="tooltipEntryCosts" />
                </span>
                <span className="text-sm text-red-400 font-mono">{formatCurrency(scenario.entryCosts, currency, rate)}</span>
              </div>
              
              <div className="flex justify-between items-center border-t border-[#2a3142] pt-1">
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  {t('totalCapitalEquals')}
                  <InfoTooltip translationKey="tooltipTotalCapital" />
                </span>
                <span className="text-sm text-white font-mono font-medium">{formatCurrency(scenario.totalCapital, currency, rate)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{t('exitPrice')}</span>
                <div className="text-right">
                  <span className="text-sm text-white font-mono">{formatCurrency(scenario.exitPrice, currency, rate)}</span>
                  {unitSizeSqf && unitSizeSqf > 0 && (
                    <p className="text-[10px] text-gray-400 font-mono">
                      {formatCurrency(scenario.exitPrice / unitSizeSqf, currency, rate)}/sqft
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-[#2a3142]">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {t('grossProfit')}
                </span>
                <span className={`text-sm font-mono ${scenario.trueProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrency(scenario.trueProfit, currency, rate)}
                </span>
              </div>
              
              {/* Exit Costs Deductions */}
              {scenario.exitCosts > 0 && (
                <div className="space-y-1">
                  {scenario.agentCommission > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        {t('agentCommission')}
                      </span>
                      <span className="text-sm text-red-400 font-mono">-{formatCurrency(scenario.agentCommission, currency, rate)}</span>
                    </div>
                  )}
                  {scenario.nocFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        {t('nocFee')}
                      </span>
                      <span className="text-sm text-red-400 font-mono">-{formatCurrency(scenario.nocFee, currency, rate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-[#2a3142] pt-1">
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      {t('netProfit')}
                    </span>
                    <span className={`text-sm font-mono font-medium ${scenario.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {scenario.netProfit >= 0 ? '+' : ''}{formatCurrency(scenario.netProfit, currency, rate)}
                    </span>
                  </div>
                </div>
              )}
              
              <ROEBreakdownTooltip scenario={scenario} currency={currency} rate={rate}>
                <div className="flex justify-between items-center cursor-help hover:bg-[#1a1f2e] rounded px-1 -mx-1 transition-colors">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    {t('roe')}
                    <Info className="w-3 h-3" />
                  </span>
                  <span className={`text-lg font-bold font-mono ${(scenario.exitCosts > 0 ? scenario.netROE : scenario.trueROE) >= 0 ? 'text-[#CCFF00]' : 'text-red-400'}`}>
                    {(scenario.exitCosts > 0 ? scenario.netROE : scenario.trueROE).toFixed(1)}%
                  </span>
                </div>
              </ROEBreakdownTooltip>

              <div className="text-xs text-gray-500 pt-1">
                {(scenario.exitCosts > 0 ? scenario.netAnnualizedROE : scenario.annualizedROE).toFixed(1)}% {t('annualized')}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
