import { OIInputs, OICalculations } from '../useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '../useMortgageCalculations';
import { Currency } from '../currencyUtils';
import { ClientUnitData } from '../ClientUnitInfo';
import { ExportPropertyHero } from './ExportPropertyHero';
import { ExportOverviewCards } from './ExportOverviewCards';
import { ExportPaymentTable } from './ExportPaymentTable';
import { ExportExitCards } from './ExportExitCards';
import { ExportRentCard } from './ExportRentCard';
import { ExportMortgageCard } from './ExportMortgageCard';
import { ExportPostHandoverCard } from './ExportPostHandoverCard';
import { ExportWealthTimeline } from './ExportWealthTimeline';

export interface ExportSnapshotDOMProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientUnitData;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
  quoteImages?: {
    heroImageUrl: string | null;
    floorPlanUrl: string | null;
    buildingRenderUrl?: string | null;
  };
  snapshotTitle?: string | null;
}

/**
 * ExportSnapshotDOM - A3 Landscape static export component (1587 x auto px)
 * 
 * This component is designed specifically for PNG/PDF export:
 * - Fixed width: 1587px (A3 landscape @ 96dpi)
 * - No animations, transitions, or framer-motion
 * - No responsive breakpoints
 * - No hover effects or interactivity
 * - All styles are inline or static classes
 * - Uses CSS variables for theme consistency
 * 
 * IMPORTANT: This mirrors the live SnapshotContent.tsx layout exactly!
 */
export const ExportSnapshotDOM = ({
  inputs,
  calculations,
  clientInfo,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  currency,
  rate,
  language,
  quoteImages,
  snapshotTitle,
}: ExportSnapshotDOMProps) => {
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

  // Get hero image URL
  const heroImageUrl = quoteImages?.heroImageUrl || quoteImages?.buildingRenderUrl || null;

  // Check if long payment plan (>12 payments) - matches SnapshotContent logic
  const isLongPaymentPlan = (inputs.additionalPayments || []).length > 12;

  // Check visibility conditions for cards
  const showRent = inputs.rentalYieldPercent > 0;
  const showExits = inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0 && calculations.basePrice > 0;
  const showPostHandover = inputs.hasPostHandoverPlan;
  const showMortgage = mortgageInputs.enabled;

  // Count visible cards for dynamic grid
  const visibleCardCount = [showRent, showExits, showPostHandover, showMortgage].filter(Boolean).length;

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
      {/* Hero Section - Matches PropertyHeroCard */}
      <ExportPropertyHero
        clientInfo={clientInfo}
        heroImageUrl={heroImageUrl}
        basePrice={basePrice}
        pricePerSqft={pricePerSqft}
        currency={currency}
        rate={rate}
        language={language}
        snapshotTitle={snapshotTitle}
      />

      {/* Overview Cards - Matches SnapshotOverviewCards */}
      <div style={{ marginBottom: '16px' }}>
        <ExportOverviewCards
          inputs={inputs}
          calculations={calculations}
          currency={currency}
          rate={rate}
          language={language}
        />
      </div>

      {/* Main Content - Adaptive Layout based on payment plan length */}
      {isLongPaymentPlan ? (
        /* STACKED LAYOUT for long payment plans (>12 payments) */
        <div style={{ marginBottom: '16px' }}>
          {/* Payment Table - Full Width */}
          <div style={{ marginBottom: '16px' }}>
            <ExportPaymentTable
              inputs={inputs}
              clientInfo={clientInfo}
              valueDifferentiators={valueDifferentiators}
              appreciationBonus={appreciationBonus}
              currency={currency}
              rate={rate}
              totalMonths={calculations.totalMonths}
              language={language}
            />
          </div>
          
          {/* Insight Cards - Dynamic grid based on visible cards */}
          {visibleCardCount > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${visibleCardCount}, 1fr)`, gap: '12px' }}>
              {showRent && (
                <ExportRentCard
                  inputs={inputs}
                  currency={currency}
                  rate={rate}
                  language={language}
                />
              )}
              
              {showExits && (
                <ExportExitCards
                  inputs={inputs}
                  calculations={calculations}
                  exitScenarios={exitScenarios}
                  currency={currency}
                  rate={rate}
                  language={language}
                />
              )}
              
              {showPostHandover && (
                <ExportPostHandoverCard
                  inputs={inputs}
                  monthlyRent={monthlyRent}
                  currency={currency}
                  rate={rate}
                  language={language}
                />
              )}
              
              {showMortgage && (
                <ExportMortgageCard
                  mortgageInputs={mortgageInputs}
                  mortgageAnalysis={mortgageAnalysis}
                  monthlyRent={monthlyRent}
                  currency={currency}
                  rate={rate}
                  language={language}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        /* ORIGINAL 2-COLUMN LAYOUT for short payment plans */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Left Column: Payment (with Value Differentiators) */}
          <div>
            <ExportPaymentTable
              inputs={inputs}
              clientInfo={clientInfo}
              valueDifferentiators={valueDifferentiators}
              appreciationBonus={appreciationBonus}
              currency={currency}
              rate={rate}
              totalMonths={calculations.totalMonths}
              language={language}
            />
          </div>

          {/* Right Column: Rent + Exits + Post-Handover + Mortgage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Rent Card - only show if rentalYieldPercent > 0 */}
            {showRent && (
              <ExportRentCard
                inputs={inputs}
                currency={currency}
                rate={rate}
                language={language}
              />
            )}
            
            {/* Exit Scenarios - only show if enabled AND we have valid data */}
            {showExits && (
              <ExportExitCards
                inputs={inputs}
                calculations={calculations}
                exitScenarios={exitScenarios}
                currency={currency}
                rate={rate}
                language={language}
              />
            )}
            
            {/* Post-Handover Coverage Card - only show if hasPostHandoverPlan */}
            {showPostHandover && (
              <ExportPostHandoverCard
                inputs={inputs}
                monthlyRent={monthlyRent}
                currency={currency}
                rate={rate}
                language={language}
              />
            )}
            
            {/* Mortgage Card - only show if enabled */}
            {showMortgage && (
              <ExportMortgageCard
                mortgageInputs={mortgageInputs}
                mortgageAnalysis={mortgageAnalysis}
                monthlyRent={monthlyRent}
                currency={currency}
                rate={rate}
                language={language}
              />
            )}
          </div>
        </div>
      )}

      {/* Wealth Projection Timeline - Full Width (matches WealthProjectionTimeline) */}
      <ExportWealthTimeline
        basePrice={basePrice}
        constructionMonths={calculations.totalMonths}
        constructionAppreciation={inputs.constructionAppreciation}
        growthAppreciation={inputs.growthAppreciation}
        matureAppreciation={inputs.matureAppreciation}
        growthPeriodYears={inputs.growthPeriodYears}
        bookingYear={inputs.bookingYear}
        currency={currency}
        rate={rate}
        language={language}
        handoverQuarter={(inputs as any).handoverQuarter}
        handoverYear={(inputs as any).handoverYear}
        bookingMonth={(inputs as any).bookingMonth}
      />
    </div>
  );
};
