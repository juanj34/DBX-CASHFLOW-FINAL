import { PaymentBreakdown } from "@/components/roi/PaymentBreakdown";
import { PaymentSplitBreakdown } from "@/components/roi/PaymentSplitBreakdown";
import { ValueDifferentiatorsDisplay } from "@/components/roi/ValueDifferentiatorsDisplay";
import { OIInputs } from "@/components/roi/useOICalculations";
import { Currency } from "@/components/roi/currencyUtils";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";

interface PropertyTabContentProps {
  inputs: OIInputs;
  currency: Currency;
  totalMonths: number;
  rate: number;
  clientInfo: ClientUnitData;
  customDifferentiators?: any[];
  onEditConfig: () => void;
}

export const PropertyTabContent = ({
  inputs,
  currency,
  totalMonths,
  rate,
  clientInfo,
  customDifferentiators = [],
  onEditConfig,
}: PropertyTabContentProps) => {
  return (
    <div className="space-y-6">
      <PaymentBreakdown 
        inputs={inputs} 
        currency={currency} 
        totalMonths={totalMonths} 
        rate={rate} 
        unitSizeSqf={clientInfo.unitSizeSqf} 
        clientInfo={clientInfo} 
      />
      
      {clientInfo.splitEnabled && clientInfo.clients && clientInfo.clients.length > 1 && (
        <PaymentSplitBreakdown
          inputs={inputs}
          clientInfo={clientInfo}
          currency={currency}
          totalMonths={totalMonths}
          rate={rate}
        />
      )}
      
      <ValueDifferentiatorsDisplay
        selectedDifferentiators={inputs.valueDifferentiators || []}
        customDifferentiators={customDifferentiators}
        onEditClick={onEditConfig}
      />
    </div>
  );
};
