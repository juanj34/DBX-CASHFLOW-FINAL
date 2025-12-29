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
  variant?: 'default' | 'dashboard';
}

export const ExitTabContent = ({
  inputs,
  calculations,
  currency,
  rate,
  exitScenarios,
  setExitScenarios,
  unitSizeSqf,
  variant = 'default',
}: ExitTabContentProps) => {
  const isDashboard = variant === 'dashboard';

  return (
    <div className={isDashboard ? "space-y-4" : "space-y-6"}>
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
      
      {/* Growth curve with reduced height in dashboard */}
      <div className={isDashboard ? "max-h-[350px]" : ""}>
        <OIGrowthCurve 
          calculations={calculations} 
          inputs={inputs} 
          currency={currency} 
          exitScenarios={exitScenarios} 
          rate={rate} 
        />
      </div>
    </div>
  );
};
