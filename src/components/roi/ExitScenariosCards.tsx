import { useState } from "react";
import { OIInputs } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, Calendar, Wallet, Target, Edit2, Tag } from "lucide-react";

interface ExitScenario {
  months: number;
  exitPrice: number;
  amountPaid: number;
  entryCosts: number;
  profit: number;
  trueProfit: number;
  roe: number;
  trueROE: number;
}

interface ExitScenariosCardsProps {
  inputs: OIInputs;
  currency: Currency;
  totalMonths: number;
  basePrice: number;
  totalEntryCosts: number;
  exitScenarios: [number, number, number]; // 3 month values
  onExitScenariosChange: (scenarios: [number, number, number]) => void;
  rate: number;
}

// Calculate equity deployed at exit
const calculateEquityAtExit = (
  exitMonths: number,
  inputs: OIInputs,
  totalMonths: number,
  basePrice: number
): number => {
  let equity = 0;
  
  // Downpayment - always paid
  equity += basePrice * inputs.downpaymentPercent / 100;
  
  // Additional payments
  inputs.additionalPayments.forEach(m => {
    let triggered = false;
    
    if (m.type === 'time') {
      triggered = m.triggerValue <= exitMonths;
    } else {
      // Construction-based: assume linear construction
      const exitPercent = (exitMonths / totalMonths) * 100;
      triggered = m.triggerValue <= exitPercent;
    }
    
    if (triggered && m.paymentPercent > 0) {
      equity += basePrice * m.paymentPercent / 100;
    }
  });
  
  // Handover payment - only if at or after handover
  if (exitMonths >= totalMonths) {
    const handoverPercent = 100 - inputs.preHandoverPercent;
    equity += basePrice * handoverPercent / 100;
  }
  
  return equity;
};

const calculateScenario = (
  months: number,
  inputs: OIInputs,
  totalMonths: number,
  basePrice: number,
  totalEntryCosts: number
): ExitScenario => {
  const exitYears = months / 12;
  const exitPrice = basePrice * Math.pow(1 + inputs.appreciationRate / 100, exitYears);
  const amountPaid = calculateEquityAtExit(months, inputs, totalMonths, basePrice);
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
  };
};

// Convert months to readable date using booking month/year
const monthsToDate = (months: number, bookingMonth: number, bookingYear: number): string => {
  const totalMonthsFromJan = bookingMonth + months;
  const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
  const month = ((totalMonthsFromJan - 1) % 12) + 1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]} ${bookingYear + yearOffset}`;
};

export const ExitScenariosCards = ({ 
  inputs, 
  currency, 
  totalMonths, 
  basePrice, 
  totalEntryCosts,
  exitScenarios,
  onExitScenariosChange,
  rate,
}: ExitScenariosCardsProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const scenarios = exitScenarios.map(months => 
    calculateScenario(months, inputs, totalMonths, basePrice, totalEntryCosts)
  );

  const updateScenario = (index: number, months: number) => {
    const newScenarios = [...exitScenarios] as [number, number, number];
    newScenarios[index] = months;
    onExitScenariosChange(newScenarios);
  };

  const labels = ['Exit #1', 'Exit #2', 'Exit #3'];
  const descriptions = [
    'Early exit opportunity',
    'Mid-construction exit',
    'Near handover exit'
  ];

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#2a3142] flex items-center gap-2">
        <Target className="w-5 h-5 text-[#CCFF00]" />
        <div>
          <h3 className="font-semibold text-white">Exit Scenarios</h3>
          <p className="text-xs text-gray-400">Compare your exit options (click to adjust)</p>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((scenario, index) => (
          <div 
            key={index}
            className={`p-4 rounded-xl border transition-all ${
              editingIndex === index 
                ? 'bg-[#CCFF00]/10 border-[#CCFF00]/50' 
                : 'bg-[#0d1117] border-[#2a3142] hover:border-[#CCFF00]/30'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-medium text-[#CCFF00]">{labels[index]}</span>
                <p className="text-xs text-gray-500">{descriptions[index]}</p>
              </div>
              <button
                onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                className={`p-1.5 rounded-lg transition-colors ${
                  editingIndex === index 
                    ? 'bg-[#CCFF00] text-black' 
                    : 'bg-[#2a3142] text-gray-400 hover:text-white'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Time Info */}
            <div className="mb-3 p-2 bg-[#1a1f2e] rounded-lg">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-lg font-bold font-mono">{scenario.months} months</span>
              </div>
              <div className="text-xs text-gray-500 ml-6">
                {monthsToDate(scenario.months, inputs.bookingMonth, inputs.bookingYear)}
              </div>
            </div>

            {/* Edit Slider */}
            {editingIndex === index && (
              <div className="mb-3 p-2 bg-[#CCFF00]/5 rounded-lg">
                <Slider
                  value={[exitScenarios[index]]}
                  onValueChange={([value]) => updateScenario(index, value)}
                  min={6}
                  max={totalMonths}
                  step={1}
                  className="roi-slider-lime"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>6 mo</span>
                  <span>{totalMonths} mo (Handover)</span>
                </div>
              </div>
            )}

            {/* Metrics */}
            <div className="space-y-2">
              {/* Original Price - NEW */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Original
                </span>
                <span className="text-sm text-gray-400 font-mono">{formatCurrency(basePrice, currency, rate)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  Payments
                </span>
                <span className="text-sm text-gray-300 font-mono">{formatCurrency(scenario.amountPaid, currency, rate)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">+ Entry Costs</span>
                <span className="text-sm text-gray-300 font-mono">{formatCurrency(scenario.entryCosts, currency, rate)}</span>
              </div>
              
              <div className="flex justify-between items-center border-t border-[#2a3142] pt-1">
                <span className="text-xs text-gray-400 font-medium">= Total Capital</span>
                <span className="text-sm text-white font-mono font-medium">{formatCurrency(scenario.amountPaid + scenario.entryCosts, currency, rate)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Exit Price</span>
                <span className="text-sm text-white font-mono">{formatCurrency(scenario.exitPrice, currency, rate)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-[#2a3142]">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Profit
                </span>
                <span className={`text-sm font-mono ${scenario.trueProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrency(scenario.trueProfit, currency, rate)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">ROE</span>
                <span className={`text-lg font-bold font-mono ${scenario.trueROE >= 0 ? 'text-[#CCFF00]' : 'text-red-400'}`}>
                  {scenario.trueROE.toFixed(1)}%
                </span>
              </div>

              <div className="text-xs text-gray-500 pt-1">
                {(scenario.trueROE / (scenario.months / 12)).toFixed(1)}% annualized
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Row */}
      <div className="px-4 pb-4">
        <div className="p-3 bg-[#0d1117] rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">💡 Best ROE in this comparison:</span>
            <span className="text-[#CCFF00] font-bold">
              Exit #{scenarios.indexOf(scenarios.reduce((best, s) => s.trueROE > best.trueROE ? s : best)) + 1} 
              ({Math.max(...scenarios.map(s => s.trueROE)).toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
