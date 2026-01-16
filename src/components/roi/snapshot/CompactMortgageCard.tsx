import { Landmark, TrendingUp, TrendingDown } from 'lucide-react';
import { MortgageInputs, MortgageAnalysis } from '../useMortgageCalculations';
import { Currency, formatCurrency } from '../currencyUtils';

interface CompactMortgageCardProps {
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  monthlyRent: number;
  currency: Currency;
  rate: number;
}

export const CompactMortgageCard = ({
  mortgageInputs,
  mortgageAnalysis,
  monthlyRent,
  currency,
  rate,
}: CompactMortgageCardProps) => {
  if (!mortgageInputs.enabled) return null;

  const { loanAmount, monthlyPayment, totalInterest, equityRequiredPercent } = mortgageAnalysis;
  
  // Cash flow calculation
  const monthlyCashflow = monthlyRent - monthlyPayment;
  const isPositive = monthlyCashflow >= 0;

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">Mortgage</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
          {mortgageInputs.loanTermYears}yr @ {mortgageInputs.interestRate}%
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Loan Amount */}
        <div className="flex justify-between text-xs">
          <span className="text-theme-text-muted">Loan Amount ({100 - equityRequiredPercent}%)</span>
          <span className="font-mono tabular-nums text-theme-text">{formatCurrency(loanAmount, currency, rate)}</span>
        </div>
        
        {/* Monthly Payment */}
        <div className="flex justify-between text-xs">
          <span className="text-theme-text-muted">Monthly Payment</span>
          <span className="font-mono tabular-nums font-bold text-purple-400">{formatCurrency(monthlyPayment, currency, rate)}</span>
        </div>
        
        {/* Rental Income */}
        <div className="flex justify-between text-xs">
          <span className="text-theme-text-muted">Rental Income</span>
          <span className="font-mono tabular-nums text-cyan-400">+{formatCurrency(monthlyRent, currency, rate)}</span>
        </div>
        
        {/* Cash Flow */}
        <div className="flex justify-between text-xs pt-2 border-t border-theme-border">
          <span className="font-medium text-theme-text flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-3 h-3 text-green-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400" />
            )}
            Monthly Cash Flow
          </span>
          <span className={`font-mono tabular-nums font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{formatCurrency(monthlyCashflow, currency, rate)}
          </span>
        </div>
        
        {/* Summary badges */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-theme-card-alt border border-theme-border text-theme-text-muted">
            Total Interest: {formatCurrency(totalInterest, currency, rate)}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {isPositive ? 'Cash Flow Positive' : 'Negative'}
          </span>
        </div>
      </div>
    </div>
  );
};
