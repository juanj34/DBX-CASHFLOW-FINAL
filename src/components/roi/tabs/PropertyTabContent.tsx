import { ClientUnitInfo, ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { InvestmentSnapshot } from "@/components/roi/InvestmentSnapshot";
import { CompactInvestmentSnapshot } from "@/components/roi/dashboard/CompactInvestmentSnapshot";
import { ValueDifferentiatorsDisplay } from "@/components/roi/ValueDifferentiatorsDisplay";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { Currency } from "@/components/roi/currencyUtils";

interface PropertyTabContentProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
  clientInfo: ClientUnitData;
  customDifferentiators?: any[];
  onEditConfig: () => void;
  onEditClient: () => void;
  variant?: 'default' | 'dashboard';
}

export const PropertyTabContent = ({
  inputs,
  calculations,
  currency,
  rate,
  clientInfo,
  customDifferentiators = [],
  onEditConfig,
  onEditClient,
  variant = 'default',
}: PropertyTabContentProps) => {
  if (variant === 'dashboard') {
    return (
      <div className="space-y-4">
        {/* Client Info - Full Width */}
        <ClientUnitInfo 
          data={clientInfo} 
          onEditClick={onEditClient} 
        />
        
        {/* Investment + Value Differentiators - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CompactInvestmentSnapshot 
            inputs={inputs} 
            currency={currency} 
            totalMonths={calculations.totalMonths} 
            totalEntryCosts={calculations.totalEntryCosts} 
            rate={rate} 
            unitSizeSqf={clientInfo.unitSizeSqf} 
          />
          <ValueDifferentiatorsDisplay
            selectedDifferentiators={inputs.valueDifferentiators || []}
            customDifferentiators={customDifferentiators}
            onEditClick={onEditConfig}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Client Info + Investment Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ClientUnitInfo 
          data={clientInfo} 
          onEditClick={onEditClient} 
        />
        <InvestmentSnapshot 
          inputs={inputs} 
          currency={currency} 
          totalMonths={calculations.totalMonths} 
          totalEntryCosts={calculations.totalEntryCosts} 
          rate={rate} 
          holdAnalysis={calculations.holdAnalysis} 
          unitSizeSqf={clientInfo.unitSizeSqf} 
        />
      </div>
      
      {/* Row 2: Value Differentiators */}
      <ValueDifferentiatorsDisplay
        selectedDifferentiators={inputs.valueDifferentiators || []}
        customDifferentiators={customDifferentiators}
        onEditClick={onEditConfig}
      />
    </div>
  );
};
