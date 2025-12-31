import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
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

const cardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
};

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
      "relative w-full h-full overflow-hidden rounded-2xl",
      className
    )}>
      {/* Mobile Layout: Cards above image */}
      <div className="flex flex-col md:hidden">
        {/* Cards Section - Mobile */}
        <div className="p-3 space-y-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* 1. Client */}
          <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
            <ShowcaseClientCard
              clients={clientInfo.clients}
              clientName={clientInfo.clientName}
              clientCountry={clientInfo.clientCountry}
              className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl"
            />
          </motion.div>

          {/* 2. Zone */}
          <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
            <ShowcaseZoneCard
              zoneName={clientInfo.zoneName}
              zoneId={zoneId || clientInfo.zoneId || inputs.zoneId}
              className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl"
            />
          </motion.div>

          {/* 3. Developer */}
          <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
            <ShowcaseDeveloperCard
              developerName={clientInfo.developer || ''}
              developerId={developerId}
              className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl"
            />
          </motion.div>

          {/* 4. Project */}
          <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
            <ShowcaseProjectCard
              projectName={clientInfo.projectName || ''}
              projectId={projectId}
              className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl"
            />
          </motion.div>

          {/* 5. Unit */}
          <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants}>
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
          </motion.div>

          {/* 6. Property Uniqueness */}
          {inputs.valueDifferentiators && inputs.valueDifferentiators.length > 0 && (
            <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
              <ShowcaseValueCard
                selectedDifferentiators={inputs.valueDifferentiators}
                customDifferentiators={customDifferentiators}
                className="bg-white/5 backdrop-blur-xl rounded-lg p-3 border border-white/10 shadow-2xl"
              />
            </motion.div>
          )}
        </div>

        {/* Hero Image - Mobile */}
        <div className="h-48 relative overflow-hidden">
          {displayImage ? (
            <motion.img 
              src={displayImage} 
              alt="Property showcase" 
              className="w-full h-full object-cover"
              initial={{ scale: 1 }}
              animate={{ scale: 1.1 }}
              transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 flex items-center justify-center">
              <Building className="w-16 h-16 text-white/20" />
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout: Full-width hero with left-aligned card overlay */}
      <div className="hidden md:block h-full">
        {/* Full Background Hero Image */}
        <div className="absolute inset-0 overflow-hidden">
          {displayImage ? (
            <motion.img 
              src={displayImage} 
              alt="Property showcase" 
              className="w-full h-full object-cover"
              initial={{ scale: 1 }}
              animate={{ scale: 1.1 }}
              transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
              <Building className="w-32 h-32 text-white/10" />
            </div>
          )}
          {/* Left-side gradient for card readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>
        
        {/* Cards Overlay - Left Aligned */}
        <div className="relative z-10 h-full p-4 overflow-y-auto">
          <div className="flex flex-col gap-3 w-1/3 min-w-[320px] max-w-[420px]">
            {/* 1. Client */}
            <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
              <ShowcaseClientCard
                clients={clientInfo.clients}
                clientName={clientInfo.clientName}
                clientCountry={clientInfo.clientCountry}
                className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl"
              />
            </motion.div>

            {/* 2. Zone */}
            <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
              <ShowcaseZoneCard
                zoneName={clientInfo.zoneName}
                zoneId={zoneId || clientInfo.zoneId || inputs.zoneId}
                className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl"
              />
            </motion.div>

            {/* 3. Developer */}
            <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
              <ShowcaseDeveloperCard
                developerName={clientInfo.developer || ''}
                developerId={developerId}
                className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl"
              />
            </motion.div>

            {/* 4. Project */}
            <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
              <ShowcaseProjectCard
                projectName={clientInfo.projectName || ''}
                projectId={projectId}
                className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl"
              />
            </motion.div>

            {/* 5. Unit */}
            <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants}>
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
            </motion.div>

            {/* 6. Property Uniqueness */}
            {inputs.valueDifferentiators && inputs.valueDifferentiators.length > 0 && (
              <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
                <ShowcaseValueCard
                  selectedDifferentiators={inputs.valueDifferentiators}
                  customDifferentiators={customDifferentiators}
                  className="bg-white/5 backdrop-blur-xl rounded-lg p-3 border border-white/10 shadow-2xl"
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyShowcase;
