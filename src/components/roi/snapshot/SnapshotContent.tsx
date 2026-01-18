import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '@/components/roi/useMortgageCalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { PropertyHeroCard } from '@/components/roi/PropertyHeroCard';
import { SnapshotOverviewCards } from './SnapshotOverviewCards';
import { CompactPaymentTable } from './CompactPaymentTable';
import { CompactRentCard } from './CompactRentCard';
import { CompactMortgageCard } from './CompactMortgageCard';
import { SnapshotToolbar } from './SnapshotToolbar';

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
  setCurrency: (currency: Currency) => void;
  language: 'en' | 'es';
  setLanguage: (language: 'en' | 'es') => void;
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
  setCurrency,
  language,
  setLanguage,
  rate,
}: SnapshotContentProps) => {
  const basePrice = calculations.basePrice;

  // Calculate price per sqft
  const pricePerSqft = clientInfo.unitSizeSqf > 0 ? basePrice / clientInfo.unitSizeSqf : 0;

  // Calculate monthly rent for mortgage card
  const grossAnnualRent = basePrice * (inputs.rentalYieldPercent / 100);
  const annualServiceCharges = (clientInfo.unitSizeSqf || 0) * (inputs.serviceChargePerSqft || 18);
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const monthlyRent = netAnnualRent / 12;

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4 animate-fade-in">
      {/* Toolbar with Price, Currency, Language toggles */}
      <SnapshotToolbar
        basePrice={basePrice}
        pricePerSqft={pricePerSqft}
        currency={currency}
        setCurrency={setCurrency}
        language={language}
        setLanguage={setLanguage}
        rate={rate}
      />

      {/* Compact Hero - Just client/project info */}
      <PropertyHeroCard
        data={clientInfo}
        heroImageUrl={quoteImages.heroImageUrl}
        buildingRenderUrl={quoteImages.buildingRenderUrl}
        readOnly={true}
      />

      {/* 4 Overview Cards - Full Width Row */}
      <SnapshotOverviewCards 
        inputs={inputs}
        calculations={calculations}
        exitScenarios={exitScenarios}
        currency={currency}
        rate={rate}
      />

      {/* 2-Column Layout: Payment Left, Rent/Mortgage Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Payment Breakdown (compact table) */}
        <CompactPaymentTable
          inputs={inputs}
          currency={currency}
          rate={rate}
          totalMonths={calculations.totalMonths}
        />

        {/* Right: Rent + Mortgage stacked */}
        <div className="space-y-4">
          {inputs.rentalYieldPercent > 0 && (
            <CompactRentCard
              inputs={inputs}
              currency={currency}
              rate={rate}
            />
          )}
          
          {mortgageInputs.enabled && (
            <CompactMortgageCard
              mortgageInputs={mortgageInputs}
              mortgageAnalysis={mortgageAnalysis}
              monthlyRent={monthlyRent}
              currency={currency}
              rate={rate}
            />
          )}
        </div>
      </div>
    </div>
  );
};
