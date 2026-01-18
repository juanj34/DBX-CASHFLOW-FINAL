import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OIInputs } from '../useOICalculations';
import { Currency, formatCurrency } from '../currencyUtils';
import { Clock, TrendingUp, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateExitScenario, ExitScenarioResult } from '../constructionProgress';

interface ExitChartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputs: OIInputs;
  exitScenarios: number[];
  totalMonths: number;
  basePrice: number;
  totalEntryCosts: number;
  currency: Currency;
  rate: number;
}

export const ExitChartModal = ({
  open,
  onOpenChange,
  inputs,
  exitScenarios,
  totalMonths,
  basePrice,
  totalEntryCosts,
  currency,
  rate,
}: ExitChartModalProps) => {
  const scenarios = exitScenarios.map(months => ({
    months,
    ...calculateExitScenario(months, basePrice, totalMonths, inputs, totalEntryCosts)
  }));
  
  const bestROE = Math.max(...scenarios.map(s => s.annualizedROE));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-theme-card border-theme-border">
        <DialogHeader>
          <DialogTitle className="text-theme-text">Exit Scenarios Analysis</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-3">
          {scenarios.map((scenario) => {
            const isBest = scenario.annualizedROE === bestROE;
            return (
              <div 
                key={scenario.months}
                className={cn(
                  "p-4 rounded-lg border",
                  isBest ? "bg-green-500/10 border-green-500/30" : "bg-theme-bg/50 border-theme-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-theme-text-muted" />
                    <span className="font-medium text-theme-text">{scenario.months} months</span>
                    {isBest && <Trophy className="w-4 h-4 text-yellow-500" />}
                  </div>
                  <span className={cn(
                    "font-bold",
                    scenario.annualizedROE >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {scenario.annualizedROE.toFixed(1)}% ROE/year
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-theme-text-muted block">Property Value</span>
                    <span className="font-medium text-theme-text">{formatCurrency(scenario.exitPrice, currency, rate)}</span>
                  </div>
                  <div>
                    <span className="text-theme-text-muted block">Cash Invested</span>
                    <span className="font-medium text-theme-text">{formatCurrency(scenario.totalCapital, currency, rate)}</span>
                  </div>
                  <div>
                    <span className="text-theme-text-muted block">Profit</span>
                    <span className={cn("font-medium", scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400")}>
                      {formatCurrency(scenario.trueProfit, currency, rate)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
