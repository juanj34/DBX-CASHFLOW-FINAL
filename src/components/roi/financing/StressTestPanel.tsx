import { AlertTriangle, CheckCircle, MinusCircle } from "lucide-react";
import { Currency, formatCurrency } from "../currencyUtils";
import { StressScenario } from "../useMortgageCalculations";
import { cn } from "@/lib/utils";

interface StressTestPanelProps {
  stressScenarios: StressScenario[];
  currency: Currency;
  rate: number;
  viewMode: 'monthly' | 'annual';
}

export const StressTestPanel = ({
  stressScenarios,
  currency,
  rate,
  viewMode,
}: StressTestPanelProps) => {
  const displayMultiplier = viewMode === 'annual' ? 12 : 1;
  
  const getStatusIcon = (status: 'positive' | 'tight' | 'negative') => {
    switch (status) {
      case 'positive':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'tight':
        return <MinusCircle className="w-3.5 h-3.5 text-yellow-400" />;
      case 'negative':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
    }
  };

  const getStatusColor = (status: 'positive' | 'tight' | 'negative') => {
    switch (status) {
      case 'positive':
        return 'text-emerald-400';
      case 'tight':
        return 'text-yellow-400';
      case 'negative':
        return 'text-red-400';
    }
  };

  const getStatusBg = (status: 'positive' | 'tight' | 'negative') => {
    switch (status) {
      case 'positive':
        return 'bg-emerald-900/20 border-emerald-700/30';
      case 'tight':
        return 'bg-yellow-900/20 border-yellow-700/30';
      case 'negative':
        return 'bg-red-900/20 border-red-700/30';
    }
  };

  // Check if all scenarios are positive
  const allPositive = stressScenarios.every(s => s.status === 'positive');

  return (
    <div className="p-4 rounded-xl bg-theme-card border border-theme-border h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-medium text-theme-text-muted uppercase tracking-wider">Stress Test</span>
      </div>

      {/* Status Badge */}
      <div className={cn(
        "text-center py-2 px-3 rounded-lg mb-3",
        allPositive ? "bg-emerald-900/30 border border-emerald-700/50" : "bg-amber-900/30 border border-amber-700/50"
      )}>
        <span className={cn(
          "text-xs font-semibold",
          allPositive ? "text-emerald-400" : "text-amber-400"
        )}>
          {allPositive ? "✓ Resilient at All Rates" : "⚠ Review Higher Rates"}
        </span>
      </div>

      {/* Stress Test Table */}
      <div className="flex-1 space-y-2">
        {stressScenarios.map((scenario, index) => (
          <div 
            key={scenario.rate}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg border",
              getStatusBg(scenario.status)
            )}
          >
            <div className="flex items-center gap-2">
              {getStatusIcon(scenario.status)}
              <div>
                <span className="text-xs font-mono text-theme-text">
                  {scenario.rate.toFixed(1)}%
                </span>
                {index === 0 && (
                  <span className="ml-1 text-[9px] text-theme-text-muted">(current)</span>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className={cn(
                "text-sm font-mono font-semibold",
                getStatusColor(scenario.status)
              )}>
                {scenario.netCashflow >= 0 ? '+' : ''}{formatCurrency(scenario.netCashflow * displayMultiplier, currency, rate)}
              </div>
              <div className="text-[9px] text-theme-text-muted font-mono">
                {formatCurrency(scenario.monthlyPayment * displayMultiplier, currency, rate)} debt
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pitch Text */}
      <p className="text-[9px] text-theme-text-muted text-center mt-3 leading-relaxed">
        {allPositive 
          ? `Property remains cashflow positive even at ${stressScenarios[stressScenarios.length - 1]?.rate.toFixed(1)}% interest rate`
          : "Higher rates may require additional cashflow planning"}
      </p>
    </div>
  );
};
