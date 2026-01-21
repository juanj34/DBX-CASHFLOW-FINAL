import { TrendingUp, Clock, Trophy, ChevronRight } from 'lucide-react';
import { OIInputs, OICalculations } from '../useOICalculations';
import { Currency, formatCurrency } from '../currencyUtils';
import { calculateExitScenario } from '../constructionProgress';
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
  // Calculate all exit scenarios
  const scenarios = exitScenarios.map(exitMonths => {
    const result = calculateExitScenario(
      exitMonths, 
      calculations.basePrice, 
      calculations.totalMonths, 
      inputs, 
      calculations.totalEntryCosts
    );
    const isHandover = exitMonths >= calculations.totalMonths;
    const dateStr = getDateFromMonths(exitMonths, inputs.bookingMonth, inputs.bookingYear);
    
    return {
      exitMonths,
      ...result,
      isHandover,
      dateStr,
    };
  });

  // Find best ROE
  const bestROE = Math.max(...scenarios.map(s => s.annualizedROE));

  return (
    <div 
      className={cn(
        "bg-theme-card border border-theme-border rounded-xl overflow-hidden",
        onClick && "cursor-pointer hover:border-primary/50 transition-colors"
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">Exit Scenarios</span>
        </div>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-theme-text-muted" />
        )}
      </div>
      
      {/* Scenarios Grid */}
      <div className="p-3 space-y-1.5">
        {scenarios.map((scenario) => {
          const isBest = scenario.annualizedROE === bestROE;
          
          return (
            <Tooltip key={scenario.exitMonths}>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg transition-colors",
                    isBest 
                      ? "bg-green-500/10 border border-green-500/30" 
                      : "bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  {/* Period */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-theme-text-muted" />
                    <span className="text-xs font-medium text-theme-text">
                      {scenario.isHandover ? 'Handover' : formatMonths(scenario.exitMonths)}
                    </span>
                    <span className="text-[10px] text-theme-text-muted">
                      {scenario.dateStr}
                    </span>
                    {isBest && <Trophy className="w-3 h-3 text-yellow-500" />}
                  </div>
                  
                  {/* ROE & Price */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-theme-text-muted">
                      {formatCurrency(scenario.exitPrice, 'AED', 1)}
                    </span>
                    <span className={cn(
                      "text-xs font-bold font-mono tabular-nums min-w-[48px] text-right",
                      scenario.annualizedROE >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {scenario.annualizedROE.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs bg-theme-card border-theme-border">
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-theme-text">Exit at {formatMonths(scenario.exitMonths)}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
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
    </div>
  );
};
