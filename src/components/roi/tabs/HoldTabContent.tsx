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
}

export const HoldTabContent = ({
  inputs,
  calculations,
  currency,
  rate,
  totalCapitalInvested,
  unitSizeSqf,
}: HoldTabContentProps) => {
  const lastProjection = calculations.yearlyProjections[calculations.yearlyProjections.length - 1];

  return (
    <div className="space-y-6">
      <RentSnapshot 
        inputs={inputs} 
        currency={currency} 
        rate={rate} 
        holdAnalysis={calculations.holdAnalysis} 
      />
      
      <CumulativeIncomeChart 
        projections={calculations.yearlyProjections} 
        currency={currency} 
        rate={rate} 
        totalCapitalInvested={totalCapitalInvested} 
        showAirbnbComparison={calculations.showAirbnbComparison} 
      />
      
      <OIYearlyProjectionTable 
        projections={calculations.yearlyProjections} 
        currency={currency} 
        rate={rate} 
        showAirbnbComparison={calculations.showAirbnbComparison} 
        unitSizeSqf={unitSizeSqf}
      />
      
      <WealthSummaryCard 
        propertyValueYear10={lastProjection.propertyValue} 
        cumulativeRentIncome={lastProjection.cumulativeNetIncome} 
        airbnbCumulativeIncome={calculations.showAirbnbComparison ? lastProjection.airbnbCumulativeNetIncome : undefined} 
        initialInvestment={totalCapitalInvested} 
        currency={currency} 
        rate={rate} 
        showAirbnbComparison={calculations.showAirbnbComparison} 
      />
    </div>
  );
};
