import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";

interface RentalsTabProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
}

export const RentalsTab = ({ inputs, calculations, currency, rate }: RentalsTabProps) => {
  const showAirbnb = inputs.showAirbnbComparison ?? false;
  const { yearlyProjections } = calculations;

  // Filter to post-handover years with rental data
  const rentalYears = yearlyProjections.filter(p =>
    !p.isConstruction && !p.isHandover && p.annualRent !== null && p.annualRent > 0
  );

  const formatValue = (value: number) => formatCurrency(value, currency, rate);

  // Year 1 and Year 5 for quick comparison
  const year1 = rentalYears[0];
  const year5 = rentalYears[4] || rentalYears[rentalYears.length - 1];

  return (
    <div className="space-y-6">
      {/* Long-Term Summary */}
      <div className="p-4 bg-theme-card rounded-xl border border-theme-border">
        <h4 className="text-sm font-semibold text-theme-text mb-3">Long-Term Rental Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Initial Gross Rent" value={year1 ? formatValue(year1.annualRent || 0) : '-'} sub="Year 1" />
          <MetricCard label="Service Charges" value={year1 ? formatValue(year1.serviceCharges || 0) : '-'} sub="/year" />
          <MetricCard label="Net Rent Year 1" value={year1 ? formatValue(year1.netRent || 0) : '-'} sub={`Yield: ${inputs.rentalYieldPercent}%`} />
          <MetricCard label="Net Rent Year 5" value={year5 ? formatValue(year5.netRent || 0) : '-'} sub={`Growth: ${inputs.rentGrowthRate || 4}%/yr`} />
        </div>
      </div>

      {/* Airbnb Summary (if enabled) */}
      {showAirbnb && (
        <div className="p-4 bg-theme-card rounded-xl border border-cyan-500/30">
          <h4 className="text-sm font-semibold text-cyan-400 mb-3">Short-Term (Airbnb) Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="ADR"
              value={formatValue(inputs.shortTermRental?.averageDailyRate || 0)}
              sub={`Growth: ${inputs.adrGrowthRate || 3}%/yr`}
            />
            <MetricCard
              label="Occupancy"
              value={`${inputs.shortTermRental?.occupancyPercent || 0}%`}
              sub="Annual average"
            />
            <MetricCard
              label="Gross Revenue Y1"
              value={year1?.airbnbGrossRevenue ? formatValue(year1.airbnbGrossRevenue) : '-'}
              sub="ADR × Occ × 365"
            />
            <MetricCard
              label="Net Income Y1"
              value={year1?.airbnbNetIncome ? formatValue(year1.airbnbNetIncome) : '-'}
              sub={`After ${(inputs.shortTermRental?.operatingExpensePercent || 0) + (inputs.shortTermRental?.managementFeePercent || 0)}% costs`}
            />
          </div>
        </div>
      )}

      {/* Year-by-Year Comparison Table */}
      <div className="p-4 bg-theme-card rounded-xl border border-theme-border overflow-x-auto">
        <h4 className="text-sm font-semibold text-theme-text mb-3">
          {showAirbnb ? 'Long-Term vs Short-Term Comparison' : '10-Year Rental Projection'}
        </h4>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-theme-border">
              <th className="text-left py-2 text-theme-text-muted font-medium">Year</th>
              <th className="text-right py-2 text-theme-text-muted font-medium">Gross Rent</th>
              <th className="text-right py-2 text-theme-text-muted font-medium">Service Charges</th>
              <th className="text-right py-2 text-theme-text-muted font-medium">Net Rent (LT)</th>
              {showAirbnb && (
                <>
                  <th className="text-right py-2 text-cyan-400 font-medium">Airbnb Net</th>
                  <th className="text-right py-2 text-theme-text-muted font-medium">Winner</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rentalYears.map((p, i) => {
              const ltNet = p.netRent || 0;
              const stNet = p.airbnbNetIncome || 0;
              const winner = showAirbnb ? (stNet > ltNet ? 'ST' : ltNet > stNet ? 'LT' : 'Tie') : null;

              return (
                <tr key={i} className="border-b border-theme-border/50 hover:bg-theme-bg/30">
                  <td className="py-2 text-theme-text font-mono">{p.year}</td>
                  <td className="py-2 text-right text-theme-text font-mono">{formatValue(p.annualRent || 0)}</td>
                  <td className="py-2 text-right text-theme-text-muted font-mono">{formatValue(p.serviceCharges || 0)}</td>
                  <td className="py-2 text-right text-green-400 font-mono">{formatValue(ltNet)}</td>
                  {showAirbnb && (
                    <>
                      <td className="py-2 text-right text-cyan-400 font-mono">{formatValue(stNet)}</td>
                      <td className="py-2 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          winner === 'ST' ? 'bg-cyan-500/20 text-cyan-400' :
                          winner === 'LT' ? 'bg-green-500/20 text-green-400' :
                          'bg-theme-bg text-theme-text-muted'
                        }`}>
                          {winner}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
          {rentalYears.length > 0 && (
            <tfoot>
              <tr className="border-t border-theme-border font-semibold">
                <td className="py-2 text-theme-text">Total</td>
                <td className="py-2 text-right text-theme-text font-mono">
                  {formatValue(rentalYears.reduce((s, p) => s + (p.annualRent || 0), 0))}
                </td>
                <td className="py-2 text-right text-theme-text-muted font-mono">
                  {formatValue(rentalYears.reduce((s, p) => s + (p.serviceCharges || 0), 0))}
                </td>
                <td className="py-2 text-right text-green-400 font-mono">
                  {formatValue(rentalYears.reduce((s, p) => s + (p.netRent || 0), 0))}
                </td>
                {showAirbnb && (
                  <>
                    <td className="py-2 text-right text-cyan-400 font-mono">
                      {formatValue(rentalYears.reduce((s, p) => s + (p.airbnbNetIncome || 0), 0))}
                    </td>
                    <td />
                  </>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {!showAirbnb && (
        <div className="p-3 bg-theme-bg/50 rounded-xl text-center">
          <p className="text-xs text-theme-text-muted">
            Enable "Airbnb Comparison" in the configurator to see short-term vs long-term analysis
          </p>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="text-center">
    <div className="text-[10px] text-theme-text-muted uppercase">{label}</div>
    <div className="text-sm font-mono font-semibold text-theme-accent mt-1">{value}</div>
    <div className="text-[10px] text-theme-text-muted">{sub}</div>
  </div>
);
