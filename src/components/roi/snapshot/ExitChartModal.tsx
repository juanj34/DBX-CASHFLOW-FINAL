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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exit Scenarios Analysis</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-3">
          {scenarios.map((scenario) => {
            const isBest = scenario.annualizedROE === bestROE;
            return (
              <div 
                key={scenario.months}
                className={cn(
                  "p-4 rounded-lg border",
                  isBest ? "bg-green-500/10 border-green-500/30" : "bg-muted/50 border-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{scenario.months} months</span>
                    {isBest && <Trophy className="w-4 h-4 text-yellow-500" />}
                  </div>
                  <span className={cn(
                    "font-bold",
                    scenario.annualizedROE >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {scenario.annualizedROE.toFixed(1)}% ROE/year
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block">Property Value</span>
                    <span className="font-medium">{formatCurrency(scenario.exitPrice, 'AED', 1)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Cash Invested</span>
                    <span className="font-medium">{formatCurrency(scenario.totalCapital, 'AED', 1)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Profit</span>
                    <span className={cn("font-medium", scenario.trueProfit >= 0 ? "text-green-500" : "text-red-500")}>
                      {formatCurrency(scenario.trueProfit, 'AED', 1)}
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
