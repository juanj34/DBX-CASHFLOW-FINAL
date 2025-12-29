import { OIInputs } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { TrendingUp, Calendar, Wallet, Target, Tag, Plus, Trash2, Pencil, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { InfoTooltip } from "./InfoTooltip";
import { calculateEquityAtExitWithDetails, timelineToConstruction } from "./constructionProgress";

interface ExitScenario {
  months: number;
  exitPrice: number;
  amountPaid: number;
  entryCosts: number;
  profit: number;
  trueProfit: number;
  roe: number;
  trueROE: number;
  advanceRequired: number;
  isThresholdMet: boolean;
}

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

// Calculate equity deployed at exit using S-curve and threshold logic
export const calculateEquityAtExit = (
  exitMonths: number,
  inputs: OIInputs,
  totalMonths: number,
  basePrice: number
): number => {
  const result = calculateEquityAtExitWithDetails(exitMonths, inputs, totalMonths, basePrice);
  return result.finalEquity;
};

// Calculate exit price using phased appreciation (matching useOICalculations logic)
export const calculatePhasedExitPrice = (
  months: number,
  inputs: OIInputs,
  totalMonths: number,
  basePrice: number
): number => {
  const { 
    constructionAppreciation = 12, 
    growthAppreciation = 8, 
    matureAppreciation = 4, 
    growthPeriodYears = 5 
  } = inputs;
  
  let currentValue = basePrice;
  
  // Phase 1: Construction period (using constructionAppreciation)
  const constructionMonths = Math.min(months, totalMonths);
  if (constructionMonths > 0) {
    const monthlyConstructionRate = Math.pow(1 + constructionAppreciation / 100, 1/12) - 1;
    currentValue *= Math.pow(1 + monthlyConstructionRate, constructionMonths);
  }
  
  // If exit is during construction, return here
  if (months <= totalMonths) {
    return currentValue;
  }
  
  // Phase 2: Growth period (post-handover, first growthPeriodYears years)
  const postHandoverMonths = months - totalMonths;
  const growthMonths = Math.min(postHandoverMonths, growthPeriodYears * 12);
  if (growthMonths > 0) {
    const monthlyGrowthRate = Math.pow(1 + growthAppreciation / 100, 1/12) - 1;
    currentValue *= Math.pow(1 + monthlyGrowthRate, growthMonths);
  }
  
  // Phase 3: Mature period (after growthPeriodYears)
  const matureMonths = Math.max(0, postHandoverMonths - growthPeriodYears * 12);
  if (matureMonths > 0) {
    const monthlyMatureRate = Math.pow(1 + matureAppreciation / 100, 1/12) - 1;
    currentValue *= Math.pow(1 + monthlyMatureRate, matureMonths);
  }
  
  return currentValue;
};

const calculateScenario = (
  months: number,
  inputs: OIInputs,
  totalMonths: number,
  basePrice: number,
  totalEntryCosts: number
): ExitScenario => {
  // Use phased appreciation
  const exitPrice = calculatePhasedExitPrice(months, inputs, totalMonths, basePrice);
  
  // Use S-curve based equity calculation
  const equityResult = calculateEquityAtExitWithDetails(months, inputs, totalMonths, basePrice);
  const amountPaid = equityResult.finalEquity;
  
  const profit = exitPrice - basePrice;
  const trueProfit = profit - totalEntryCosts;
  const totalCapital = amountPaid + totalEntryCosts;
  const roe = amountPaid > 0 ? (profit / amountPaid) * 100 : 0;
  const trueROE = totalCapital > 0 ? (trueProfit / totalCapital) * 100 : 0;
  
  return {
    months,
    exitPrice,
    amountPaid,
    entryCosts: totalEntryCosts,
    profit,
    trueProfit,
    roe,
    trueROE,
    advanceRequired: equityResult.advanceRequired,
    isThresholdMet: equityResult.isThresholdMet,
  };
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
    calculateScenario(months, inputs, totalMonths, basePrice, totalEntryCosts)
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
                <span className="text-lg font-bold font-mono">{scenario.months} {t('months')}</span>
              </div>
              <div className="text-xs text-gray-500 ml-6">
                {monthsToDate(scenario.months, inputs.bookingMonth, inputs.bookingYear, language)}
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
                <span className="text-sm text-gray-300 font-mono">{formatCurrency(scenario.amountPaid, currency, rate)}</span>
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
                <span className="text-sm text-white font-mono font-medium">{formatCurrency(scenario.amountPaid + scenario.entryCosts, currency, rate)}</span>
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
                  {t('profit')}
                </span>
                <span className={`text-sm font-mono ${scenario.trueProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrency(scenario.trueProfit, currency, rate)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  {t('roe')}
                  <InfoTooltip translationKey="tooltipRoe" />
                </span>
                <span className={`text-lg font-bold font-mono ${scenario.trueROE >= 0 ? 'text-[#CCFF00]' : 'text-red-400'}`}>
                  {scenario.trueROE.toFixed(1)}%
                </span>
              </div>

              <div className="text-xs text-gray-500 pt-1">
                {(scenario.trueROE / (scenario.months / 12)).toFixed(1)}% {t('annualized')}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
