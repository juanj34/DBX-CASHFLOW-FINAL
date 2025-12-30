import { PaymentBreakdown } from "@/components/roi/PaymentBreakdown";
import { OIInputs } from "@/components/roi/useOICalculations";
import { Currency } from "@/components/roi/currencyUtils";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";

interface PaymentsTabContentProps {
  inputs: OIInputs;
  currency: Currency;
  totalMonths: number;
  rate: number;
  clientInfo: ClientUnitData;
}

export const PaymentsTabContent = ({
  inputs,
  currency,
  totalMonths,
  rate,
  clientInfo,
}: PaymentsTabContentProps) => {
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
    </div>
  );
};