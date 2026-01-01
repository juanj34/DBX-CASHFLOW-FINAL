import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { OIInputs, OICalculations } from './useOICalculations';
import { Currency, formatCurrency } from './currencyUtils';
import { Building, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ValueDifferentiator, VALUE_DIFFERENTIATORS, calculateAppreciationBonus } from './valueDifferentiators';
import { calculateTrustScore, getTierInfo, Developer } from './developerTrustScore';
import { TrustScoreRing } from './showcase/TrustScoreRing';

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

interface Zone {
  id: string;
  name: string;
  maturity_level: number | null;
  maturity_label: string | null;
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

const getMaturityColor = (level: number | null) => {
  if (level === null) return 'bg-white/40';
  if (level <= 25) return 'bg-orange-500';
  if (level <= 50) return 'bg-yellow-500';
  if (level <= 75) return 'bg-green-500';
  if (level <= 90) return 'bg-blue-500';
  return 'bg-slate-400';
};

export const PropertyShowcase: React.FC<PropertyShowcaseProps> = ({
  inputs,
  calculations,
  clientInfo,
  currency,
  rate,
  heroImageUrl,
  buildingRenderUrl,
  developerId,
  zoneId,
  customDifferentiators = [],
  className,
}) => {
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);

  // Fetch developer data
  useEffect(() => {
    const fetchDeveloper = async () => {
      if (developerId) {
        const { data } = await supabase.from('developers').select('*').eq('id', developerId).maybeSingle();
        if (data) setDeveloper(data);
      } else if (clientInfo.developer) {
        const { data } = await supabase.from('developers').select('*').ilike('name', `%${clientInfo.developer}%`).maybeSingle();
        if (data) setDeveloper(data);
      }
    };
    fetchDeveloper();
  }, [developerId, clientInfo.developer]);

  // Fetch zone data
  useEffect(() => {
    const fetchZone = async () => {
      const id = zoneId || clientInfo.zoneId || inputs.zoneId;
      if (id) {
        const { data } = await supabase.from('zones').select('id, name, maturity_level, maturity_label').eq('id', id).maybeSingle();
        if (data) setZone(data);
      } else if (clientInfo.zoneName) {
        const { data } = await supabase.from('zones').select('id, name, maturity_level, maturity_label').ilike('name', `%${clientInfo.zoneName}%`).maybeSingle();
        if (data) setZone(data);
      }
    };
    fetchZone();
  }, [zoneId, clientInfo.zoneId, inputs.zoneId, clientInfo.zoneName]);

  // Use hero image, fallback to building render
  const displayImage = heroImageUrl || buildingRenderUrl;

  // Calculate trust score
  const trustScore = developer ? calculateTrustScore(developer) : null;
  const tierInfo = trustScore ? getTierInfo(trustScore) : null;

  // Calculate appreciation bonus
  const appreciationBonus = inputs.valueDifferentiators?.length 
    ? calculateAppreciationBonus(inputs.valueDifferentiators, customDifferentiators)
    : 0;

  // Get selected differentiators details
  const allDifferentiators = [...VALUE_DIFFERENTIATORS, ...customDifferentiators];
  const selectedDifferentiators = inputs.valueDifferentiators
    ? allDifferentiators.filter(d => inputs.valueDifferentiators?.includes(d.id))
    : [];

  return (
    <div className={cn(
      "relative w-full h-full min-h-0 flex-1 overflow-hidden rounded-2xl flex flex-col",
      className
    )}>
      {/* Mobile Layout */}
      <div className="flex flex-col md:hidden h-full flex-1">
        <div className="flex-1 p-4 space-y-4 bg-gradient-to-br from-theme-bg-alt via-theme-card to-theme-bg-alt overflow-y-auto">
          {/* Prepared For */}
          {clientInfo.clientName && (
            <p className="text-xs uppercase tracking-widest text-white/40">
              Prepared for {clientInfo.clientName}
            </p>
          )}

          {/* Project Title */}
          <h1 className="text-3xl font-bold text-white leading-tight">
            {clientInfo.projectName || 'Property Investment'}
          </h1>

          {/* Zone + Maturity */}
          {(zone || clientInfo.zoneName) && (
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", getMaturityColor(zone?.maturity_level ?? null))} />
              <span className="text-sm text-white/70">
                {zone?.name || clientInfo.zoneName}
                {zone?.maturity_label && (
                  <span className="text-white/40 ml-1">({zone.maturity_label})</span>
                )}
              </span>
            </div>
          )}

          {/* Developer Row */}
          {(developer || clientInfo.developer) && (
            <div className="flex items-center gap-3">
              {developer?.logo_url ? (
                <img src={developer.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Building className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              <span className="text-sm text-white font-medium">{developer?.name || clientInfo.developer}</span>
              {trustScore && tierInfo && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <TrustScoreRing score={trustScore} size={32} />
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold",
                    trustScore >= 9 
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 shadow-lg shadow-amber-500/30" 
                      : trustScore >= 8 
                        ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/20"
                        : "bg-white/10 text-white/70"
                  )}>
                    {tierInfo.label}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Price */}
          <div className="space-y-1">
            <p className="text-2xl font-bold text-amber-400">
              {formatCurrency(calculations.basePrice, currency, rate)}
            </p>
            <p className="text-xs text-white/50 uppercase tracking-wide">
              {clientInfo.unit || 'Unit'} | {clientInfo.unitType || 'Type'} | {inputs.unitSizeSqf?.toLocaleString() || '—'} SQFT
            </p>
          </div>

          {/* Value Badges */}
          {selectedDifferentiators.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-white/40 uppercase tracking-wide">Asset Uniqueness</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedDifferentiators.map(d => (
                  <span 
                    key={d.id}
                    className="px-2 py-1 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                  >
                    {d.name}
                  </span>
                ))}
                {appreciationBonus > 0 && (
                  <span className="px-2 py-1 text-[10px] font-medium rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{appreciationBonus.toFixed(1)}% Growth
                  </span>
                )}
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

      {/* Desktop Layout - Full Height */}
      <div className="hidden md:flex md:flex-col h-full flex-1">
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
        <div className="relative z-10 h-full flex-1 p-6 lg:p-8 flex flex-col justify-center">
          <div className="flex flex-col gap-6 w-[38%] min-w-[320px] max-w-[480px]">
            
            {/* Prepared For */}
            <motion.p 
              className="text-xs uppercase tracking-widest text-white/40"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              {clientInfo.clientName ? `Prepared for ${clientInfo.clientName}` : 'Investment Opportunity'}
            </motion.p>

            {/* Project Title */}
            <motion.h1 
              className="text-4xl lg:text-5xl font-bold text-white leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {clientInfo.projectName || 'Property Investment'}
            </motion.h1>

            {/* Zone + Maturity Status */}
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <span className={cn("w-2.5 h-2.5 rounded-full", getMaturityColor(zone?.maturity_level ?? null))} />
              <span className="text-sm text-white/80">
                {zone?.name || clientInfo.zoneName || 'Dubai'}
              </span>
              {zone?.maturity_label && (
                <span className="text-sm text-white/40">({zone.maturity_label})</span>
              )}
            </motion.div>

            {/* Developer Trust Row */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {developer?.logo_url ? (
                <img src={developer.logo_url} alt="" className="w-9 h-9 rounded-lg object-contain bg-white/10 p-0.5" />
              ) : (clientInfo.developer || developer) && (
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Building className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              <span className="text-sm text-white font-medium">{developer?.name || clientInfo.developer}</span>
              
              {trustScore && tierInfo && (
                <div className="flex items-center gap-2 ml-2">
                  <TrustScoreRing score={trustScore} size={36} />
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold",
                    trustScore >= 9 
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 shadow-lg shadow-amber-500/30" 
                      : trustScore >= 8 
                        ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/20"
                        : "bg-white/10 text-white/70"
                  )}>
                    {tierInfo.emoji} {tierInfo.label}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Price + Unit Specs */}
            <motion.div 
              className="space-y-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <p className="text-3xl lg:text-4xl font-bold text-amber-400">
                {formatCurrency(calculations.basePrice, currency, rate)}
              </p>
              <p className="text-sm text-white/50 uppercase tracking-wide">
                {[clientInfo.unit, clientInfo.unitType, inputs.unitSizeSqf ? `${inputs.unitSizeSqf.toLocaleString()} SQFT` : null]
                  .filter(Boolean)
                  .join(' | ') || 'Unit Details'}
              </p>
            </motion.div>

            {/* Value Differentiators */}
            {selectedDifferentiators.length > 0 && (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <p className="text-xs text-white/40 uppercase tracking-wide">Asset Uniqueness</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDifferentiators.map((d, i) => (
                    <motion.span 
                      key={d.id}
                      className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + i * 0.05, duration: 0.3 }}
                    >
                      {d.name}
                    </motion.span>
                  ))}
                  {appreciationBonus > 0 && (
                    <motion.span 
                      className="px-2.5 py-1 text-xs font-medium rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, duration: 0.3 }}
                    >
                      <TrendingUp className="w-3 h-3" />
                      +{appreciationBonus.toFixed(1)}% Projected Growth
                    </motion.span>
                  )}
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
