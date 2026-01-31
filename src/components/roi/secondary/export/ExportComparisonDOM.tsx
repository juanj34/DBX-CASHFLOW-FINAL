import { OIInputs, OIYearlyProjection } from '@/components/roi/useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '@/components/roi/useMortgageCalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { SecondaryInputs, SecondaryCalculations, ComparisonMetrics, SecondaryYearlyProjection } from '../types';

import { ExportComparisonHeader } from './ExportComparisonHeader';
import { ExportComparisonFooter } from './ExportComparisonFooter';
import { ExportKeyInsights } from './ExportKeyInsights';
import { ExportWealthTable } from './ExportWealthTable';
import { ExportWealthChart } from './ExportWealthChart';
import { ExportExitScenarios } from './ExportExitScenarios';
import { ExportOutOfPocket } from './ExportOutOfPocket';
import { ExportMortgageCoverage } from './ExportMortgageCoverage';
import { ExportRentalComparison } from './ExportRentalComparison';
import { ExportVerdict } from './ExportVerdict';

export interface ExportComparisonDOMProps {
  // Off-Plan data
  offPlanInputs: OIInputs;
  offPlanProjectName: string;
  offPlanProjections: OIYearlyProjection[];
  offPlanBasePrice: number;
  offPlanTotalMonths: number;
  offPlanEntryCosts: number;
  offPlanTotalCapitalAtHandover: number;
  
  // Secondary data
  secondaryInputs: SecondaryInputs;
  secondaryCalcs: SecondaryCalculations;
  
  // Comparison metrics
  metrics: ComparisonMetrics;
  handoverYearIndex: number;
  exitMonths: number[];
  rentalMode: 'long-term' | 'airbnb';
  
  // Pre-calculated values (for consistency with live view)
  offPlanTotalAssets10Y: number;
  secondaryTotalAssets10Y: number;
  offPlanPropertyValue10Y: number;
  secondaryPropertyValue10Y: number;
  offPlanMonthlyRent5Y: number;
  secondaryMonthlyRent5Y: number;
  appreciationDuringConstruction: number;
  secondaryRentDuringConstruction: number;
  
  // Rental at handover
  offPlanMonthlyRentAtHandover: number;
  secondaryMonthlyRentAtHandover: number;
  
  // Mortgage (for secondary)
  showMortgageCoverage: boolean;
  secondaryMonthlyRent: number;
  secondaryMonthlyMortgage: number;
  secondaryNetCashflow: number;
  secondaryCoveragePercent: number;
  secondaryLoanAmount: number;
  secondaryPrincipalPaid10Y: number;
  
  // Display settings
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

/**
 * ExportComparisonDOM - A3 Landscape static export component (1587 x auto px)
 * 
 * This component is designed specifically for PNG/PDF export:
 * - Fixed width: 1587px (A3 landscape @ 96dpi)
 * - No animations, transitions, or framer-motion
 * - No responsive breakpoints
 * - No hover effects or interactivity
 * - All styles are inline or static classes
 * - Uses CSS variables for theme consistency
 */
export const ExportComparisonDOM = ({
  offPlanInputs,
  offPlanProjectName,
  offPlanProjections,
  offPlanBasePrice,
  offPlanTotalMonths,
  offPlanEntryCosts,
  offPlanTotalCapitalAtHandover,
  secondaryInputs,
  secondaryCalcs,
  metrics,
  handoverYearIndex,
  exitMonths,
  rentalMode,
  offPlanTotalAssets10Y,
  secondaryTotalAssets10Y,
  offPlanPropertyValue10Y,
  secondaryPropertyValue10Y,
  offPlanMonthlyRent5Y,
  secondaryMonthlyRent5Y,
  appreciationDuringConstruction,
  secondaryRentDuringConstruction,
  offPlanMonthlyRentAtHandover,
  secondaryMonthlyRentAtHandover,
  showMortgageCoverage,
  secondaryMonthlyRent,
  secondaryMonthlyMortgage,
  secondaryNetCashflow,
  secondaryCoveragePercent,
  secondaryLoanAmount,
  secondaryPrincipalPaid10Y,
  currency,
  rate,
  language,
}: ExportComparisonDOMProps) => {
  const handoverMonths = handoverYearIndex * 12;
  const filteredExitMonths = exitMonths.filter(m => m > handoverMonths);

  return (
    <div 
      style={{
        width: '1587px', // A3 landscape @ 96dpi
        minHeight: '1123px', // A3 landscape height
        backgroundColor: 'hsl(var(--theme-bg))',
        color: 'hsl(var(--theme-text))',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <ExportComparisonHeader
        offPlanProjectName={offPlanProjectName}
        offPlanBasePrice={offPlanBasePrice}
        secondaryPropertyName={secondaryInputs.propertyName}
        secondaryPurchasePrice={secondaryInputs.purchasePrice}
        currency={currency}
        rate={rate}
        language={language}
      />

      {/* Key Insights (4 Cards) */}
      <ExportKeyInsights
        offPlanTotalAssets10Y={offPlanTotalAssets10Y}
        secondaryTotalAssets10Y={secondaryTotalAssets10Y}
        offPlanPropertyValue10Y={offPlanPropertyValue10Y}
        secondaryPropertyValue10Y={secondaryPropertyValue10Y}
        offPlanTotalCapital={offPlanTotalCapitalAtHandover}
        secondaryCapitalDay1={metrics.secondaryCapitalDay1}
        offPlanMonthlyRent5Y={offPlanMonthlyRent5Y}
        secondaryMonthlyRent5Y={secondaryMonthlyRent5Y}
        appreciationDuringConstruction={appreciationDuringConstruction}
        secondaryRentDuringConstruction={secondaryRentDuringConstruction}
        currency={currency}
        rate={rate}
        language={language}
      />

      {/* Main Content - 2 Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Left Column: Wealth Table */}
        <ExportWealthTable
          offPlanProjections={offPlanProjections}
          secondaryProjections={secondaryCalcs.yearlyProjections}
          handoverYearIndex={handoverYearIndex}
          rentalMode={rentalMode}
          offPlanBasePrice={offPlanBasePrice}
          secondaryPurchasePrice={secondaryInputs.purchasePrice}
          language={language}
        />

        {/* Right Column: Wealth Chart */}
        <ExportWealthChart
          offPlanProjections={offPlanProjections}
          secondaryProjections={secondaryCalcs.yearlyProjections}
          handoverYearIndex={handoverYearIndex}
          showAirbnb={rentalMode === 'airbnb'}
          language={language}
        />
      </div>

      {/* Exit Scenarios */}
      {filteredExitMonths.length > 0 && (
        <ExportExitScenarios
          exitMonths={filteredExitMonths}
          offPlanInputs={offPlanInputs}
          offPlanBasePrice={offPlanBasePrice}
          offPlanTotalMonths={offPlanTotalMonths}
          offPlanEntryCosts={offPlanEntryCosts}
          secondaryPurchasePrice={secondaryInputs.purchasePrice}
          secondaryAppreciationRate={secondaryInputs.appreciationRate}
          currency={currency}
          rate={rate}
          language={language}
        />
      )}

      {/* Bottom Row - 2 Column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Out of Pocket */}
        <ExportOutOfPocket
          offPlanCapitalDuringConstruction={offPlanTotalCapitalAtHandover}
          monthsWithoutIncome={handoverYearIndex * 12}
          appreciationDuringConstruction={appreciationDuringConstruction}
          secondaryCapitalDay1={secondaryCalcs.totalCapitalDay1}
          secondaryPurchasePrice={secondaryInputs.purchasePrice}
          currency={currency}
          rate={rate}
          language={language}
        />

        {/* Rental Comparison at Handover */}
        <ExportRentalComparison
          offPlanMonthlyRent={offPlanMonthlyRentAtHandover}
          secondaryMonthlyRent={secondaryMonthlyRentAtHandover}
          handoverYear={handoverYearIndex}
          currency={currency}
          rate={rate}
          language={language}
        />
      </div>

      {/* Mortgage Coverage (if applicable) */}
      {showMortgageCoverage && (
        <div style={{ marginBottom: '16px' }}>
          <ExportMortgageCoverage
            monthlyRent={secondaryMonthlyRent}
            monthlyMortgage={secondaryMonthlyMortgage}
            netCashflow={secondaryNetCashflow}
            coveragePercent={secondaryCoveragePercent}
            loanAmount={secondaryLoanAmount}
            principalPaidYear10={secondaryPrincipalPaid10Y}
            currency={currency}
            rate={rate}
            language={language}
          />
        </div>
      )}

      {/* Verdict */}
      <ExportVerdict
        metrics={metrics}
        offPlanProjectName={offPlanProjectName}
        language={language}
      />

      {/* Footer */}
      <ExportComparisonFooter language={language} />
    </div>
  );
};
