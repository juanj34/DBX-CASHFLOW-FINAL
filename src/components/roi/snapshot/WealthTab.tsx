import { useState } from "react";
import { LineChart, ChevronDown, ChevronUp, Table, DollarSign } from "lucide-react";
import { RentSnapshot } from "@/components/roi/RentSnapshot";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { WealthSummaryCard } from "@/components/roi/WealthSummaryCard";
import { ProjectionDisclaimer } from "@/components/roi/ProjectionDisclaimer";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";
import { useLanguage } from '@/contexts/LanguageContext';

interface WealthTabProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
  unitSizeSqf?: number;
}

export const WealthTab = ({ inputs, calculations, currency, rate, unitSizeSqf }: WealthTabProps) => {
  const { t } = useLanguage();
  const totalCapitalInvested = calculations.basePrice + calculations.totalEntryCosts;
  const [showDetailedTable, setShowDetailedTable] = useState(false);

  // First full rental year (after construction + handover)
  const firstRentalYear = calculations.yearlyProjections.find(p => !p.isConstruction && !p.isHandover && p.netRent && p.netRent > 0);
  const firstYearNetRent = firstRentalYear?.netRent || 0;
  const firstYearMonthlyRent = firstYearNetRent / 12;
  const firstYearGrossRent = firstRentalYear?.annualRent || 0;
  const firstYearServiceCharges = firstRentalYear?.serviceCharges || 0;

  // Totals for wealth summary
  const totalRent = calculations.yearlyProjections.reduce((sum, p) => sum + (p.netRent || 0), 0);
  const lastProjection = calculations.yearlyProjections[calculations.yearlyProjections.length - 1];

  // Rental years for table (limit to 7)
  const rentalYears = calculations.yearlyProjections.filter(p =>
    !p.isConstruction && !p.isHandover && p.annualRent !== null && p.annualRent > 0
  ).slice(0, 7);

  const showAirbnb = inputs.showAirbnbComparison ?? false;
  const formatValue = (value: number) => formatCurrency(value, currency, rate);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LineChart className="w-4 h-4 text-theme-accent" />
          <h3 className="text-base font-semibold text-theme-text">{t('wealthCreationTitle')}</h3>
        </div>
        <p className="text-xs text-theme-text-muted">
          {t('wealthCreationSubtitle')}
        </p>
      </div>

      {/* Year 1 Rental Income — Hero Section */}
      {firstRentalYear && (
        <div className="p-4 bg-theme-card rounded-xl border border-theme-accent/30">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">
              {t('year1RentalIncomeLabel')} ({firstRentalYear.calendarYear})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-theme-text-muted uppercase">{t('monthlyNetLabel')}</div>
              <div className="text-xl font-mono font-bold text-theme-accent mt-1">
                {formatValue(firstYearMonthlyRent)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-theme-text-muted uppercase">{t('annualNetLabel')}</div>
              <div className="text-xl font-mono font-bold text-theme-positive mt-1">
                {formatValue(firstYearNetRent)}
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-theme-border flex items-center justify-between text-[10px] text-theme-text-muted">
            <span>{t('grossColon')} {formatValue(firstYearGrossRent)} - {t('serviceChargesColon')} {formatValue(firstYearServiceCharges)}</span>
            <span className="text-theme-text">{t('netYieldColon')} {inputs.basePrice > 0 ? ((firstYearNetRent / inputs.basePrice) * 100).toFixed(1) : '0.0'}%</span>
          </div>
        </div>
      )}

      {/* Rent Snapshot */}
      <RentSnapshot
        inputs={inputs}
        currency={currency}
        rate={rate}
        holdAnalysis={calculations.holdAnalysis}
      />

      {/* Wealth Summary */}
      {lastProjection && (
        <WealthSummaryCard
          propertyValueFinal={lastProjection.propertyValue ?? 0}
          cumulativeRentIncome={totalRent}
          airbnbCumulativeIncome={showAirbnb ? rentalYears.reduce((s, p) => s + (p.airbnbNetIncome || 0), 0) : undefined}
          initialInvestment={totalCapitalInvested}
          currency={currency}
          rate={rate}
          showAirbnbComparison={showAirbnb}
        />
      )}

      {/* 7-Year Rental Projection Table */}
      {rentalYears.length > 0 && (
        <div className="p-4 bg-theme-card rounded-xl border border-theme-border overflow-x-auto">
          <h4 className="text-sm font-semibold text-theme-text mb-3">
            {showAirbnb ? t('sevenYearLtVsSt') : t('sevenYearRentalProjection')}
          </h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-theme-border">
                <th className="text-left py-2 text-theme-text-muted font-medium">{t('yearColumn')}</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">{t('propertyValue')}</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">{t('grossRentHeader')}</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">{t('netRent')}</th>
                {showAirbnb && (
                  <>
                    <th className="text-right py-2 text-theme-accent font-medium">{t('airbnbNetHeader')}</th>
                    <th className="text-right py-2 text-theme-text-muted font-medium">{t('winnerHeader')}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rentalYears.map((p, i) => {
                const ltNet = p.netRent || 0;
                const stNet = p.airbnbNetIncome || 0;
                const winner = showAirbnb ? (stNet > ltNet ? t('st') : ltNet > stNet ? t('lt') : t('tieLabel')) : null;

                return (
                  <tr key={i} className="border-b border-theme-border/50 hover:bg-theme-bg/30">
                    <td className="py-2 text-theme-text font-mono">{p.calendarYear || p.year}</td>
                    <td className="py-2 text-right text-theme-text font-mono">{formatValue(p.propertyValue || 0)}</td>
                    <td className="py-2 text-right text-theme-text font-mono">{formatValue(p.annualRent || 0)}</td>
                    <td className="py-2 text-right text-theme-positive font-mono">{formatValue(ltNet)}</td>
                    {showAirbnb && (
                      <>
                        <td className="py-2 text-right text-theme-accent font-mono">{formatValue(stNet)}</td>
                        <td className="py-2 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            winner === t('st') ? 'bg-theme-accent/20 text-theme-accent' :
                            winner === t('lt') ? 'bg-theme-positive/20 text-theme-positive' :
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
                  <td className="py-2 text-theme-text">{t('total')}</td>
                  <td className="py-2 text-right text-theme-text font-mono">—</td>
                  <td className="py-2 text-right text-theme-text font-mono">
                    {formatValue(rentalYears.reduce((s, p) => s + (p.annualRent || 0), 0))}
                  </td>
                  <td className="py-2 text-right text-theme-positive font-mono">
                    {formatValue(rentalYears.reduce((s, p) => s + (p.netRent || 0), 0))}
                  </td>
                  {showAirbnb && (
                    <>
                      <td className="py-2 text-right text-theme-accent font-mono">
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
      )}

      {/* Detailed Year-by-Year Projection Table (collapsible) */}
      <button
        onClick={() => setShowDetailedTable(!showDetailedTable)}
        className="w-full flex items-center justify-between p-3 bg-theme-card rounded-xl border border-theme-border hover:bg-theme-bg/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-theme-text-muted">
          <Table className="w-4 h-4" />
          <span className="text-sm font-medium">{t('yearByYearProjectionTable')}</span>
        </div>
        {showDetailedTable ? <ChevronUp className="w-4 h-4 text-theme-text-muted" /> : <ChevronDown className="w-4 h-4 text-theme-text-muted" />}
      </button>

      {showDetailedTable && (
        <OIYearlyProjectionTable
          projections={calculations.yearlyProjections}
          currency={currency}
          rate={rate}
          showAirbnbComparison={showAirbnb}
          unitSizeSqf={unitSizeSqf}
        />
      )}

      <ProjectionDisclaimer />
    </div>
  );
};
