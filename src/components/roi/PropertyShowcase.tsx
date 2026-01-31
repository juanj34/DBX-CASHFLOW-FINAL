import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { OIInputs, OICalculations } from './useOICalculations';
import { Currency, formatCurrency } from './currencyUtils';
import { Building, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ValueDifferentiator, VALUE_DIFFERENTIATORS } from './valueDifferentiators';

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

// Helper to format all client names
const formatClientNames = (clientInfo: ClientInfo): string => {
  if (clientInfo.clients && clientInfo.clients.length > 0) {
    const names = clientInfo.clients.map(c => c.name.toUpperCase());
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} & ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
  }
  return clientInfo.clientName?.toUpperCase() || '';
};

interface Zone {
  id: string;
  name: string;
  maturity_level: number | null;
  maturity_label: string | null;
  investment_focus: string | null;
}

interface PropertyShowcaseProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientInfo;
  currency: Currency;
  rate: number;
  heroImageUrl?: string | null;
  buildingRenderUrl?: string | null;
  zoneId?: string;
  customDifferentiators?: ValueDifferentiator[];
  className?: string;
}

// Helper to convert sqft to m²
const sqftToM2 = (sqft: number): number => Math.round(sqft * 0.092903);

export const PropertyShowcase: React.FC<PropertyShowcaseProps> = ({
  inputs,
  calculations,
  clientInfo,
  currency,
  rate,
  heroImageUrl,
  buildingRenderUrl,
  zoneId,
  customDifferentiators = [],
  className,
}) => {
  const [zone, setZone] = useState<Zone | null>(null);

  // Fetch zone data (zones are still database-driven)
  useEffect(() => {
    const fetchZone = async () => {
      const id = zoneId || clientInfo.zoneId || inputs.zoneId;
      if (id) {
        const { data } = await supabase.from('zones').select('id, name, maturity_level, maturity_label, investment_focus').eq('id', id).maybeSingle();
        if (data) setZone(data);
      } else if (clientInfo.zoneName) {
        const { data } = await supabase.from('zones').select('id, name, maturity_level, maturity_label, investment_focus').ilike('name', `%${clientInfo.zoneName}%`).maybeSingle();
        if (data) setZone(data);
      }
    };
    fetchZone();
  }, [zoneId, clientInfo.zoneId, inputs.zoneId, clientInfo.zoneName]);

  // Use hero image from props
  const displayImage = heroImageUrl || buildingRenderUrl;

  // Get selected differentiators details
  const allDifferentiators = [...VALUE_DIFFERENTIATORS, ...customDifferentiators];
  const selectedDifferentiators = inputs.valueDifferentiators
    ? allDifferentiators.filter(d => inputs.valueDifferentiators?.includes(d.id))
    : [];

  // Format all client names
  const allClientNames = formatClientNames(clientInfo);
  
  // Format unit details with meters
  const unitSizeSqft = inputs.unitSizeSqf;
  const unitSizeM2 = unitSizeSqft ? sqftToM2(unitSizeSqft) : null;

  return (
    <div className={cn(
      "relative w-full h-full min-h-0 flex-1 overflow-hidden rounded-2xl flex flex-col",
      className
    )}>
      {/* Mobile Layout */}
      <div className="flex flex-col md:hidden h-full flex-1">
        <div className="flex-1 p-4 space-y-4 bg-gradient-to-br from-theme-bg-alt via-theme-card to-theme-bg-alt overflow-y-auto">
          {/* Prepared For - All Client Names */}
          {allClientNames && (
            <p className="text-xs uppercase tracking-widest text-white/40">
              Prepared for {allClientNames}
            </p>
          )}

          {/* Project Title */}
          <h1 className="text-3xl font-bold text-white leading-tight">
            {clientInfo.projectName || 'Property Investment'}
          </h1>

          {/* Zone */}
          {(zone || clientInfo.zoneName) && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-white/60" />
                <span className="text-sm text-white/80 font-medium">
                  {zone?.name || clientInfo.zoneName}
                </span>
              </div>
            </div>
          )}

          {/* Developer Row */}
          {clientInfo.developer && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Building className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm text-white font-medium">{clientInfo.developer}</span>
            </div>
          )}

          {/* Price + Unit Details */}
          <div className="space-y-1">
            <p className="text-2xl font-bold text-amber-400">
              {formatCurrency(calculations.basePrice, currency, rate)}
            </p>
            <p className="text-xs text-white/50 uppercase tracking-wide">
              {[
                clientInfo.unit ? `Unit ${clientInfo.unit}` : null,
                clientInfo.unitType,
                unitSizeSqft ? `${unitSizeSqft.toLocaleString()} SQFT${unitSizeM2 ? ` (${unitSizeM2} m²)` : ''}` : null
              ].filter(Boolean).join(' | ') || 'Unit Details'}
            </p>
          </div>

          {/* Key Features */}
          {selectedDifferentiators.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-white/40 uppercase tracking-wide">Key Features</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedDifferentiators.map(d => (
                  <span 
                    key={d.id}
                    className="px-2 py-1 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                  >
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hero Image - Mobile */}
        <div className="h-48 relative overflow-hidden flex-shrink-0">
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
            <div className="w-full h-full bg-gradient-to-br from-theme-bg-alt via-theme-card to-theme-bg-alt flex items-center justify-center">
              <Building className="w-16 h-16 text-white/20" />
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout - Full Height with taller banner */}
      <div className="hidden md:flex md:flex-col h-full flex-1 min-h-[280px] lg:min-h-[320px] xl:min-h-[360px]">
        {/* Full Background Hero Image - Absolute positioned */}
        <div className="absolute inset-0 overflow-hidden flex-1">
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
            <div className="w-full h-full bg-gradient-to-br from-theme-bg-alt via-theme-card to-theme-bg-alt flex items-center justify-center">
              <Building className="w-32 h-32 text-white/10" />
            </div>
          )}
          {/* Left-side gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
        </div>
        
        {/* Flowing Text Content - Left Aligned, Full Height */}
        <div className="relative z-10 h-full flex-1 p-6 lg:p-8 xl:p-10 flex flex-col justify-center">
          <div className="flex flex-col gap-5 lg:gap-6 w-[45%] min-w-[320px] max-w-[520px]">
            
            {/* Prepared For - All Client Names */}
            <motion.p 
              className="text-xs uppercase tracking-widest text-white/40"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              {allClientNames ? `Prepared for ${allClientNames}` : 'Investment Opportunity'}
            </motion.p>

            {/* Project Title - Larger, amber color */}
            <motion.h1 
              className="text-5xl lg:text-6xl xl:text-7xl font-bold text-amber-400 leading-tight drop-shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {clientInfo.projectName || 'Property Investment'}
            </motion.h1>

            {/* Property Price - Prominent */}
            <motion.div 
              className="space-y-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <p className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight">
                {formatCurrency(calculations.basePrice, currency, rate)}
              </p>
              <p className="text-sm text-white/50 uppercase tracking-wide">
                Property Price
              </p>
            </motion.div>

            {/* Zone + Location */}
            <motion.div 
              className="flex items-center gap-2 flex-wrap"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white/80 font-medium">
                  {zone?.name || clientInfo.zoneName || 'Dubai'}
                </span>
              </div>
            </motion.div>

            {/* Developer Row */}
            {clientInfo.developer && (
              <motion.div 
                className="flex items-center gap-3 py-2 px-3 -mx-3 rounded-lg"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Building className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm text-white font-medium">{clientInfo.developer}</span>
              </motion.div>
            )}

            {/* Unit Details Row */}
            <motion.div 
              className="flex items-center gap-3 flex-wrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              <p className="text-sm text-white/60 uppercase tracking-wide">
                {[
                  clientInfo.unit ? `Unit ${clientInfo.unit}` : null,
                  clientInfo.unitType,
                  unitSizeSqft ? `${unitSizeSqft.toLocaleString()} SQFT${unitSizeM2 ? ` (${unitSizeM2} m²)` : ''}` : null
                ].filter(Boolean).join(' • ') || 'Unit Details'}
              </p>
            </motion.div>

            {/* Key Features */}
            {selectedDifferentiators.length > 0 && (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <p className="text-xs text-white/40 uppercase tracking-wide">Key Features</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDifferentiators.map((d, i) => (
                    <motion.span 
                      key={d.id}
                      className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.55 + i * 0.05, duration: 0.3 }}
                    >
                      {d.name}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyShowcase;
