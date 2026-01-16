import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '@/components/roi/useMortgageCalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { PropertyHeroCard } from '@/components/roi/PropertyHeroCard';
import { InvestmentSnapshot } from '@/components/roi/InvestmentSnapshot';
import { SnapshotExitCards } from './SnapshotExitCards';
import { PaymentBreakdown } from '@/components/roi/PaymentBreakdown';
import { RentSnapshot } from '@/components/roi/RentSnapshot';
import { MortgageBreakdown } from '@/components/roi/MortgageBreakdown';

interface SnapshotContentProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientUnitData;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  quoteImages: {
    heroImageUrl: string | null;
    floorPlanUrl: string | null;
    buildingRenderUrl?: string | null;
  };
  currency: Currency;
  rate: number;
}

export const SnapshotContent = ({
  inputs,
  calculations,
  clientInfo,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  quoteImages,
  currency,
  rate,
}: SnapshotContentProps) => {
  const basePrice = calculations.basePrice;

  // Calculate rent values for mortgage breakdown
  const grossAnnualRent = basePrice * (inputs.rentalYieldPercent / 100);
  const annualServiceCharges = (clientInfo.unitSizeSqf || 0) * (inputs.serviceChargePerSqft || 18);
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const monthlyLongTermRent = netAnnualRent / 12;
  const monthlyServiceCharges = annualServiceCharges / 12;

  // Short-term rental calculations for mortgage comparison
  const adrValue = inputs.shortTermRental?.averageDailyRate || 800;
  const occupancyPercent = inputs.shortTermRental?.occupancyPercent || 70;
  const operatingExpensePercent = inputs.shortTermRental?.operatingExpensePercent || 25;
  const managementFeePercent = inputs.shortTermRental?.managementFeePercent || 15;
  const grossAirbnbAnnual = adrValue * 365 * (occupancyPercent / 100);
  const totalExpensePercent = operatingExpensePercent + managementFeePercent;
  const airbnbOperatingExpenses = grossAirbnbAnnual * (totalExpensePercent / 100);
  const netAirbnbAnnual = grossAirbnbAnnual - airbnbOperatingExpenses - annualServiceCharges;
  const monthlyAirbnbNet = netAirbnbAnnual / 12;

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* PropertyHeroCard - Same as Cashflow view */}
      <PropertyHeroCard
        data={clientInfo}
        heroImageUrl={quoteImages.heroImageUrl}
        buildingRenderUrl={quoteImages.buildingRenderUrl}
        readOnly={true}
      />

      {/* Row 1: Investment Snapshot + Compact Exit Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InvestmentSnapshot
          inputs={inputs}
          currency={currency}
          totalMonths={calculations.totalMonths}
          totalEntryCosts={calculations.totalEntryCosts}
          rate={rate}
          holdAnalysis={calculations.holdAnalysis}
          unitSizeSqf={clientInfo.unitSizeSqf}
        />
        <SnapshotExitCards
          inputs={inputs}
          exitScenarios={exitScenarios}
          basePrice={basePrice}
          totalMonths={calculations.totalMonths}
          totalEntryCosts={calculations.totalEntryCosts}
          currency={currency}
          rate={rate}
        />
      </div>

      {/* Payment Breakdown - Full Width, Compact Mode */}
      <PaymentBreakdown
        inputs={inputs}
        currency={currency}
        totalMonths={calculations.totalMonths}
        rate={rate}
        unitSizeSqf={clientInfo.unitSizeSqf}
        clientInfo={clientInfo}
        compact={true}
      />

      {/* Rent Analysis - Full Width */}
      {inputs.rentalYieldPercent > 0 && (
        <RentSnapshot
          inputs={inputs}
          currency={currency}
          rate={rate}
          holdAnalysis={calculations.holdAnalysis}
        />
      )}

      {/* Mortgage - Full Width (if enabled) */}
      {mortgageInputs.enabled && (
        <MortgageBreakdown
          mortgageInputs={mortgageInputs}
          mortgageAnalysis={mortgageAnalysis}
          basePrice={basePrice}
          currency={currency}
          rate={rate}
          preHandoverPercent={inputs.preHandoverPercent}
          monthlyLongTermRent={monthlyLongTermRent}
          monthlyServiceCharges={monthlyServiceCharges}
          monthlyAirbnbNet={inputs.showAirbnbComparison ? monthlyAirbnbNet : undefined}
          showAirbnbComparison={inputs.showAirbnbComparison}
        />
      )}
    </div>
  );
};
