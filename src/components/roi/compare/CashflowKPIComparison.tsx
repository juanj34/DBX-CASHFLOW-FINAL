import { useMemo } from 'react';
import { QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { formatCurrency, Currency } from '@/components/roi/currencyUtils';
import { Trophy, TrendingUp, TrendingDown, Home, Banknote } from 'lucide-react';

interface CashflowKPIComparisonProps {
  quotesWithCalcs: QuoteWithCalculations[];
  currency?: Currency;
  exchangeRate?: number;
}

export const CashflowKPIComparison = ({
  quotesWithCalcs,
  currency = 'AED',
  exchangeRate = 1,
}: CashflowKPIComparisonProps) => {
  const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500'];

  const cashflowData = useMemo(() => {
    return quotesWithCalcs.map(({ quote, calculations }) => {
      const mortgageInputs = (quote.inputs as any)?._mortgageInputs;
      const mortgageEnabled = mortgageInputs?.enabled ?? false;
      
      // Calculate monthly mortgage payment from inputs if enabled
      let monthlyMortgage = 0;
      if (mortgageEnabled && mortgageInputs) {
        const loanAmount = quote.inputs.basePrice * (mortgageInputs.financingPercent / 100);
        const monthlyRate = (mortgageInputs.interestRate || 4.5) / 100 / 12;
        const numPayments = (mortgageInputs.loanTermYears || 25) * 12;
        
        if (monthlyRate > 0 && numPayments > 0) {
          const factor = Math.pow(1 + monthlyRate, numPayments);
          monthlyMortgage = loanAmount * (monthlyRate * factor) / (factor - 1);
        } else if (numPayments > 0) {
          monthlyMortgage = loanAmount / numPayments;
        }
      }
      
      // Monthly net rent
      const netAnnualRent = calculations.holdAnalysis?.netAnnualRent || 0;
      const monthlyRent = netAnnualRent / 12;
      
      // Net cashflow (rent - mortgage)
      const netCashflow = monthlyRent - monthlyMortgage;
      
      return {
        quoteId: quote.id,
        title: quote.title || quote.projectName || 'Quote',
        monthlyMortgage,
        monthlyRent,
        netCashflow,
        mortgageEnabled,
      };
    });
  }, [quotesWithCalcs]);

  // Find best net cashflow
  const bestNetCashflow = Math.max(...cashflowData.map(d => d.netCashflow));
  const hasMortgage = cashflowData.some(d => d.mortgageEnabled);
  const hasRent = cashflowData.some(d => d.monthlyRent > 0);

  if (!hasRent && !hasMortgage) return null;

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${quotesWithCalcs.length}, minmax(180px, 1fr))` }}>
      {cashflowData.map((data, idx) => {
        const color = colors[idx % colors.length];
        const isBest = data.netCashflow === bestNetCashflow && data.netCashflow > 0;
        const isPositive = data.netCashflow >= 0;
        
        return (
          <div
            key={data.quoteId}
            className="bg-[#1a1f2e] border border-[#2a3142] rounded-xl p-4 space-y-4"
            style={{ borderTopColor: color, borderTopWidth: '3px' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate" style={{ color }}>
                {data.title}
              </span>
              {isBest && <Trophy className="w-4 h-4 text-emerald-400" />}
            </div>

            {/* Rental Income */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                <Home className="w-3.5 h-3.5" />
                <span>Monthly Rent</span>
              </div>
              <p className="text-lg font-semibold text-emerald-400">
                {data.monthlyRent > 0 
                  ? `+${formatCurrency(data.monthlyRent, currency, exchangeRate)}`
                  : '—'}
              </p>
            </div>

            {/* Mortgage Payment */}
            {data.mortgageEnabled && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Monthly Mortgage</span>
                </div>
                <p className="text-lg font-semibold text-red-400">
                  -{formatCurrency(data.monthlyMortgage, currency, exchangeRate)}
                </p>
              </div>
            )}

            {/* Net Cashflow */}
            <div className="pt-3 border-t border-[#2a3142] space-y-1">
              <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                )}
                <span>Net Monthly Cashflow</span>
              </div>
              <p className={`text-xl font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{formatCurrency(data.netCashflow, currency, exchangeRate)}
              </p>
              <p className="text-xs text-theme-text-muted">
                {isPositive 
                  ? 'Positive cashflow - tenant covers costs'
                  : 'Negative cashflow - monthly gap payment'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CashflowKPIComparison;
