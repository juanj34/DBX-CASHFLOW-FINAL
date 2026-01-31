import { useState, useMemo, useCallback } from 'react';
import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '@/components/roi/useMortgageCalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { PropertyHeroCard } from '@/components/roi/PropertyHeroCard';
import { SnapshotOverviewCards } from './SnapshotOverviewCards';
import { CompactPaymentTable } from './CompactPaymentTable';
import { CompactRentCard } from './CompactRentCard';
import { CompactMortgageCard } from './CompactMortgageCard';
import { CompactPostHandoverCard } from './CompactPostHandoverCard';
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
  setCurrency?: (currency: Currency) => void;
  language: 'en' | 'es';
  setLanguage?: (language: 'en' | 'es') => void;
  rate: number;
  // Snapshot title (editable headline)
  snapshotTitle?: string | null;
  onSnapshotTitleChange?: (title: string) => void;
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
  snapshotTitle,
  onSnapshotTitleChange,
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

  // Determine if we have a long payment plan (triggers adaptive 2-column layout)
  const isLongPaymentPlan = useMemo(() => {
    const payments = inputs.additionalPayments || [];
    return payments.length > 12;
  }, [inputs.additionalPayments]);

  // Check visibility conditions for cards
  const showRent = inputs.rentalYieldPercent > 0;
  const showExits = inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0 && calculations.basePrice > 0;
  const showPostHandover = inputs.hasPostHandoverPlan;
  const showMortgage = mortgageInputs.enabled;

  // Count visible cards and generate dynamic grid class
  const visibleCardCount = [showRent, showExits, showPostHandover, showMortgage].filter(Boolean).length;
  const cardGridClass = useMemo(() => {
    switch (visibleCardCount) {
      case 1: return 'grid grid-cols-1 gap-3';
      case 2: return 'grid grid-cols-1 md:grid-cols-2 gap-3';
      case 3: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3';
      case 4: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3';
      default: return 'grid grid-cols-1 gap-3';
    }
  }, [visibleCardCount]);

  // Determine column count for payment table (3 columns for very long plans)
  const paymentColumnCount = useMemo(() => {
    const payments = inputs.additionalPayments || [];
    if (payments.length >= 21) return 3;
    if (payments.length > 12) return 2;
    return 2;
  }, [inputs.additionalPayments]);

  return (
    <div className="min-h-full flex flex-col bg-theme-bg max-w-[1600px] mx-auto w-full">
      {/* Hero - fixed height */}
      <div className="flex-shrink-0 p-4 pb-0">
        <PropertyHeroCard
          data={clientInfo}
          heroImageUrl={quoteImages.heroImageUrl}
          buildingRenderUrl={quoteImages.buildingRenderUrl}
          readOnly={!onSnapshotTitleChange}
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
          snapshotTitle={snapshotTitle}
          onSnapshotTitleChange={onSnapshotTitleChange}
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

      {/* Main content - flows naturally with single scroll */}
      <div className="flex-1 px-4 pb-4" data-export-layout="expand">
        {isLongPaymentPlan ? (
          /* STACKED LAYOUT for long payment plans: Payment full width, then cards in horizontal grid */
          <div className="flex flex-col gap-4">
            {/* Payment Table - Full Width with internal 2-column layout */}
            <CompactPaymentTable
              inputs={inputs}
              clientInfo={clientInfo}
              valueDifferentiators={valueDifferentiators}
              appreciationBonus={appreciationBonus}
              currency={currency}
              rate={rate}
              totalMonths={calculations.totalMonths}
              twoColumnMode="auto"
            />
            
            {/* Insight Cards - dynamic grid based on visible card count */}
            <div className={cardGridClass}>
              {/* Rent Card with Wealth Projection Button */}
              {showRent && (
                <CompactRentCard
                  inputs={inputs}
                  currency={currency}
                  rate={rate}
                  onViewWealthProjection={() => setWealthModalOpen(true)}
                />
              )}
              
              {/* All Exits Card */}
              {showExits && (
                <CompactAllExitsCard
                  inputs={inputs}
                  calculations={calculations}
                  exitScenarios={exitScenarios}
                  currency={currency}
                  rate={rate}
                  onClick={() => setExitModalOpen(true)}
                />
              )}
              
              {/* Post-Handover Coverage Card */}
              {showPostHandover && (
                <CompactPostHandoverCard
                  inputs={inputs}
                  monthlyRent={monthlyRent}
                  rentGrowthRate={inputs.rentGrowthRate || 4}
                  currency={currency}
                  rate={rate}
                />
              )}
              
              {/* Mortgage Card */}
              {showMortgage && (
                <CompactMortgageCard
                  mortgageInputs={mortgageInputs}
                  mortgageAnalysis={mortgageAnalysis}
                  monthlyRent={monthlyRent}
                  rentGrowthRate={inputs.rentGrowthRate || 4}
                  currency={currency}
                  rate={rate}
                />
              )}
            </div>
          </div>
        ) : (
          /* ORIGINAL LAYOUT for short payment plans: 2 columns side by side */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Payment */}
            <div className="flex flex-col">
              <CompactPaymentTable
                inputs={inputs}
                clientInfo={clientInfo}
                valueDifferentiators={valueDifferentiators}
                appreciationBonus={appreciationBonus}
                currency={currency}
                rate={rate}
                totalMonths={calculations.totalMonths}
                twoColumnMode="never"
              />
            </div>

            {/* Right Column: Rent + Exits + Mortgage */}
            <div className="flex flex-col gap-3">
              {/* Rent Card with Wealth Projection Button */}
              {showRent && (
                <CompactRentCard
                  inputs={inputs}
                  currency={currency}
                  rate={rate}
                  onViewWealthProjection={() => setWealthModalOpen(true)}
                />
              )}
              
              {/* All Exits Card */}
              {showExits && (
                <CompactAllExitsCard
                  inputs={inputs}
                  calculations={calculations}
                  exitScenarios={exitScenarios}
                  currency={currency}
                  rate={rate}
                  onClick={() => setExitModalOpen(true)}
                />
              )}
              
              {/* Post-Handover Coverage Card */}
              {showPostHandover && (
                <CompactPostHandoverCard
                  inputs={inputs}
                  monthlyRent={monthlyRent}
                  rentGrowthRate={inputs.rentGrowthRate || 4}
                  currency={currency}
                  rate={rate}
                />
              )}
              
              {/* Mortgage Card */}
              {showMortgage && (
                <CompactMortgageCard
                  mortgageInputs={mortgageInputs}
                  mortgageAnalysis={mortgageAnalysis}
                  monthlyRent={monthlyRent}
                  rentGrowthRate={inputs.rentGrowthRate || 4}
                  currency={currency}
                  rate={rate}
                />
              )}
            </div>
          </div>
        )}
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
        handoverQuarter={inputs.handoverQuarter}
        handoverYear={inputs.handoverYear}
        bookingMonth={inputs.bookingMonth}
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
