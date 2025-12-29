import { RentSnapshot } from "@/components/roi/RentSnapshot";
import { CumulativeIncomeChart } from "@/components/roi/CumulativeIncomeChart";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { WealthSummaryCard } from "@/components/roi/WealthSummaryCard";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { Currency } from "@/components/roi/currencyUtils";

interface HoldTabContentProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
  totalCapitalInvested: number;
  unitSizeSqf?: number;
  variant?: 'default' | 'dashboard';
}

export const HoldTabContent = ({
  inputs,
  calculations,
  currency,
  rate,
  totalCapitalInvested,
  unitSizeSqf,
  variant = 'default',
}: HoldTabContentProps) => {
  const lastProjection = calculations.yearlyProjections[calculations.yearlyProjections.length - 1];
  const isDashboard = variant === 'dashboard';

  return (
    <div className="space-y-6">
      {/* Row 1: RentSnapshot (full width) */}
      <RentSnapshot 
        inputs={inputs} 
        currency={currency} 
        rate={rate} 
        holdAnalysis={calculations.holdAnalysis} 
      />
      
      {/* Row 2: WealthSummary + CumulativeChart (2 columns, equal height) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WealthSummaryCard 
          propertyValueYear10={lastProjection.propertyValue} 
          cumulativeRentIncome={lastProjection.cumulativeNetIncome} 
          airbnbCumulativeIncome={calculations.showAirbnbComparison ? lastProjection.airbnbCumulativeNetIncome : undefined} 
          initialInvestment={totalCapitalInvested} 
          currency={currency} 
          rate={rate} 
          showAirbnbComparison={calculations.showAirbnbComparison} 
        />
        
        <CumulativeIncomeChart 
          projections={calculations.yearlyProjections} 
          currency={currency} 
          rate={rate} 
          totalCapitalInvested={totalCapitalInvested} 
          showAirbnbComparison={calculations.showAirbnbComparison} 
        />
      </div>
      
      {/* Row 3: Yearly Projection Table (full width) */}
      <OIYearlyProjectionTable 
        projections={calculations.yearlyProjections} 
        currency={currency} 
        rate={rate} 
        showAirbnbComparison={calculations.showAirbnbComparison} 
        unitSizeSqf={unitSizeSqf}
      />
    </div>
  );
};
