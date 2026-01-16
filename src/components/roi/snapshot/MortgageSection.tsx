import { Landmark, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import { Currency, formatCurrency } from '../currencyUtils';
import { MortgageAnalysis } from '../useMortgageCalculations';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MortgageSectionProps {
  mortgageAnalysis: MortgageAnalysis;
  currency: Currency;
  rate: number;
  onDetailsClick?: () => void;
}

export const MortgageSection = ({
  mortgageAnalysis,
  currency,
  rate,
  onDetailsClick,
}: MortgageSectionProps) => {
  const loanDetails = {
    loanAmount: mortgageAnalysis.loanAmount,
    monthlyPayment: mortgageAnalysis.monthlyPayment,
    totalInterest: mortgageAnalysis.totalInterest,
  };
  const stressTests = mortgageAnalysis.stressScenarios || [];
  
  // Find the scenario that is at break (cashflow positive)
  const positiveScenario = stressTests.find(s => s.status === 'positive');
  const negativeScenario = stressTests.find(s => s.status === 'negative');

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Landmark className="w-4 h-4" />
          Section D - Mortgage Analysis
        </h3>
        
        {onDetailsClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDetailsClick}
            className="h-7 text-xs"
          >
            View Amortization
          </Button>
        )}
      </div>
      
      {/* Content Grid */}
      <div className="grid md:grid-cols-3 gap-4 p-4">
        {/* Loan Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            Loan Details
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan Amount</span>
              <span className="font-medium text-foreground">
                {formatCurrency(loanDetails.loanAmount, 'AED', 1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interest Rate</span>
              <span className="font-medium text-foreground">
                {loanDetails.monthlyPayment > 0 
                  ? `${((loanDetails.totalInterest / loanDetails.loanAmount / 25) * 100).toFixed(1)}%` 
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Payment</span>
              <span className="font-medium text-primary">
                {formatCurrency(loanDetails.monthlyPayment, 'AED', 1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Interest</span>
              <span className="text-red-500">
                {formatCurrency(loanDetails.totalInterest, 'AED', 1)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Cashflow Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Shield className="w-4 h-4" />
            Cashflow Status
          </div>
          
          <div className={cn(
            "p-3 rounded-lg text-center",
            positiveScenario 
              ? "bg-green-500/10 border border-green-500/30" 
              : "bg-red-500/10 border border-red-500/30"
          )}>
            <div className={cn(
              "text-lg font-bold",
              positiveScenario ? "text-green-500" : "text-red-500"
            )}>
              {positiveScenario ? 'Cashflow Positive' : 'Cashflow Negative'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {positiveScenario 
                ? `+${formatCurrency(positiveScenario.cashflow, 'AED', 1)}/mo surplus`
                : negativeScenario 
                  ? `${formatCurrency(negativeScenario.cashflow, 'AED', 1)}/mo deficit`
                  : 'Break-even'}
            </p>
          </div>
        </div>
        
        {/* Stress Test Summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <AlertTriangle className="w-4 h-4" />
            Stress Test
          </div>
          
          <div className="space-y-2 text-xs">
            {stressTests.slice(0, 3).map((scenario, idx) => (
              <div 
                key={idx}
                className={cn(
                  "flex justify-between items-center p-2 rounded",
                  scenario.status === 'positive' && "bg-green-500/10",
                  scenario.status === 'negative' && "bg-red-500/10",
                  scenario.status === 'break-even' && "bg-yellow-500/10"
                )}
              >
                <span className="text-muted-foreground">{scenario.interestRate}% rate</span>
                <span className={cn(
                  "font-medium",
                  scenario.status === 'positive' && "text-green-500",
                  scenario.status === 'negative' && "text-red-500",
                  scenario.status === 'break-even' && "text-yellow-500"
                )}>
                  {formatCurrency(scenario.cashflow, 'AED', 1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
