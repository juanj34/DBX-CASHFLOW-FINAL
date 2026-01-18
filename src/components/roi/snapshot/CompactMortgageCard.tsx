import { Landmark, TrendingUp, TrendingDown } from 'lucide-react';
import { MortgageInputs, MortgageAnalysis } from '../useMortgageCalculations';
import { Currency, formatDualCurrency } from '../currencyUtils';
import { DottedRow } from './DottedRow';

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

  // Dual currency helper
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Mortgage</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
          {mortgageInputs.loanTermYears}yr @ {mortgageInputs.interestRate}%
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Loan Amount */}
        <DottedRow 
          label={`Loan Amount (${100 - equityRequiredPercent}%)`}
          value={getDualValue(loanAmount).primary}
          secondaryValue={getDualValue(loanAmount).secondary}
        />
        
        {/* Monthly Payment */}
        <DottedRow 
          label="Monthly Payment"
          value={getDualValue(monthlyPayment).primary}
          secondaryValue={getDualValue(monthlyPayment).secondary}
          bold
          valueClassName="text-purple-400"
        />
        
        {/* Rental Income */}
        <DottedRow 
          label="Rental Income"
          value={`+${getDualValue(monthlyRent).primary}`}
          valueClassName="text-cyan-400"
        />
        
        {/* Cash Flow */}
        <div className="pt-2 border-t border-border">
          <DottedRow 
            label="Monthly Cash Flow"
            value={`${isPositive ? '+' : ''}${getDualValue(monthlyCashflow).primary}`}
            bold
            valueClassName={isPositive ? 'text-green-400' : 'text-red-400'}
          />
        </div>
        
        {/* Summary badges */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">
            Interest: {getDualValue(totalInterest).primary}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${isPositive ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {isPositive ? 'Positive' : 'Negative'}
          </span>
        </div>
      </div>
    </div>
  );
};
