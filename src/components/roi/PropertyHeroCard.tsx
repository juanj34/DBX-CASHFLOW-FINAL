import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Building, Building2, Home, Ruler, Users, Pencil, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { UNIT_TYPES } from "./ClientUnitModal";
import { getCountryByCode } from "@/data/countries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperInfoModal } from "./DeveloperInfoModal";
import { ProjectInfoModal } from "./ProjectInfoModal";
import { TrustScoreRing } from "./showcase/TrustScoreRing";
import { calculateTrustScore, getTierInfo } from "./developerTrustScore";
import { cn } from "@/lib/utils";
import type { ClientUnitData } from "./ClientUnitInfo";

interface PropertyHeroCardProps {
  data: ClientUnitData;
  heroImageUrl?: string | null;
  buildingRenderUrl?: string | null;
  onEditClick?: () => void;
  readOnly?: boolean;
}

// Status badge helper
const getStatusBadge = (status: string | null | undefined) => {
  switch (status) {
    case 'ready':
      return { label: 'READY', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '✓' };
    case 'under_construction':
      return { label: 'BUILDING', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '🏗️' };
    case 'off_plan':
    default:
      return { label: 'OFF-PLAN', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: '📋' };
  }
};

// Zone maturity badge helper
const getMaturityBadge = (maturityLevel: number | null | undefined) => {
  if (!maturityLevel) return null;
  if (maturityLevel >= 9) return { label: 'ESTABLISHED', emoji: '🏛️', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
  if (maturityLevel >= 7) return { label: 'MATURE', emoji: '🌳', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  if (maturityLevel >= 5) return { label: 'GROWING', emoji: '📈', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  if (maturityLevel >= 3) return { label: 'DEVELOPING', emoji: '🔨', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  return { label: 'EMERGING', emoji: '🌱', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
};

export const PropertyHeroCard = ({ 
  data, 
  heroImageUrl, 
  buildingRenderUrl, 
  onEditClick, 
  readOnly = false 
}: PropertyHeroCardProps) => {
  const { language, t } = useLanguage();
  const [developerModalOpen, setDeveloperModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const unitType = UNIT_TYPES.find(u => u.value === data.unitType);

  // Fetch developer
  const { data: developer } = useQuery({
    queryKey: ['developer-info', data.developerId, data.developer],
    queryFn: async () => {
      if (data.developerId) {
        const { data: dev } = await supabase
          .from('developers')
          .select('*')
          .eq('id', data.developerId)
          .maybeSingle();
        return dev;
      }
      if (data.developer) {
        const { data: dev } = await supabase
          .from('developers')
          .select('*')
          .ilike('name', data.developer)
          .maybeSingle();
        return dev;
      }
      return null;
    },
    enabled: !!(data.developerId || data.developer),
  });

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ['project-info', data.projectId, data.projectName],
    queryFn: async () => {
      if (data.projectId) {
        const { data: proj } = await supabase
          .from('projects')
          .select('*')
          .eq('id', data.projectId)
          .maybeSingle();
        return proj;
      }
      if (data.projectName) {
        const { data: proj } = await supabase
          .from('projects')
          .select('*')
          .ilike('name', data.projectName)
          .maybeSingle();
        return proj;
      }
      return null;
    },
    enabled: !!(data.projectId || data.projectName),
  });

  // Fetch zone
  const { data: zone } = useQuery({
    queryKey: ['zone-info', data.zoneId],
    queryFn: async () => {
      if (data.zoneId) {
        const { data: z } = await supabase
          .from('zones')
          .select('*')
          .eq('id', data.zoneId)
          .maybeSingle();
        return z;
      }
      return null;
    },
    enabled: !!data.zoneId,
  });

  // Calculate trust score
  const trustScore = useMemo(() => {
    if (!developer) return 0;
    return calculateTrustScore(developer);
  }, [developer]);

  const tier = useMemo(() => getTierInfo(trustScore), [trustScore]);

  // Get clients array
  const clients = data.clients?.length > 0 
    ? data.clients 
    : data.clientName 
      ? [{ id: '1', name: data.clientName, country: data.clientCountry || '' }]
      : [];

  const hasData = data.developer || clients.length > 0 || data.unit || data.projectName;

  // Background image - prefer project hero image
  const backgroundImage = project?.hero_image_url || heroImageUrl || buildingRenderUrl;
  
  const statusBadge = getStatusBadge(project?.construction_status);
  const maturityBadge = getMaturityBadge(zone?.maturity_level);

  if (!hasData) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 mb-4">
        {!readOnly && onEditClick ? (
          <div 
            onClick={onEditClick}
            className="border border-dashed border-border rounded-lg p-4 flex items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all group"
          >
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">{t('clickToAddClientInfo')}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-muted-foreground text-sm">No property information</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <motion.div 
        className="relative overflow-hidden rounded-xl mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Background Image Layer */}
        <div className="absolute inset-0">
          {backgroundImage ? (
            <>
              <motion.img 
                src={backgroundImage} 
                alt="Property" 
                className="w-full h-full object-cover"
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 8, ease: "easeOut" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d1117]/95 via-[#0d1117]/80 to-[#0d1117]/60" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1f2e] via-[#0d1117] to-[#1a1f2e]" />
          )}
        </div>

        {/* Content - 2 Rows */}
        <div className="relative px-4 py-3 md:px-5 md:py-4">
          
          {/* Row 1: Developer | Project */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-0">
            
            {/* Left: Developer - Clickable */}
            <div 
              onClick={() => developer && setDeveloperModalOpen(true)}
              className={cn(
                "flex items-center gap-2.5 shrink-0",
                developer && "cursor-pointer group"
              )}
            >
              {/* Developer Logo */}
              {developer?.logo_url ? (
                <div className="w-9 h-9 rounded-lg bg-white/10 p-1.5 flex items-center justify-center shrink-0">
                  <img 
                    src={developer.logo_url} 
                    alt={data.developer} 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-white font-semibold text-sm transition-colors",
                  developer && "group-hover:text-[#CCFF00]"
                )}>
                  {data.developer}
                </span>
                
                {/* Tier Badge */}
                {trustScore > 0 && (
                  <span 
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={{ backgroundColor: tier.bgColor, color: tier.color }}
                  >
                    {tier.emoji} {tier.label}
                  </span>
                )}
              </div>

              {/* Trust Score Ring */}
              {trustScore > 0 && (
                <TrustScoreRing score={trustScore} size={36} className="shrink-0" />
              )}
            </div>

            {/* Vertical Divider - Desktop only */}
            <div className="hidden md:block h-8 w-px bg-white/20 mx-4" />

            {/* Right: Project - Clickable */}
            <div 
              onClick={() => project && setProjectModalOpen(true)}
              className={cn(
                "flex-1 flex items-center gap-2.5",
                project && "cursor-pointer group"
              )}
            >
              <h2 className={cn(
                "text-lg md:text-xl font-bold text-white transition-colors",
                project && "group-hover:text-[#CCFF00]"
              )}>
                {data.projectName || 'Unnamed Project'}
              </h2>
              
              {/* Badges */}
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-0.5",
                  statusBadge.color
                )}>
                  <span>{statusBadge.icon}</span>
                  {statusBadge.label}
                </span>

                {data.zoneName && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-0.5",
                    maturityBadge ? maturityBadge.color : "bg-white/10 text-white/70 border-white/20"
                  )}>
                    {maturityBadge && <span>{maturityBadge.emoji}</span>}
                    <MapPin className="w-2.5 h-2.5" />
                    {data.zoneName}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Button */}
            {!readOnly && onEditClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick();
                }}
                className="absolute top-2 right-2 md:relative md:top-auto md:right-auto h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Row 2: Property Details - Inline */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5 text-sm text-white/80">
            {/* Unit */}
            {data.unit && (
              <>
                <span className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-[#CCFF00]" />
                  <span className="text-white/50">Unit</span>
                  <span className="text-white font-medium">{data.unit}</span>
                </span>
                <span className="text-white/30 hidden sm:inline">•</span>
              </>
            )}

            {/* Type */}
            {unitType && (
              <>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-white font-medium">
                    {language === 'es' ? unitType.labelEs : unitType.labelEn}
                    {data.bedrooms && ` ${data.bedrooms}BR`}
                  </span>
                </span>
                <span className="text-white/30 hidden sm:inline">•</span>
              </>
            )}

            {/* Size */}
            {data.unitSizeSqf > 0 && (
              <>
                <span className="flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-white font-medium">{data.unitSizeSqf.toLocaleString()} sqf</span>
                </span>
                <span className="text-white/30 hidden sm:inline">•</span>
              </>
            )}

            {/* Clients */}
            {clients.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#00EAFF]" />
                {clients.slice(0, 2).map((client, i) => {
                  const country = getCountryByCode(client.country);
                  return (
                    <span key={client.id} className="flex items-center gap-1">
                      <span className="text-white font-medium">{client.name}</span>
                      {country && <span className="text-xs">{country.flag}</span>}
                      {i < Math.min(clients.length, 2) - 1 && <span className="text-white/30">,</span>}
                    </span>
                  );
                })}
                {clients.length > 2 && (
                  <span className="text-white/50 text-xs">+{clients.length - 2}</span>
                )}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <DeveloperInfoModal
        developerId={developer?.id || null}
        open={developerModalOpen}
        onOpenChange={setDeveloperModalOpen}
      />

      <ProjectInfoModal
        project={project}
        zoneName={data.zoneName}
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
      />
    </>
  );
};
