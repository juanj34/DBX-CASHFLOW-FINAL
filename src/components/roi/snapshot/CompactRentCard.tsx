import { Home, Minus, Equal, TrendingUp } from 'lucide-react';
import { OIInputs } from '../useOICalculations';
import { Currency, formatCurrency } from '../currencyUtils';

interface CompactRentCardProps {
  inputs: OIInputs;
  currency: Currency;
  rate: number;
}

export const CompactRentCard = ({
  inputs,
  currency,
  rate,
}: CompactRentCardProps) => {
  const { 
    basePrice,
    rentalYieldPercent, 
    serviceChargePerSqft = 18,
    unitSizeSqf = 0,
    showAirbnbComparison,
    shortTermRental
  } = inputs;
  
  // Long-term calculations
  const grossAnnualRent = basePrice * (rentalYieldPercent / 100);
  const annualServiceCharges = unitSizeSqf * serviceChargePerSqft;
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const monthlyRent = netAnnualRent / 12;
  const grossYield = rentalYieldPercent;
  const netYield = basePrice > 0 ? (netAnnualRent / basePrice) * 100 : 0;
  
  // Short-term calculations
  const adrValue = shortTermRental?.averageDailyRate || 800;
  const occupancyPercent = shortTermRental?.occupancyPercent || 70;
  const operatingExpensePercent = shortTermRental?.operatingExpensePercent || 25;
  const managementFeePercent = shortTermRental?.managementFeePercent || 15;
  
  const grossAirbnbAnnual = adrValue * 365 * (occupancyPercent / 100);
  const totalExpensePercent = operatingExpensePercent + managementFeePercent;
  const airbnbOperatingExpenses = grossAirbnbAnnual * (totalExpensePercent / 100);
  const netAirbnbAnnual = grossAirbnbAnnual - airbnbOperatingExpenses - annualServiceCharges;
  const monthlyAirbnb = netAirbnbAnnual / 12;
  
  // Comparison
  const airbnbDifferencePercent = netAnnualRent > 0 
    ? ((netAirbnbAnnual - netAnnualRent) / netAnnualRent) * 100
    : 0;

  if (rentalYieldPercent <= 0) return null;

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-theme-accent" />
          <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">Rental Income</span>
        </div>
        {showAirbnbComparison && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400">
            LT + ST
          </span>
        )}
      </div>

      {/* Content */}
      <div className={showAirbnbComparison ? "grid grid-cols-2" : ""}>
        {/* Long-Term Section */}
        <div className="p-3 space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-cyan-400 font-semibold">Long-Term</div>
          
          <div className="flex justify-between text-xs">
            <span className="text-theme-text-muted">Gross</span>
            <span className="font-mono tabular-nums text-theme-text">{formatCurrency(grossAnnualRent, currency, rate)}</span>
          </div>
          
          {unitSizeSqf > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-theme-text-muted flex items-center gap-1">
                <Minus className="w-2.5 h-2.5 text-red-400" />
                Service
              </span>
              <span className="font-mono tabular-nums text-red-400">-{formatCurrency(annualServiceCharges, currency, rate)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-xs pt-1 border-t border-theme-border">
            <span className="text-theme-text flex items-center gap-1">
              <Equal className="w-2.5 h-2.5 text-theme-accent" />
              Net/year
            </span>
            <span className="font-mono tabular-nums font-bold text-theme-accent">{formatCurrency(netAnnualRent, currency, rate)}</span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span className="text-theme-text-muted">Monthly</span>
            <span className="font-mono tabular-nums text-cyan-400">{formatCurrency(monthlyRent, currency, rate)}</span>
          </div>
          
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-theme-card-alt border border-theme-border text-theme-text-muted">
              Gross: {grossYield.toFixed(1)}%
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              Net: {netYield.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Short-Term Section */}
        {showAirbnbComparison && (
          <div className="p-3 space-y-2 border-l border-theme-border bg-orange-500/5">
            <div className="text-[10px] uppercase tracking-wide text-orange-400 font-semibold">Short-Term</div>
            
            <div className="flex justify-between text-xs">
              <span className="text-theme-text-muted">ADR × {occupancyPercent}%</span>
              <span className="font-mono tabular-nums text-theme-text">{formatCurrency(grossAirbnbAnnual, currency, rate)}</span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-theme-text-muted flex items-center gap-1">
                <Minus className="w-2.5 h-2.5 text-red-400" />
                Expenses
              </span>
              <span className="font-mono tabular-nums text-red-400">-{formatCurrency(airbnbOperatingExpenses + annualServiceCharges, currency, rate)}</span>
            </div>
            
            <div className="flex justify-between text-xs pt-1 border-t border-orange-500/20">
              <span className="text-theme-text flex items-center gap-1">
                <Equal className="w-2.5 h-2.5 text-orange-400" />
                Net/year
              </span>
              <span className="font-mono tabular-nums font-bold text-orange-400">{formatCurrency(netAirbnbAnnual, currency, rate)}</span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-theme-text-muted">Monthly</span>
              <span className="font-mono tabular-nums text-orange-400">{formatCurrency(monthlyAirbnb, currency, rate)}</span>
            </div>
            
            <div className="flex items-center gap-1 pt-1">
              <TrendingUp className={`w-3 h-3 ${airbnbDifferencePercent >= 0 ? 'text-green-400' : 'text-red-400 rotate-180'}`} />
              <span className={`text-[10px] font-medium ${airbnbDifferencePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {airbnbDifferencePercent >= 0 ? '+' : ''}{airbnbDifferencePercent.toFixed(0)}% vs LT
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
