import { Building2 } from "lucide-react";
import { MortgageBreakdown } from "@/components/roi/MortgageBreakdown";
import { MortgageInputs, MortgageAnalysis } from "@/components/roi/useMortgageCalculations";
import { OICalculations, OIInputs } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";
import { useLanguage } from '@/contexts/LanguageContext';

interface MortgageTabProps {
  inputs: OIInputs;
  calculations: OICalculations;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  currency: Currency;
  rate: number;
}

export const MortgageTab = ({
  inputs,
  calculations,
  mortgageInputs,
  mortgageAnalysis,
  currency,
  rate,
}: MortgageTabProps) => {
  const { t } = useLanguage();

  // Find first full rental year for rent comparison
  const firstRentalYear = calculations.yearlyProjections.find(p =>
    !p.isConstruction && !p.isHandover && p.annualRent !== null && p.annualRent > 0
  );

  const fullAnnualRent = firstRentalYear?.annualRent || (inputs.basePrice * inputs.rentalYieldPercent / 100);
  const monthlyLongTermRent = fullAnnualRent / 12;
  const monthlyServiceCharges = (firstRentalYear?.serviceCharges || 0) / 12;
  const fullAnnualAirbnbNet = firstRentalYear?.airbnbNetIncome || 0;
  const monthlyAirbnbNet = fullAnnualAirbnbNet / 12;

  // Year 5 projections for growth comparison
  const year5RentalYear = (firstRentalYear?.year || 0) + 4;
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
    if (ratio >= 1.2) return 'text-theme-positive bg-theme-positive/10';
    if (ratio >= 0.8) return 'text-theme-accent bg-theme-accent/10';
    return 'text-theme-negative bg-theme-negative/10';
  };

  const getCoverageTextColor = (ratio: number) => {
    if (ratio >= 1.2) return 'text-theme-positive';
    if (ratio >= 0.8) return 'text-theme-accent';
    return 'text-theme-negative';
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-theme-accent" />
          <h3 className="text-base font-semibold text-theme-text">{t('mortgageAnalysis')}</h3>
        </div>
        <p className="text-xs text-theme-text-muted">
          {t('mortgageTabSubtitle')}
        </p>
      </div>

      {/* Coverage Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-theme-card rounded-xl border border-theme-border text-center">
          <div className="text-[10px] text-theme-text-muted uppercase">{t('monthlyMortgageLabel')}</div>
          <div className="text-sm font-mono font-semibold text-theme-negative mt-1">
            {formatCurrency(monthlyMortgage, currency, rate)}
          </div>
        </div>
        <div className="p-3 bg-theme-card rounded-xl border border-theme-border text-center">
          <div className="text-[10px] text-theme-text-muted uppercase">{t('netMonthlyRent')}</div>
          <div className="text-sm font-mono font-semibold text-theme-positive mt-1">
            {formatCurrency(netMonthlyRent, currency, rate)}
          </div>
        </div>
        <div className={`p-3 rounded-xl border text-center ${getCoverageColor(coverageRatio)}`}>
          <div className="text-[10px] uppercase opacity-70">{t('coverageRatioLabel')}</div>
          <div className="text-lg font-mono font-bold mt-1">{coverageRatio.toFixed(2)}x</div>
          <div className="text-[10px] opacity-70">
            {coverageRatio >= 1.2 ? t('strongLabel') : coverageRatio >= 0.8 ? t('moderateLabel') : t('weakLabel')}
          </div>
        </div>
      </div>

      {/* Coverage Trend (compact) */}
      {coverageByYear.length > 1 && (
        <div className="p-3 bg-theme-card rounded-xl border border-theme-border flex items-center justify-between">
          <span className="text-xs text-theme-text-muted">{t('coverageTrendLabel')}</span>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono ${getCoverageTextColor(coverageByYear[0].ratio)}`}>
              {t('yearColumn')} {coverageByYear[0].year}: {coverageByYear[0].ratio.toFixed(2)}x
            </span>
            <span className="text-theme-text-muted text-xs">&rarr;</span>
            <span className={`text-xs font-mono ${getCoverageTextColor(coverageByYear[coverageByYear.length - 1].ratio)}`}>
              {t('yearColumn')} {coverageByYear[coverageByYear.length - 1].year}: {coverageByYear[coverageByYear.length - 1].ratio.toFixed(2)}x
            </span>
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
