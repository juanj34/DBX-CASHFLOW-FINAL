import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '@/components/roi/useMortgageCalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { PropertyHeroCard } from '@/components/roi/PropertyHeroCard';
import { InvestmentOverviewGrid } from '@/components/roi/InvestmentOverviewGrid';
import { InvestmentSnapshot } from '@/components/roi/InvestmentSnapshot';
import { PaymentBreakdown } from '@/components/roi/PaymentBreakdown';
import { ValueDifferentiatorsDisplay } from '@/components/roi/ValueDifferentiatorsDisplay';
import { RentSnapshot } from '@/components/roi/RentSnapshot';
import { CumulativeIncomeChart } from '@/components/roi/CumulativeIncomeChart';
import { OIYearlyProjectionTable } from '@/components/roi/OIYearlyProjectionTable';
import { WealthSummaryCard } from '@/components/roi/WealthSummaryCard';
import { ExitScenariosCards } from '@/components/roi/ExitScenariosCards';
import { OIGrowthCurve } from '@/components/roi/OIGrowthCurve';
import { MortgageBreakdown } from '@/components/roi/MortgageBreakdown';
import { CashflowSummaryCard } from '@/components/roi/CashflowSummaryCard';

interface CashflowPrintContentProps {
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
  customDifferentiators?: any[];
}

/**
 * Print-optimized cashflow layout for server-side screenshot capture.
 * Fixed 1920px width, all sections expanded, no interactive elements.
 */
export const CashflowPrintContent = ({
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
  customDifferentiators = [],
}: CashflowPrintContentProps) => {
  const basePrice = calculations.basePrice;
  const pricePerSqft = clientInfo.unitSizeSqf > 0 ? basePrice / clientInfo.unitSizeSqf : 0;
  const totalCapitalInvested = basePrice + calculations.totalEntryCosts;
  
  // Get value differentiators from inputs
  const valueDifferentiators = (inputs as any).valueDifferentiators || [];
  
  // Get enabled sections - default all to true for print
  const enabledSections = (inputs as any).enabledSections || {
    exitStrategy: true,
    longTermHold: true,
    mortgageAnalysis: mortgageInputs.enabled,
  };

  // Get last projection for wealth summary
  const lastProjection = calculations.yearlyProjections[calculations.yearlyProjections.length - 1];

  return (
    <div 
      className="cashflow-print-content bg-theme-bg min-h-screen"
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

      {/* Investment Overview Grid */}
      <div className="px-6 py-4">
        <InvestmentOverviewGrid 
          inputs={inputs}
          calculations={calculations}
          currency={currency}
          rate={rate}
        />
      </div>

      {/* Investment Snapshot */}
      <div className="px-6 pb-4">
        <InvestmentSnapshot
          inputs={inputs}
          currency={currency}
          totalMonths={calculations.totalMonths}
          totalEntryCosts={calculations.totalEntryCosts}
          rate={rate}
          unitSizeSqf={clientInfo.unitSizeSqf}
        />
      </div>

      {/* Payment Breakdown - Expanded */}
      <div className="px-6 pb-4">
        <div className="bg-theme-card rounded-xl border border-theme-border p-6">
          <h3 className="text-lg font-semibold text-theme-text mb-4">Payment Breakdown</h3>
          <PaymentBreakdown
            inputs={inputs}
            currency={currency}
            rate={rate}
            totalMonths={calculations.totalMonths}
            clientInfo={clientInfo}
          />
        </div>
      </div>

      {/* Value Differentiators */}
      {valueDifferentiators.length > 0 && (
        <div className="px-6 pb-4">
          <ValueDifferentiatorsDisplay
            selectedDifferentiators={valueDifferentiators}
            customDifferentiators={customDifferentiators}
          />
        </div>
      )}

      {/* Hold Strategy Analysis - Expanded */}
      {enabledSections.longTermHold !== false && (
        <div className="px-6 pb-4">
          <div className="bg-theme-card rounded-xl border border-theme-border p-6">
            <h3 className="text-lg font-semibold text-theme-text mb-6">Hold Strategy Analysis</h3>
            
            {/* Rent Snapshot */}
            <div className="mb-6">
              <RentSnapshot
                inputs={inputs}
                currency={currency}
                rate={rate}
                holdAnalysis={calculations.holdAnalysis}
              />
            </div>

            {/* Cumulative Income Chart */}
            <div className="mb-6">
              <CumulativeIncomeChart 
                projections={calculations.yearlyProjections}
                currency={currency}
                rate={rate}
                totalCapitalInvested={totalCapitalInvested}
                showAirbnbComparison={(inputs as any).showAirbnbComparison || false}
              />
            </div>

            {/* Yearly Projection Table */}
            <div className="mb-6">
              <OIYearlyProjectionTable
                projections={calculations.yearlyProjections}
                currency={currency}
                rate={rate}
                showAirbnbComparison={(inputs as any).showAirbnbComparison || false}
                unitSizeSqf={clientInfo.unitSizeSqf}
              />
            </div>

            {/* Wealth Summary Card */}
            <WealthSummaryCard
              propertyValueFinal={lastProjection?.propertyValue || basePrice}
              cumulativeRentIncome={lastProjection?.cumulativeNetIncome || 0}
              initialInvestment={totalCapitalInvested}
              currency={currency}
              rate={rate}
              showAirbnbComparison={(inputs as any).showAirbnbComparison || false}
            />
          </div>
        </div>
      )}

      {/* Exit Strategy Analysis - Expanded */}
      {enabledSections.exitStrategy !== false && exitScenarios.length > 0 && (
        <div className="px-6 pb-4">
          <div className="bg-theme-card rounded-xl border border-theme-border p-6">
            <h3 className="text-lg font-semibold text-theme-text mb-6">Exit Strategy Analysis</h3>
            
            {/* Exit Scenarios Cards */}
            <div className="mb-6">
              <ExitScenariosCards
                exitScenarios={exitScenarios}
                setExitScenarios={() => {}}
                inputs={inputs}
                currency={currency}
                rate={rate}
                totalMonths={calculations.totalMonths}
                basePrice={basePrice}
                totalEntryCosts={calculations.totalEntryCosts}
                readOnly={true}
              />
            </div>

            {/* Growth Curve */}
            <OIGrowthCurve
              inputs={inputs}
              calculations={calculations}
              exitScenarios={exitScenarios}
              currency={currency}
              rate={rate}
            />
          </div>
        </div>
      )}

      {/* Mortgage Analysis - Expanded */}
      {mortgageInputs.enabled && enabledSections.mortgageAnalysis !== false && (
        <div className="px-6 pb-4">
          <div className="bg-theme-card rounded-xl border border-theme-border p-6">
            <h3 className="text-lg font-semibold text-theme-text mb-6">Mortgage Analysis</h3>
            <MortgageBreakdown
              mortgageInputs={mortgageInputs}
              mortgageAnalysis={mortgageAnalysis}
              basePrice={basePrice}
              preHandoverPercent={inputs.preHandoverPercent}
              currency={currency}
              rate={rate}
            />
          </div>
        </div>
      )}

      {/* Cashflow Summary Card */}
      <div className="px-6 pb-6">
        <CashflowSummaryCard
          inputs={inputs}
          calculations={calculations}
          clientInfo={clientInfo}
          mortgageInputs={mortgageInputs}
          mortgageAnalysis={mortgageAnalysis}
          exitScenarios={exitScenarios}
          currency={currency}
          rate={rate}
        />
      </div>
    </div>
  );
};
