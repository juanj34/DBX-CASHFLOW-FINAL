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
import { CompactAllExitsCard } from './CompactAllExitsCard';
import { WealthProjectionModal } from './WealthProjectionModal';
import { FloorPlanLightbox } from '@/components/roi/FloorPlanLightbox';
import { ExitChartModal } from './ExitChartModal';

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
  const [wealthModalOpen, setWealthModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
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

  // Determine construction years for handover
  const constructionYears = Math.ceil(calculations.totalMonths / 12);
  const handoverYear = inputs.bookingYear + constructionYears;

  return (
    <div className="h-screen flex flex-col bg-theme-bg">
      {/* Hero - fixed height */}
      <div className="flex-shrink-0 p-4 pb-0">
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
      </div>

      {/* Overview Cards - fixed height */}
      <div className="flex-shrink-0 px-4 py-3">
        <SnapshotOverviewCards 
          inputs={inputs}
          calculations={calculations}
          currency={currency}
          rate={rate}
        />
      </div>

      {/* Main content - fills remaining space with scrolling */}
      <div className="flex-1 px-4 pb-4 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          {/* Left Column: Payment (with Value Differentiators integrated) */}
          <div className="flex flex-col">
            <CompactPaymentTable
              inputs={inputs}
              clientInfo={clientInfo}
              valueDifferentiators={valueDifferentiators}
              appreciationBonus={appreciationBonus}
              currency={currency}
              rate={rate}
              totalMonths={calculations.totalMonths}
            />
          </div>

          {/* Right Column: Rent + Exits + Mortgage */}
          <div className="flex flex-col gap-3">
            {/* Rent Card with Wealth Projection Button */}
            {inputs.rentalYieldPercent > 0 && (
              <CompactRentCard
                inputs={inputs}
                currency={currency}
                rate={rate}
                onViewWealthProjection={() => setWealthModalOpen(true)}
              />
            )}
            
            {/* All Exits Card - only show if exitStrategy is enabled */}
            {inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0 && (
              <CompactAllExitsCard
                inputs={inputs}
                calculations={calculations}
                exitScenarios={exitScenarios}
                currency={currency}
                rate={rate}
                onClick={() => setExitModalOpen(true)}
              />
            )}
            
            {/* Mortgage Card */}
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

      {/* Floor Plan Lightbox */}
      {quoteImages.floorPlanUrl && (
        <FloorPlanLightbox
          imageUrl={quoteImages.floorPlanUrl}
          open={floorPlanOpen}
          onOpenChange={setFloorPlanOpen}
        />
      )}

      {/* Wealth Projection Modal */}
      <WealthProjectionModal
        open={wealthModalOpen}
        onOpenChange={setWealthModalOpen}
        basePrice={basePrice}
        constructionMonths={calculations.totalMonths}
        constructionAppreciation={inputs.constructionAppreciation}
        growthAppreciation={inputs.growthAppreciation}
        matureAppreciation={inputs.matureAppreciation}
        growthPeriodYears={inputs.growthPeriodYears}
        bookingYear={inputs.bookingYear}
        rentalYieldPercent={inputs.rentalYieldPercent}
        rentGrowthRate={inputs.rentGrowthRate || 3}
        currency={currency}
        rate={rate}
      />

      {/* Exit Chart Modal */}
      <ExitChartModal
        open={exitModalOpen}
        onOpenChange={setExitModalOpen}
        inputs={inputs}
        exitScenarios={exitScenarios}
        totalMonths={calculations.totalMonths}
        basePrice={calculations.basePrice}
        totalEntryCosts={calculations.totalEntryCosts}
        currency={currency}
        rate={rate}
      />
    </div>
  );
};
