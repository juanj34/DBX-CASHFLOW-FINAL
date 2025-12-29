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
    <div className={isDashboard ? "space-y-4" : "space-y-6"}>
      {/* Row 1: RentSnapshot (full width) */}
      <RentSnapshot 
        inputs={inputs} 
        currency={currency} 
        rate={rate} 
        holdAnalysis={calculations.holdAnalysis} 
      />
      
      {/* Row 2: WealthSummary + CumulativeChart (2 columns on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WealthSummaryCard 
          propertyValueYear10={lastProjection.propertyValue} 
          cumulativeRentIncome={lastProjection.cumulativeNetIncome} 
          airbnbCumulativeIncome={calculations.showAirbnbComparison ? lastProjection.airbnbCumulativeNetIncome : undefined} 
          initialInvestment={totalCapitalInvested} 
          currency={currency} 
          rate={rate} 
          showAirbnbComparison={calculations.showAirbnbComparison} 
        />
        
        <div className={isDashboard ? "max-h-[300px]" : ""}>
          <CumulativeIncomeChart 
            projections={calculations.yearlyProjections} 
            currency={currency} 
            rate={rate} 
            totalCapitalInvested={totalCapitalInvested} 
            showAirbnbComparison={calculations.showAirbnbComparison} 
          />
        </div>
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
