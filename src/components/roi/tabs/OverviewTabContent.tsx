import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { MortgageInputs, MortgageAnalysis } from "@/components/roi/useMortgageCalculations";
import { InvestmentOverviewGrid } from "@/components/roi/InvestmentOverviewGrid";
import { Currency } from "@/components/roi/currencyUtils";

interface OverviewTabContentProps {
  inputs: OIInputs;
  calculations: OICalculations;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
}

export const OverviewTabContent = ({
  inputs,
  calculations,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  currency,
  rate,
}: OverviewTabContentProps) => {
  return (
    <div className="space-y-6">
      <InvestmentOverviewGrid
        inputs={inputs}
        calculations={calculations}
        mortgageAnalysis={mortgageAnalysis}
        mortgageEnabled={mortgageInputs.enabled}
        exitScenarios={exitScenarios}
        currency={currency}
        rate={rate}
      />
    </div>
  );
};
