import { useState } from 'react';
import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '@/components/roi/useMortgageCalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { PropertyHeroCard } from '@/components/roi/PropertyHeroCard';
import { SnapshotOverviewCards } from './SnapshotOverviewCards';
import { CompactPaymentTable } from './CompactPaymentTable';
import { CompactRentCard } from './CompactRentCard';
import { CompactMortgageCard } from './CompactMortgageCard';
import { ValueDifferentiatorsBadges } from './ValueDifferentiatorsBadges';
import { WealthProjectionChart } from './WealthProjectionChart';
import { FloorPlanLightbox } from '@/components/roi/FloorPlanLightbox';

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
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);
  const basePrice = calculations.basePrice;

  // Calculate price per sqft
  const pricePerSqft = clientInfo.unitSizeSqf > 0 ? basePrice / clientInfo.unitSizeSqf : 0;

  // Calculate monthly rent for mortgage card
  const grossAnnualRent = basePrice * (inputs.rentalYieldPercent / 100);
  const annualServiceCharges = (clientInfo.unitSizeSqf || 0) * (inputs.serviceChargePerSqft || 18);
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const monthlyRent = netAnnualRent / 12;

  // Get value differentiators from inputs
  const valueDifferentiators = (inputs as any).valueDifferentiators || [];
  const appreciationBonus = (inputs as any).appreciationBonus || 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-theme-bg">
      <div className="flex-1 overflow-auto p-4 space-y-4 animate-fade-in">
        {/* Hero with integrated Price, Currency, Language controls + View Project/Floor Plan buttons */}
        <PropertyHeroCard
          data={clientInfo}
          heroImageUrl={quoteImages.heroImageUrl}
          buildingRenderUrl={quoteImages.buildingRenderUrl}
          readOnly={true}
          showPriceInfo={true}
          basePrice={basePrice}
          pricePerSqft={pricePerSqft}
          currency={currency}
          setCurrency={setCurrency}
          language={language}
          setLanguage={setLanguage}
          rate={rate}
          floorPlanUrl={quoteImages.floorPlanUrl}
          onViewFloorPlan={() => setFloorPlanOpen(true)}
        />

        {/* 4 Overview Cards - Full Width Row */}
        <SnapshotOverviewCards 
          inputs={inputs}
          calculations={calculations}
          exitScenarios={exitScenarios}
          currency={currency}
          rate={rate}
        />

        {/* 2-Column Layout that fills remaining space */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Left Column: Payment + Value Differentiators */}
          <div className="flex flex-col gap-4">
            <CompactPaymentTable
              inputs={inputs}
              currency={currency}
              rate={rate}
              totalMonths={calculations.totalMonths}
            />
            
            {valueDifferentiators.length > 0 && (
              <ValueDifferentiatorsBadges
                differentiators={valueDifferentiators}
                appreciationBonus={appreciationBonus}
              />
            )}
          </div>

          {/* Right Column: Rent + Mortgage + Wealth Chart */}
          <div className="flex flex-col gap-4">
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

            {/* Wealth Projection Chart */}
            <WealthProjectionChart
              basePrice={basePrice}
              constructionMonths={calculations.totalMonths}
              constructionAppreciation={inputs.constructionAppreciation}
              growthAppreciation={inputs.growthAppreciation}
              matureAppreciation={inputs.matureAppreciation}
              growthPeriodYears={inputs.growthPeriodYears}
              bookingYear={inputs.bookingYear}
              currency={currency}
              rate={rate}
            />
          </div>
        </div>
      </div>

      {/* Floor Plan Lightbox */}
      {quoteImages.floorPlanUrl && (
        <FloorPlanLightbox
          imageUrl={quoteImages.floorPlanUrl}
          open={floorPlanOpen}
          onOpenChange={setFloorPlanOpen}
        />
      )}
    </div>
  );
};
