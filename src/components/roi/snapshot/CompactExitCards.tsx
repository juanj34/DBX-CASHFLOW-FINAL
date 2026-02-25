import { TrendingUp, Clock, Trophy, ChevronRight } from 'lucide-react';
import { Currency, formatCurrency } from '../currencyUtils';
import { ExitScenarioResult } from '../constructionProgress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CompactExitCardsProps {
  exitScenarios: Array<ExitScenarioResult & { exitMonths: number }>;
  totalMonths: number;
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

export const CompactExitCards = ({
  exitScenarios,
  totalMonths,
  currency,
  rate,
  onClick,
}: CompactExitCardsProps) => {
  // Find best ROE
  const bestROE = Math.max(...exitScenarios.map(s => s.trueROE));

  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-lg p-4",
        onClick && "cursor-pointer hover:border-primary/50 transition-colors"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Projected ROI
        </h3>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      
      <div className="space-y-2">
        {exitScenarios.slice(0, 4).map((scenario) => {
          const isBest = scenario.trueROE === bestROE;
          const isHandover = scenario.exitMonths === totalMonths;
          
          return (
            <Tooltip key={scenario.exitMonths}>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg transition-colors",
                    isBest 
                      ? "bg-green-500/10 border border-green-500/30" 
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  {/* Period */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {isHandover ? 'Handover' : formatMonths(scenario.exitMonths)}
                    </span>
                    {isBest && <Trophy className="w-3 h-3 text-yellow-500" />}
                  </div>
                  
                  {/* ROE & Price */}
                  <div className="text-right">
                    <span className={cn(
                      "text-sm font-bold",
                      scenario.trueROE >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {scenario.trueROE.toFixed(1)}% ROE
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {formatCurrency(scenario.exitPrice, 'AED', 1)}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p className="font-semibold">Exit at {formatMonths(scenario.exitMonths)}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-muted-foreground">Cash Invested:</span>
                    <span>{formatCurrency(scenario.totalCapital, 'AED', 1)}</span>
                    <span className="text-muted-foreground">Property Value:</span>
                    <span>{formatCurrency(scenario.exitPrice, 'AED', 1)}</span>
                    <span className="text-muted-foreground">Profit:</span>
                    <span className={scenario.trueProfit >= 0 ? "text-green-500" : "text-red-500"}>
                      {formatCurrency(scenario.trueProfit, 'AED', 1)}
                    </span>
                    <span className="text-muted-foreground">Total ROE:</span>
                    <span className="font-bold">{scenario.trueROE.toFixed(1)}%</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      
      {onClick && exitScenarios.length > 4 && (
        <p className="text-xs text-center text-muted-foreground mt-3">
          Click to see all {exitScenarios.length} exit scenarios
        </p>
      )}
    </div>
  );
};
