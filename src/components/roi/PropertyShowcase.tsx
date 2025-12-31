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

  // Use hero image, fallback to building render
  const displayImage = heroImageUrl || buildingRenderUrl;

  return (
    <div className={cn(
      "relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
      className
    )}>
      <div className="flex flex-row h-full gap-4 p-4">
        {/* Left Column - Info Cards */}
        <div className="w-2/5 flex flex-col gap-3 overflow-y-auto pr-2">
          <ShowcaseClientCard
            clients={clientInfo.clients}
            clientName={clientInfo.clientName}
            clientCountry={clientInfo.clientCountry}
            className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl"
          />

          <ShowcaseProjectCard
            projectName={clientInfo.projectName || ''}
            projectId={projectId}
            className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl"
          />

          <ShowcaseZoneCard
            zoneName={clientInfo.zoneName}
            zoneId={zoneId || clientInfo.zoneId || inputs.zoneId}
            className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl"
          />

          <ShowcaseDeveloperCard
            developerName={clientInfo.developer || ''}
            developerId={developerId}
            className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl"
          />

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
            className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl"
          />

          {inputs.valueDifferentiators && inputs.valueDifferentiators.length > 0 && (
            <ShowcaseValueCard
              selectedDifferentiators={inputs.valueDifferentiators}
              customDifferentiators={customDifferentiators}
              className="bg-white/5 backdrop-blur-xl rounded-lg p-3 border border-white/10 shadow-2xl"
            />
          )}
        </div>

        {/* Right Column - Hero Image */}
        <div className="w-3/5 relative rounded-2xl overflow-hidden shadow-2xl">
          {displayImage ? (
            <img 
              src={displayImage} 
              alt="Property showcase" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 flex items-center justify-center">
              <Building className="w-24 h-24 text-white/20" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyShowcase;
