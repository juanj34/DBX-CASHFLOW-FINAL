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
  PropertyScoreGauge,
} from './showcase';
import { ValueDifferentiator, calculateAppreciationBonus } from './valueDifferentiators';

interface ClientInfo {
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

  const appreciationBonus = calculateAppreciationBonus(inputs.valueDifferentiators || [], customDifferentiators);
  const zoneMaturity = inputs.zoneMaturityLevel ?? 50;

  return (
    <div className={cn("w-full h-full", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        {/* Left Column - Property Details Cards */}
        <div className="space-y-2 order-2 lg:order-1 overflow-y-auto max-h-[calc(100vh-320px)]">
          {/* Row 1: Client + Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ShowcaseClientCard
              clientName={clientInfo.clientName || ''}
              clientCountry={clientInfo.clientCountry || ''}
            />
            <PropertyScoreGauge
              developerScore={7.5}
              zoneMaturity={zoneMaturity}
              appreciationBonus={appreciationBonus}
            />
          </div>

          {/* Project + Zone Card */}
          <ShowcaseProjectCard
            projectName={clientInfo.projectName || ''}
            zoneName={clientInfo.zoneName}
            projectId={projectId}
            zoneId={zoneId || clientInfo.zoneId || inputs.zoneId}
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
        <div className="order-1 lg:order-2 lg:sticky lg:top-0 self-start">
          <BuildingRenderCard
            imageUrl={buildingRenderUrl || null}
            developerId={developerId}
            showLogoOverlay={true}
            className="w-full aspect-[4/5] lg:aspect-[3/4] max-h-[calc(100vh-320px)]"
          />
        </div>
      </div>
    </div>
  );
};

export default PropertyShowcase;
