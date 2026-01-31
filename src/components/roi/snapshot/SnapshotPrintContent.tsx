import { useMemo, useCallback } from 'react';
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
import { CompactPostHandoverCard } from './CompactPostHandoverCard';
import { WealthProjectionTimeline } from './WealthProjectionTimeline';

interface SnapshotPrintContentProps {
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
  language: 'en' | 'es';
  snapshotTitle?: string | null;
}

/**
 * Print-optimized snapshot layout for server-side screenshot capture.
 * Fixed 1920px width, vertical stacking, no interactive elements.
 */
export const SnapshotPrintContent = ({
  inputs,
  calculations,
  clientInfo,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  quoteImages,
  currency,
  rate,
  language,
  snapshotTitle,
}: SnapshotPrintContentProps) => {
  const basePrice = calculations.basePrice;
  const pricePerSqft = clientInfo.unitSizeSqf > 0 ? basePrice / clientInfo.unitSizeSqf : 0;

  // Calculate monthly rent for mortgage card
  const grossAnnualRent = basePrice * (inputs.rentalYieldPercent / 100);
  const annualServiceCharges = (clientInfo.unitSizeSqf || 0) * (inputs.serviceChargePerSqft || 18);
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const monthlyRent = netAnnualRent / 12;

  // Get value differentiators from inputs
  const valueDifferentiators = (inputs as any).valueDifferentiators || [];
  const appreciationBonus = (inputs as any).appreciationBonus || 0;

  // Determine if we have a long payment plan (use 2-column for print always)
  const isLongPaymentPlan = useMemo(() => {
    const payments = inputs.additionalPayments || [];
    return payments.length > 12;
  }, [inputs.additionalPayments]);

  // Check visibility conditions for cards
  const showRent = inputs.rentalYieldPercent > 0;
  const showExits = inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0;
  const showPostHandover = inputs.hasPostHandoverPlan;
  const showMortgage = mortgageInputs.enabled;

  // Count visible cards and generate dynamic grid class
  const visibleCardCount = [showRent, showExits, showPostHandover, showMortgage].filter(Boolean).length;
  const getCardGridStyle = useCallback(() => {
    // For print, use exact column count based on visible cards
    return { 
      display: 'grid', 
      gridTemplateColumns: `repeat(${visibleCardCount}, 1fr)`, 
      gap: '16px' 
    };
  }, [visibleCardCount]);

  return (
    <div 
      className="snapshot-print-content bg-theme-bg min-h-screen"
      style={{ width: '1920px' }}
    >
      {/* Hero Section */}
      <div className="p-6 pb-0">
        <PropertyHeroCard
          data={clientInfo}
          heroImageUrl={quoteImages.heroImageUrl}
          buildingRenderUrl={quoteImages.buildingRenderUrl}
          readOnly={true}
          showPriceInfo={true}
          basePrice={basePrice}
          pricePerSqft={pricePerSqft}
          currency={currency}
          setCurrency={() => {}}
          language={language}
          setLanguage={() => {}}
          rate={rate}
          floorPlanUrl={quoteImages.floorPlanUrl}
          onViewFloorPlan={() => {}}
        />
      </div>

      {/* Overview Cards */}
      <div className="px-6 py-4">
        <SnapshotOverviewCards 
          inputs={inputs}
          calculations={calculations}
          currency={currency}
          rate={rate}
        />
      </div>

      {/* Main Content - Adaptive Layout */}
      <div className="px-6 pb-4">
        {isLongPaymentPlan ? (
          /* STACKED LAYOUT for long payment plans */
          <div className="flex flex-col gap-4">
            {/* Payment Table - Full Width with 2-column */}
            <CompactPaymentTable
              inputs={inputs}
              clientInfo={clientInfo}
              valueDifferentiators={valueDifferentiators}
              appreciationBonus={appreciationBonus}
              currency={currency}
              rate={rate}
              totalMonths={calculations.totalMonths}
              twoColumnMode="always"
            />
            
            {/* Insight Cards - dynamic grid for print */}
            <div style={getCardGridStyle()}>
              {/* Rent Card */}
              {showRent && (
                <CompactRentCard
                  inputs={inputs}
                  currency={currency}
                  rate={rate}
                  onViewWealthProjection={() => {}}
                />
              )}
              
              {/* All Exits Card */}
              {inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0 && (
                <CompactAllExitsCard
                  inputs={inputs}
                  calculations={calculations}
                  exitScenarios={exitScenarios}
                  currency={currency}
                  rate={rate}
                  onClick={() => {}}
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
          /* ORIGINAL 2-COLUMN LAYOUT for short payment plans */
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column: Payment Breakdown */}
            <div>
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
            <div className="flex flex-col gap-4">
              {/* Rent Card */}
              {inputs.rentalYieldPercent > 0 && (
                <CompactRentCard
                  inputs={inputs}
                  currency={currency}
                  rate={rate}
                  onViewWealthProjection={() => {}}
                />
              )}
              
              {/* All Exits Card */}
              {inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0 && (
                <CompactAllExitsCard
                  inputs={inputs}
                  calculations={calculations}
                  exitScenarios={exitScenarios}
                  currency={currency}
                  rate={rate}
                  onClick={() => {}}
                />
              )}
              
              {/* Mortgage Card */}
              {mortgageInputs.enabled && (
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

      {/* Wealth Projection Timeline - Full Width */}
      <div className="px-6 pb-6">
        <WealthProjectionTimeline
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
  );
};
