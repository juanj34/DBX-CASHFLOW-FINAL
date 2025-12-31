import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { MortgageInputs, MortgageAnalysis } from "@/components/roi/useMortgageCalculations";
import { InvestmentStoryDashboard } from "@/components/roi/InvestmentStoryDashboard";
import { Currency } from "@/components/roi/currencyUtils";
import { ValueDifferentiator } from "@/components/roi/valueDifferentiators";

interface ClientInfo {
  developer?: string;
  projectName?: string;
  clients?: { id: string; name: string; country?: string }[];
  unitType?: string;
  zoneName?: string;
  zoneId?: string;
}

interface OverviewTabContentProps {
  inputs: OIInputs;
  calculations: OICalculations;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
  clientInfo?: ClientInfo;
  buildingRenderUrl?: string | null;
  developerId?: string;
  projectId?: string;
  zoneId?: string;
  customDifferentiators?: ValueDifferentiator[];
}

export const OverviewTabContent = ({
  inputs,
  calculations,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  currency,
  rate,
  clientInfo,
  buildingRenderUrl,
  developerId,
  projectId,
  zoneId,
  customDifferentiators,
}: OverviewTabContentProps) => {
  return (
    <div className="space-y-6">
      <InvestmentStoryDashboard
        inputs={inputs}
        calculations={calculations}
        mortgageInputs={mortgageInputs}
        mortgageAnalysis={mortgageAnalysis}
        exitScenarios={exitScenarios}
        currency={currency}
        rate={rate}
        clientInfo={{
          clientName: clientInfo?.clients?.[0]?.name,
          clientCountry: clientInfo?.clients?.[0]?.country,
          projectName: clientInfo?.projectName,
          developer: clientInfo?.developer,
          unitType: clientInfo?.unitType,
          zoneName: clientInfo?.zoneName,
          zoneId: clientInfo?.zoneId,
        }}
        buildingRenderUrl={buildingRenderUrl}
        developerId={developerId}
        projectId={projectId}
        zoneId={zoneId || clientInfo?.zoneId}
        customDifferentiators={customDifferentiators}
      />
    </div>
  );
};
