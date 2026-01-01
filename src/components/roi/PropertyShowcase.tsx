import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { OIInputs, OICalculations } from './useOICalculations';
import { Currency, formatCurrency } from './currencyUtils';
import { Building, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ValueDifferentiator, VALUE_DIFFERENTIATORS } from './valueDifferentiators';
import { calculateTrustScore, getTierInfo, Developer } from './developerTrustScore';
import { TrustScoreRing } from './showcase/TrustScoreRing';
import { Badge } from '@/components/ui/badge';

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

// Helper to get maturity badge info
const getMaturityBadge = (level: number | null, label: string | null) => {
  if (level === null) return { emoji: '📍', color: 'bg-white/20 text-white/70' };
  if (level <= 25) return { emoji: '🌱', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
  if (level <= 50) return { emoji: '📈', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
  if (level <= 75) return { emoji: '🏗️', color: 'bg-green-500/20 text-green-300 border-green-500/30' };
  if (level <= 90) return { emoji: '🏢', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  return { emoji: '🏛️', color: 'bg-slate-400/20 text-slate-300 border-slate-400/30' };
};

interface Zone {
  id: string;
  name: string;
  maturity_level: number | null;
  maturity_label: string | null;
  investment_focus: string | null;
}

interface Project {
  id: string;
  name: string | null;
  image_url: string | null;
  hero_image_url: string | null;
  logo_url: string | null;
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
  developerId,
  projectId,
  zoneId,
  customDifferentiators = [],
  className,
}) => {
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  const [project, setProject] = useState<Project | null>(null);

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
        const { data } = await supabase.from('zones').select('id, name, maturity_level, maturity_label, investment_focus').eq('id', id).maybeSingle();
        if (data) setZone(data);
      } else if (clientInfo.zoneName) {
        const { data } = await supabase.from('zones').select('id, name, maturity_level, maturity_label, investment_focus').ilike('name', `%${clientInfo.zoneName}%`).maybeSingle();
        if (data) setZone(data);
      }
    };
    fetchZone();
  }, [zoneId, clientInfo.zoneId, inputs.zoneId, clientInfo.zoneName]);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (projectId) {
        const { data } = await supabase.from('projects').select('id, name, image_url, hero_image_url, logo_url').eq('id', projectId).maybeSingle();
        if (data) setProject(data);
      } else if (clientInfo.projectName) {
        const { data } = await supabase.from('projects').select('id, name, image_url, hero_image_url, logo_url').ilike('name', clientInfo.projectName).maybeSingle();
        if (data) setProject(data);
      }
    };
    fetchProject();
  }, [projectId, clientInfo.projectName]);

  // Use project image from DB first, then fallback to props
  const displayImage = project?.hero_image_url || project?.image_url || heroImageUrl || buildingRenderUrl;

  // Calculate trust score
  const trustScore = developer ? calculateTrustScore(developer) : null;
  const tierInfo = trustScore ? getTierInfo(trustScore) : null;

  // Get selected differentiators details (no appreciation bonus calculation)
  const allDifferentiators = [...VALUE_DIFFERENTIATORS, ...customDifferentiators];
  const selectedDifferentiators = inputs.valueDifferentiators
    ? allDifferentiators.filter(d => inputs.valueDifferentiators?.includes(d.id))
    : [];

  // Format all client names
  const allClientNames = formatClientNames(clientInfo);
  
  // Get maturity badge
  const maturityBadge = getMaturityBadge(zone?.maturity_level ?? null, zone?.maturity_label ?? null);
  
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

          {/* Zone + Maturity Badge */}
          {(zone || clientInfo.zoneName) && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-white/60" />
                <span className="text-sm text-white/80 font-medium">
                  {zone?.name || clientInfo.zoneName}
                </span>
              </div>
              {zone?.maturity_label && (
                <Badge variant="outline" className={cn("text-[10px] border", maturityBadge.color)}>
                  {maturityBadge.emoji} {zone.maturity_label}
                </Badge>
              )}
            </div>
          )}

          {/* Developer Row */}
          {(developer || clientInfo.developer) && (
            <div className="flex items-center gap-3">
              {developer?.white_logo_url ? (
                <img src={developer.white_logo_url} alt="" className="w-8 h-8 rounded-lg object-contain" />
              ) : developer?.logo_url ? (
                <img src={developer.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain filter brightness-0 invert opacity-90" />
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

          {/* Key Features (renamed from Asset Uniqueness) */}
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
            
            {/* Prepared For - All Client Names */}
            <motion.p 
              className="text-xs uppercase tracking-widest text-white/40"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              {allClientNames ? `Prepared for ${allClientNames}` : 'Investment Opportunity'}
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

            {/* Zone + Maturity Badge */}
            <motion.div 
              className="flex items-center gap-2 flex-wrap"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white/80 font-medium">
                  {zone?.name || clientInfo.zoneName || 'Dubai'}
                </span>
              </div>
              {zone?.maturity_label && (
                <Badge variant="outline" className={cn("text-[10px] border", maturityBadge.color)}>
                  {maturityBadge.emoji} {zone.maturity_label}
                </Badge>
              )}
            </motion.div>

            {/* Developer Trust Row */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {developer?.white_logo_url ? (
                <img src={developer.white_logo_url} alt="" className="w-9 h-9 rounded-lg object-contain" />
              ) : developer?.logo_url ? (
                <img src={developer.logo_url} alt="" className="w-9 h-9 rounded-lg object-contain filter brightness-0 invert opacity-90" />
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

            {/* Price + Unit Details */}
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
                {[
                  clientInfo.unit ? `Unit ${clientInfo.unit}` : null,
                  clientInfo.unitType,
                  unitSizeSqft ? `${unitSizeSqft.toLocaleString()} SQFT${unitSizeM2 ? ` (${unitSizeM2} m²)` : ''}` : null
                ].filter(Boolean).join(' | ') || 'Unit Details'}
              </p>
            </motion.div>

            {/* Key Features (renamed from Asset Uniqueness) */}
            {selectedDifferentiators.length > 0 && (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <p className="text-xs text-white/40 uppercase tracking-wide">Key Features</p>
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
