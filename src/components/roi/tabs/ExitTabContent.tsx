import { ExitScenariosCards } from "@/components/roi/ExitScenariosCards";
import { OIGrowthCurve } from "@/components/roi/OIGrowthCurve";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { Currency } from "@/components/roi/currencyUtils";

interface ExitTabContentProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
  exitScenarios: number[];
  setExitScenarios: (scenarios: number[]) => void;
  unitSizeSqf?: number;
}

export const ExitTabContent = ({
  inputs,
  calculations,
  currency,
  rate,
  exitScenarios,
  setExitScenarios,
  unitSizeSqf,
}: ExitTabContentProps) => {
  return (
    <div className="space-y-6">
      <ExitScenariosCards 
        inputs={inputs} 
        currency={currency} 
        totalMonths={calculations.totalMonths} 
        basePrice={calculations.basePrice} 
        totalEntryCosts={calculations.totalEntryCosts} 
        exitScenarios={exitScenarios} 
        setExitScenarios={setExitScenarios} 
        rate={rate} 
        unitSizeSqf={unitSizeSqf} 
      />
      
      <OIGrowthCurve 
        calculations={calculations} 
        inputs={inputs} 
        currency={currency} 
        exitScenarios={exitScenarios} 
        rate={rate} 
      />
    </div>
  );
};
