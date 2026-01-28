import { OIInputs, OICalculations } from '../useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '../useMortgageCalculations';
import { Currency } from '../currencyUtils';
import { ClientUnitData } from '../ClientUnitInfo';
import { ExportHeader } from './ExportHeader';
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

  // Determine construction years for handover
  const constructionYears = Math.ceil(calculations.totalMonths / 12);

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
      <ExportHeader
        clientInfo={clientInfo}
        basePrice={basePrice}
        pricePerSqft={pricePerSqft}
        currency={currency}
        rate={rate}
        language={language}
      />

      {/* Overview Cards */}
      <div style={{ marginBottom: '16px' }}>
        <ExportOverviewCards
          inputs={inputs}
          calculations={calculations}
          currency={currency}
          rate={rate}
          language={language}
        />
      </div>

      {/* Main Content - 2 Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Left Column: Payment */}
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

        {/* Right Column: Rent + Exits + Mortgage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Rent Card */}
          {inputs.rentalYieldPercent > 0 && (
            <ExportRentCard
              inputs={inputs}
              currency={currency}
              rate={rate}
              language={language}
            />
          )}
          
          {/* Exit Scenarios */}
          {inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0 && (
            <ExportExitCards
              inputs={inputs}
              calculations={calculations}
              exitScenarios={exitScenarios}
              currency={currency}
              rate={rate}
              language={language}
            />
          )}
          
          {/* Post-Handover Coverage Card */}
          {inputs.hasPostHandoverPlan && (
            <ExportPostHandoverCard
              inputs={inputs}
              monthlyRent={monthlyRent}
              currency={currency}
              rate={rate}
              language={language}
            />
          )}
          
          {/* Mortgage Card */}
          {mortgageInputs.enabled && (
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

      {/* Wealth Projection Timeline - Full Width */}
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
      />
    </div>
  );
};
