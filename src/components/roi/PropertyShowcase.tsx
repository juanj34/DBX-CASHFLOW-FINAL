import React from 'react';
import { cn } from '@/lib/utils';
import { OIInputs, OICalculations } from './useOICalculations';
import { Currency } from './currencyUtils';
import { BuildingRenderCard } from './BuildingRenderCard';
import {
  ShowcaseClientCard,
  ShowcaseProjectCard,
  ShowcaseDeveloperCard,
  ShowcaseUnitCard,
  ShowcaseValueCard,
} from './showcase';
import { ValueDifferentiator } from './valueDifferentiators';

interface ClientInfo {
  clientName?: string;
  clientCountry?: string;
  projectName?: string;
  developer?: string;
  unit?: string;
  unitType?: string;
  zoneName?: string;
}

interface PropertyShowcaseProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientInfo;
  currency: Currency;
  rate: number;
  buildingRenderUrl?: string | null;
  developerId?: string;
  projectId?: string;
  zoneId?: string;
  customDifferentiators?: ValueDifferentiator[];
  className?: string;
}

export const PropertyShowcase: React.FC<PropertyShowcaseProps> = ({
  inputs,
  calculations,
  clientInfo,
  currency,
  rate,
  buildingRenderUrl,
  developerId,
  projectId,
  zoneId,
  customDifferentiators = [],
  className,
}) => {
  const pricePerSqft = inputs.unitSizeSqf && inputs.unitSizeSqf > 0 
    ? calculations.basePrice / inputs.unitSizeSqf 
    : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Property Details Cards */}
        <div className="space-y-3 order-2 lg:order-1">
          {/* Client Card */}
          <ShowcaseClientCard
            clientName={clientInfo.clientName || ''}
            clientCountry={clientInfo.clientCountry || ''}
          />

          {/* Project + Zone Card */}
          <ShowcaseProjectCard
            projectName={clientInfo.projectName || ''}
            zoneName={clientInfo.zoneName}
            projectId={projectId}
            zoneId={zoneId || inputs.zoneId}
          />

          {/* Developer Card */}
          <ShowcaseDeveloperCard
            developerName={clientInfo.developer || ''}
            developerId={developerId}
          />

          {/* Unit Card */}
          <ShowcaseUnitCard
            unitType={clientInfo.unitType || ''}
            unitSizeSqf={inputs.unitSizeSqf || 0}
            basePrice={calculations.basePrice}
            pricePerSqft={pricePerSqft}
            handoverQuarter={`Q${inputs.handoverQuarter}`}
            handoverYear={inputs.handoverYear}
            monthsToHandover={calculations.totalMonths}
            currency={currency}
            rate={rate}
          />

          {/* Value Differentiators Card */}
          {inputs.valueDifferentiators && inputs.valueDifferentiators.length > 0 && (
            <ShowcaseValueCard
              selectedDifferentiators={inputs.valueDifferentiators}
              customDifferentiators={customDifferentiators}
            />
          )}
        </div>

        {/* Right Column - Building Render */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-4 self-start">
          <BuildingRenderCard
            imageUrl={buildingRenderUrl || null}
            developerId={developerId}
            showLogoOverlay={true}
            className="w-full aspect-[4/5] lg:aspect-[3/4]"
          />
        </div>
      </div>
    </div>
  );
};

export default PropertyShowcase;
