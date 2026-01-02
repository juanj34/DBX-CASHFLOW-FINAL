import { useState } from "react";
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
  readOnly?: boolean;
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
  readOnly = false,
}: ExitTabContentProps) => {
  const isDashboard = variant === 'dashboard';
  
  // State for bidirectional highlight sync between cards and chart
  const [highlightedExit, setHighlightedExit] = useState<number | null>(null);

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
        highlightedIndex={highlightedExit}
        onCardHover={setHighlightedExit}
      />
      
      {/* Growth curve with reduced height in dashboard */}
      <div className={isDashboard ? "max-h-[350px]" : ""}>
        <OIGrowthCurve 
          calculations={calculations} 
          inputs={inputs} 
          currency={currency} 
          exitScenarios={exitScenarios} 
          rate={rate}
          highlightedExit={highlightedExit}
          onExitHover={setHighlightedExit}
        />
      </div>
    </div>
  );
};
