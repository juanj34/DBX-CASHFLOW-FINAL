import React from 'react';
import { cn } from '@/lib/utils';
import { OIInputs, OICalculations } from './useOICalculations';
import { Currency } from './currencyUtils';
import { Building } from 'lucide-react';
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
  heroImageUrl?: string | null;
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
  heroImageUrl,
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

  // Use hero image, fallback to building render, then placeholder
  const backgroundImage = heroImageUrl || buildingRenderUrl;

  return (
    <div className={cn("relative w-full h-full overflow-hidden rounded-2xl", className)}>
      {/* Hero Background Image */}
      {backgroundImage ? (
        <div className="absolute inset-0">
          <img 
            src={backgroundImage} 
            alt="Property showcase" 
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        </div>
      ) : (
        /* Fallback gradient when no image */
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <Building className="w-48 h-48" />
          </div>
        </div>
      )}
      
      {/* Glassmorphic Cards Overlay */}
      <div className="relative z-10 h-full p-4 flex flex-col">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 flex-1 auto-rows-min">
          {/* Client Card */}
          <ShowcaseClientCard
            clients={clientInfo.clients}
            clientName={clientInfo.clientName}
            clientCountry={clientInfo.clientCountry}
            className="glass-card"
          />

          {/* Project Card */}
          <ShowcaseProjectCard
            projectName={clientInfo.projectName || ''}
            projectId={projectId}
            className="glass-card"
          />

          {/* Zone Card */}
          <ShowcaseZoneCard
            zoneName={clientInfo.zoneName}
            zoneId={zoneId || clientInfo.zoneId || inputs.zoneId}
            className="glass-card"
          />

          {/* Developer Card */}
          <ShowcaseDeveloperCard
            developerName={clientInfo.developer || ''}
            developerId={developerId}
            className="glass-card"
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
            className="glass-card"
          />

          {/* Value Differentiators Card */}
          {inputs.valueDifferentiators && inputs.valueDifferentiators.length > 0 && (
            <ShowcaseValueCard
              selectedDifferentiators={inputs.valueDifferentiators}
              customDifferentiators={customDifferentiators}
              className="glass-card lg:col-span-1"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyShowcase;
