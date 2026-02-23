import { OIInputs, OICalculations } from '../useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '../useMortgageCalculations';
import { Currency } from '../currencyUtils';
import { ClientUnitData } from '../ClientUnitInfo';
import { ExportBrokerHeader } from './ExportBrokerHeader';
import { ExportPropertyHero } from './ExportPropertyHero';
import { ExportFooter } from './ExportFooter';
import { SnapshotOverviewCards } from '../snapshot/SnapshotOverviewCards';
import { CompactPaymentTable } from '../snapshot/CompactPaymentTable';
import { CompactRentCard } from '../snapshot/CompactRentCard';
import { CompactAllExitsCard } from '../snapshot/CompactAllExitsCard';
import { CompactPostHandoverCard } from '../snapshot/CompactPostHandoverCard';
import { CompactMortgageCard } from '../snapshot/CompactMortgageCard';
import { WealthProjectionTimeline } from '../snapshot/WealthProjectionTimeline';

interface BrokerInfo {
  fullName: string | null;
  avatarUrl: string | null;
  businessEmail: string | null;
}

export interface ExportSnapshotLayoutProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientUnitData;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  quoteImages: {
    heroImageUrl: string | null;
    floorPlanUrl: string | null;
  };
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
  brokerInfo?: BrokerInfo;
  snapshotTitle?: string | null;
}

/**
 * ExportSnapshotLayout - Full export-ready layout for PDF/PNG capture
 * 
 * This component mirrors SnapshotContent but is optimized for html2canvas:
 * - Fixed width: 1587px (A3 landscape @ 96dpi)
 * - No animations or transitions
 * - No hover effects or interactivity
 * - All conditional sections rendered statically
 * - Uses inline styles where needed for reliable capture
 */
export const ExportSnapshotLayout = ({
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
  brokerInfo,
  snapshotTitle,
}: ExportSnapshotLayoutProps) => {
  const basePrice = calculations.basePrice;
  const pricePerSqft = clientInfo.unitSizeSqf > 0 ? basePrice / clientInfo.unitSizeSqf : 0;
  
  // Calculate monthly rent for mortgage and post-handover cards
  const grossAnnualRent = basePrice * (inputs.rentalYieldPercent / 100);
  const annualServiceCharges = (clientInfo.unitSizeSqf || 0) * (inputs.serviceChargePerSqft || 18);
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const monthlyRent = netAnnualRent / 12;

  // Get value differentiators from inputs
  const valueDifferentiators = (inputs as any).valueDifferentiators || [];
  const appreciationBonus = (inputs as any).appreciationBonus || 0;

  // Check visibility conditions
  const showRent = inputs.rentalYieldPercent > 0;
  const showExits = inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0 && calculations.basePrice > 0;
  const showPostHandover = inputs.hasPostHandoverPlan;
  const showMortgage = mortgageInputs.enabled;

  // Count visible cards for dynamic grid
  const visibleCardCount = [showRent, showExits, showPostHandover, showMortgage].filter(Boolean).length;

  // Determine if we have a long payment plan
  const isLongPaymentPlan = (inputs.additionalPayments || []).length > 12;

  return (
    <div 
      style={{
        width: '1587px',
        minHeight: '1123px',
        backgroundColor: 'hsl(var(--theme-bg))',
        color: 'hsl(var(--theme-text))',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '24px',
        boxSizing: 'border-box',
      }}
      data-export-root
    >
      {/* Broker Header */}
      {brokerInfo && (
        <ExportBrokerHeader 
          brokerInfo={brokerInfo} 
          language={language} 
        />
      )}

      {/* Property Hero */}
      <ExportPropertyHero
        clientInfo={clientInfo}
        heroImageUrl={quoteImages.heroImageUrl}
        basePrice={basePrice}
        pricePerSqft={pricePerSqft}
        currency={currency}
        rate={rate}
        language={language}
        snapshotTitle={snapshotTitle}
      />

      {/* Overview Cards */}
      <div style={{ marginBottom: '16px' }} data-export-layout="static">
        <SnapshotOverviewCards
          inputs={inputs}
          calculations={calculations}
          currency={currency}
          rate={rate}
        />
      </div>

      {/* Main Content - Adaptive Layout */}
      {isLongPaymentPlan ? (
        /* STACKED LAYOUT for long payment plans */
        <div style={{ marginBottom: '16px' }} data-export-layout="static">
          {/* Payment Table - Full Width with 2-column */}
          <div style={{ marginBottom: '16px' }}>
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
          </div>
          
          {/* Insight Cards - dynamic grid based on visible card count */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${visibleCardCount}, 1fr)`, 
              gap: '12px' 
            }}
          >
            {/* Rent Card */}
            {showRent && (
              <CompactRentCard
                inputs={inputs}
                currency={currency}
                rate={rate}
                onViewWealthProjection={undefined}
              />
            )}
            
            {/* Exit Scenarios */}
            {showExits && (
              <CompactAllExitsCard
                inputs={inputs}
                calculations={calculations}
                exitScenarios={exitScenarios}
                currency={currency}
                rate={rate}
                onClick={undefined}
              />
            )}
            
            {/* Post-Handover Coverage */}
            {showPostHandover && (
              <CompactPostHandoverCard
                inputs={inputs}
                monthlyRent={monthlyRent}
                rentGrowthRate={inputs.rentGrowthRate || 4}
                currency={currency}
                rate={rate}
              />
            )}
            
            {/* Mortgage */}
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
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px', 
            marginBottom: '16px' 
          }}
          data-export-layout="static"
        >
          {/* Left Column: Payment */}
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

          {/* Right Column: Rent + Exits + Post-Handover + Mortgage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Rent Card */}
            {showRent && (
              <CompactRentCard
                inputs={inputs}
                currency={currency}
                rate={rate}
                onViewWealthProjection={undefined}
              />
            )}
            
            {/* Exit Scenarios */}
            {showExits && (
              <CompactAllExitsCard
                inputs={inputs}
                calculations={calculations}
                exitScenarios={exitScenarios}
                currency={currency}
                rate={rate}
                onClick={undefined}
              />
            )}
            
            {/* Post-Handover Coverage */}
            {showPostHandover && (
              <CompactPostHandoverCard
                inputs={inputs}
                monthlyRent={monthlyRent}
                rentGrowthRate={inputs.rentGrowthRate || 4}
                currency={currency}
                rate={rate}
              />
            )}
            
            {/* Mortgage */}
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

      {/* Wealth Projection Timeline - Full Width */}
      <div data-export-layout="static">
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
          handoverMonth={inputs.handoverMonth}
          handoverYear={inputs.handoverYear}
          bookingMonth={inputs.bookingMonth}
        />
      </div>

      {/* Footer */}
      <ExportFooter 
        generatedAt={new Date()} 
        language={language} 
      />
    </div>
  );
};
