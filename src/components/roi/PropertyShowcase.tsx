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
  ShowcaseZoneCard,
} from './showcase';
import { ValueDifferentiator } from './valueDifferentiators';

interface ClientInfo {
  clients?: { id: string; name: string; country?: string }[];
  clientName?: string;
  clientCountry?: string;
  projectName?: string;
  developer?: string;
  unit?: string;
  unitType?: string;
  zoneName?: string;
  zoneId?: string;
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
    <div className={cn("w-full h-full", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full">
        {/* Left Column - Property Details Cards */}
        <div className="flex flex-col gap-2 order-2 lg:order-1 h-full">
          {/* Client Card */}
          <ShowcaseClientCard
            clients={clientInfo.clients}
            clientName={clientInfo.clientName}
            clientCountry={clientInfo.clientCountry}
            className="flex-shrink-0"
          />

          {/* Project Card */}
          <ShowcaseProjectCard
            projectName={clientInfo.projectName || ''}
            projectId={projectId}
            className="flex-shrink-0"
          />

          {/* Zone Card - grows to fill space */}
          <ShowcaseZoneCard
            zoneName={clientInfo.zoneName}
            zoneId={zoneId || clientInfo.zoneId || inputs.zoneId}
            className="flex-1 min-h-0"
          />

          {/* Developer Card */}
          <ShowcaseDeveloperCard
            developerName={clientInfo.developer || ''}
            developerId={developerId}
            className="flex-shrink-0"
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
            className="flex-shrink-0"
          />

          {/* Value Differentiators Card - grows to fill remaining space */}
          {inputs.valueDifferentiators && inputs.valueDifferentiators.length > 0 && (
            <ShowcaseValueCard
              selectedDifferentiators={inputs.valueDifferentiators}
              customDifferentiators={customDifferentiators}
              className="flex-1 min-h-0"
            />
          )}
        </div>

        {/* Right Column - Building Render */}
        <div className="order-1 lg:order-2 h-full">
          <BuildingRenderCard
            imageUrl={buildingRenderUrl || null}
            developerId={developerId}
            showLogoOverlay={true}
            className="w-full h-full min-h-[200px] lg:min-h-0"
          />
        </div>
      </div>
    </div>
  );
};

export default PropertyShowcase;
