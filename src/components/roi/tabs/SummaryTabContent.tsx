import { CashflowSummaryCard } from "@/components/roi/CashflowSummaryCard";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { MortgageInputs, MortgageAnalysis } from "@/components/roi/useMortgageCalculations";
import { Currency } from "@/components/roi/currencyUtils";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";

interface SummaryTabContentProps {
  inputs: OIInputs;
  clientInfo: ClientUnitData;
  calculations: OICalculations;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
}

export const SummaryTabContent = ({
  inputs,
  clientInfo,
  calculations,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  currency,
  rate,
}: SummaryTabContentProps) => {
  return (
    <div className="space-y-6">
      <CashflowSummaryCard
        inputs={inputs}
        clientInfo={clientInfo}
        calculations={calculations}
        mortgageAnalysis={mortgageAnalysis}
        mortgageInputs={mortgageInputs}
        exitScenarios={exitScenarios}
        currency={currency}
        rate={rate}
        defaultOpen={true}
      />
    </div>
  );
};
