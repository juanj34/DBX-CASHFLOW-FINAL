import { MortgageBreakdown } from "@/components/roi/MortgageBreakdown";
import { MortgageInputs, MortgageAnalysis } from "@/components/roi/useMortgageCalculations";
import { OICalculations, OIInputs } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";

interface MortgageCoverageTabProps {
  inputs: OIInputs;
  calculations: OICalculations;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  currency: Currency;
  rate: number;
}

export const MortgageCoverageTab = ({
  inputs,
  calculations,
  mortgageInputs,
  mortgageAnalysis,
  currency,
  rate,
}: MortgageCoverageTabProps) => {
  // Find first full rental year for rent comparison
  const firstFullRentalYear = calculations.yearlyProjections.find(p =>
    !p.isConstruction && !p.isHandover && p.annualRent !== null && p.annualRent > 0
  );

  const fullAnnualRent = firstFullRentalYear?.annualRent || (inputs.basePrice * inputs.rentalYieldPercent / 100);
  const monthlyLongTermRent = fullAnnualRent / 12;
  const monthlyServiceCharges = (firstFullRentalYear?.serviceCharges || 0) / 12;
  const fullAnnualAirbnbNet = firstFullRentalYear?.airbnbNetIncome || 0;
  const monthlyAirbnbNet = fullAnnualAirbnbNet / 12;

  // Year 5 projections for growth comparison
  const year5RentalYear = (firstFullRentalYear?.year || 0) + 4;
  const year5Projection = calculations.yearlyProjections.find(p => p.year === year5RentalYear);
  const year5LongTermRent = year5Projection?.annualRent ? (year5Projection.annualRent / 12) : undefined;
  const year5AirbnbNet = year5Projection?.airbnbNetIncome ? (year5Projection.airbnbNetIncome / 12) : undefined;

  // Coverage ratios
  const monthlyMortgage = mortgageAnalysis.monthlyPayment || 0;
  const netMonthlyRent = monthlyLongTermRent - monthlyServiceCharges;
  const coverageRatio = monthlyMortgage > 0 ? netMonthlyRent / monthlyMortgage : 0;

  // Year-by-year coverage
  const coverageByYear = calculations.yearlyProjections
    .filter(p => !p.isConstruction && !p.isHandover && p.netRent && p.netRent > 0)
    .slice(0, 7)
    .map(p => ({
      year: p.year,
      monthlyRent: (p.netRent || 0) / 12,
      monthlyMortgage,
      ratio: monthlyMortgage > 0 ? ((p.netRent || 0) / 12) / monthlyMortgage : 0,
    }));

  const getCoverageColor = (ratio: number) => {
    if (ratio >= 1.2) return 'text-green-400 bg-green-500/10';
    if (ratio >= 0.8) return 'text-amber-400 bg-amber-500/10';
    return 'text-red-400 bg-red-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Coverage Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-theme-card rounded-xl border border-theme-border text-center">
          <div className="text-[10px] text-theme-text-muted uppercase">Monthly Mortgage</div>
          <div className="text-sm font-mono font-semibold text-red-400 mt-1">
            {formatCurrency(monthlyMortgage, currency, rate)}
          </div>
        </div>
        <div className="p-3 bg-theme-card rounded-xl border border-theme-border text-center">
          <div className="text-[10px] text-theme-text-muted uppercase">Monthly Net Rent</div>
          <div className="text-sm font-mono font-semibold text-green-400 mt-1">
            {formatCurrency(netMonthlyRent, currency, rate)}
          </div>
        </div>
        <div className={`p-3 rounded-xl border text-center ${getCoverageColor(coverageRatio)}`}>
          <div className="text-[10px] uppercase opacity-70">Coverage Ratio</div>
          <div className="text-lg font-mono font-bold mt-1">{coverageRatio.toFixed(2)}x</div>
          <div className="text-[10px] opacity-70">
            {coverageRatio >= 1.2 ? 'Strong' : coverageRatio >= 0.8 ? 'Moderate' : 'Weak'}
          </div>
        </div>
      </div>

      {/* Year-by-Year Coverage */}
      {coverageByYear.length > 0 && (
        <div className="p-4 bg-theme-card rounded-xl border border-theme-border">
          <h4 className="text-sm font-semibold text-theme-text mb-3">Coverage Over Time</h4>
          <div className="space-y-2">
            {coverageByYear.map((cy) => (
              <div key={cy.year} className="flex items-center gap-3">
                <span className="text-xs text-theme-text-muted w-10 font-mono">{cy.year}</span>
                <div className="flex-1 bg-theme-bg rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      cy.ratio >= 1.2 ? 'bg-green-500' : cy.ratio >= 0.8 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, cy.ratio * 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-mono w-12 text-right ${
                  cy.ratio >= 1.2 ? 'text-green-400' : cy.ratio >= 0.8 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {cy.ratio.toFixed(2)}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Mortgage Breakdown */}
      <MortgageBreakdown
        mortgageInputs={mortgageInputs}
        mortgageAnalysis={mortgageAnalysis}
        basePrice={calculations.basePrice}
        currency={currency}
        rate={rate}
        preHandoverPercent={inputs.preHandoverPercent}
        monthlyLongTermRent={monthlyLongTermRent}
        monthlyServiceCharges={monthlyServiceCharges}
        monthlyAirbnbNet={inputs.showAirbnbComparison ? monthlyAirbnbNet : undefined}
        year5LongTermRent={year5LongTermRent}
        year5AirbnbNet={inputs.showAirbnbComparison ? year5AirbnbNet : undefined}
      />
    </div>
  );
};
