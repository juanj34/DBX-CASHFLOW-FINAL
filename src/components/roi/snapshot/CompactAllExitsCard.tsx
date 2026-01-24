import { TrendingUp, Clock, Trophy, ChevronRight, Hammer, DollarSign } from 'lucide-react';
import { OIInputs, OICalculations, OIExitScenario } from '../useOICalculations';
import { Currency, formatCurrency } from '../currencyUtils';
import { monthToConstruction } from '../constructionProgress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CompactAllExitsCardProps {
  inputs: OIInputs;
  calculations: OICalculations;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
  onClick?: () => void;
}

const formatMonths = (months: number): string => {
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years}y`;
    return `${years}y ${remainingMonths}m`;
  }
  return `${months}m`;
};

const getDateFromMonths = (months: number, bookingMonth: number, bookingYear: number): string => {
  const totalMonthsFromJan = bookingMonth + months;
  const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
  const month = ((totalMonthsFromJan - 1) % 12) + 1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]}'${(bookingYear + yearOffset).toString().slice(-2)}`;
};

export const CompactAllExitsCard = ({
  inputs,
  calculations,
  exitScenarios,
  currency,
  rate,
  onClick,
}: CompactAllExitsCardProps) => {
  // Use pre-calculated scenarios from calculations instead of recalculating
  const scenarios = exitScenarios.map(exitMonths => {
    // Find matching scenario from pre-calculated list
    const preCalcScenario = calculations.scenarios.find(s => s.exitMonths === exitMonths);
    const isHandover = exitMonths >= calculations.totalMonths;
    const dateStr = getDateFromMonths(exitMonths, inputs.bookingMonth, inputs.bookingYear);
    const constructionPct = Math.min(100, monthToConstruction(exitMonths, calculations.totalMonths));
    
    if (preCalcScenario) {
      return {
        ...preCalcScenario,
        isHandover,
        dateStr,
        constructionPct,
      };
    }
    
    // Fallback - shouldn't happen if exitScenarios are properly configured
    return {
      exitMonths,
      exitPrice: 0,
      totalCapital: 0,
      trueProfit: 0,
      annualizedROE: 0,
      isHandover,
      dateStr,
      constructionPct,
    };
  });

  // Find best ROE
  const bestROE = Math.max(...scenarios.map(s => s.annualizedROE));

  return (
    <div 
      className={cn(
        "bg-theme-card border border-theme-border rounded-xl overflow-hidden flex flex-col",
        "min-h-[280px]", // Match other column heights
        onClick && "cursor-pointer hover:border-primary/50 transition-colors"
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">Exit Scenarios</span>
        </div>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-theme-text-muted" />
        )}
      </div>
      
      {/* Scenarios List */}
      <div className="p-3 space-y-2 flex-1 overflow-auto">
        {scenarios.map((scenario) => {
          const isBest = scenario.annualizedROE === bestROE && scenario.annualizedROE > 0;
          
          return (
            <Tooltip key={scenario.exitMonths}>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    isBest 
                      ? "bg-green-500/10 border border-green-500/30" 
                      : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                  )}
                >
                  {/* Top Row: Period, Date, Construction % */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {isBest && <Trophy className="w-3.5 h-3.5 text-yellow-500" />}
                      <Clock className="w-3 h-3 text-theme-text-muted" />
                      <span className="text-sm font-medium text-theme-text">
                        {scenario.isHandover ? 'Handover' : formatMonths(scenario.exitMonths)}
                      </span>
                      <span className="text-xs text-theme-text-muted">
                        {scenario.dateStr}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Hammer className="w-3 h-3 text-orange-400" />
                      <span className="text-xs text-orange-400 font-medium">
                        {scenario.constructionPct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Bottom Row: Value, Profit, ROE */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-theme-text-muted">
                        {formatCurrency(scenario.exitPrice, 'AED', 1)}
                      </span>
                      <span className={cn(
                        "font-medium",
                        scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrency(scenario.trueProfit, 'AED', 1)}
                      </span>
                    </div>
                    <span className={cn(
                      "text-sm font-bold font-mono tabular-nums",
                      scenario.annualizedROE >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {scenario.annualizedROE.toFixed(0)}%/yr
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs bg-theme-card border-theme-border">
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-theme-text">
                    Exit at {scenario.isHandover ? 'Handover' : formatMonths(scenario.exitMonths)}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-theme-text-muted">Construction:</span>
                    <span className="text-theme-text">{scenario.constructionPct.toFixed(0)}% complete</span>
                    <span className="text-theme-text-muted">Cash Invested:</span>
                    <span className="text-theme-text">{formatCurrency(scenario.totalCapital, 'AED', 1)}</span>
                    <span className="text-theme-text-muted">Property Value:</span>
                    <span className="text-theme-text">{formatCurrency(scenario.exitPrice, 'AED', 1)}</span>
                    <span className="text-theme-text-muted">Profit:</span>
                    <span className={scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400"}>
                      {formatCurrency(scenario.trueProfit, 'AED', 1)}
                    </span>
                    <span className="text-theme-text-muted">Annualized ROE:</span>
                    <span className="font-bold text-theme-text">{scenario.annualizedROE.toFixed(2)}%</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Footer hint */}
      {onClick && (
        <div className="px-3 py-2 border-t border-theme-border/50 bg-theme-bg/30 flex-shrink-0">
          <span className="text-[10px] text-theme-text-muted">Click for detailed breakdown</span>
        </div>
      )}
    </div>
  );
};
