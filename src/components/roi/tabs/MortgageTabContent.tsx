import { MortgageBreakdown } from "@/components/roi/MortgageBreakdown";
import { MortgageInputs, MortgageAnalysis } from "@/components/roi/useMortgageCalculations";
import { OICalculations, OIInputs } from "@/components/roi/useOICalculations";
import { Currency } from "@/components/roi/currencyUtils";

interface MortgageTabContentProps {
  inputs: OIInputs;
  calculations: OICalculations;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  currency: Currency;
  rate: number;
}

export const MortgageTabContent = ({
  inputs,
  calculations,
  mortgageInputs,
  mortgageAnalysis,
  currency,
  rate,
}: MortgageTabContentProps) => {
  // Find first full rental year for rent comparison
  const firstFullRentalYear = calculations.yearlyProjections.find(p => 
    !p.isConstruction && !p.isHandover && p.annualRent !== null && p.annualRent > 0
  );
  
  const fullAnnualRent = firstFullRentalYear?.annualRent || (inputs.basePrice * inputs.rentalYieldPercent / 100);
  const monthlyLongTermRent = fullAnnualRent / 12;
  const monthlyServiceCharges = (firstFullRentalYear?.serviceCharges || 0) / 12;
  const fullAnnualAirbnbNet = firstFullRentalYear?.airbnbNetIncome || 0;
  const monthlyAirbnbNet = fullAnnualAirbnbNet / 12;
  
  // Year 5 projections for growth comparison
  const year5RentalYear = (firstFullRentalYear?.year || 0) + 4;
  const year5Projection = calculations.yearlyProjections.find(p => p.year === year5RentalYear);
  const year5LongTermRent = year5Projection?.annualRent ? (year5Projection.annualRent / 12) : undefined;
  const year5AirbnbNet = year5Projection?.airbnbNetIncome ? (year5Projection.airbnbNetIncome / 12) : undefined;

  return (
    <div className="space-y-6">
      <MortgageBreakdown
        mortgageInputs={mortgageInputs}
        mortgageAnalysis={mortgageAnalysis}
        basePrice={calculations.basePrice}
        currency={currency}
        rate={rate}
        preHandoverPercent={inputs.preHandoverPercent}
        monthlyLongTermRent={monthlyLongTermRent}
        monthlyServiceCharges={monthlyServiceCharges}
        monthlyAirbnbNet={monthlyAirbnbNet}
        showAirbnbComparison={calculations.showAirbnbComparison}
        year5LongTermRent={year5LongTermRent}
        year5AirbnbNet={year5AirbnbNet}
        rentGrowthRate={inputs.rentGrowthRate}
      />
    </div>
  );
};
