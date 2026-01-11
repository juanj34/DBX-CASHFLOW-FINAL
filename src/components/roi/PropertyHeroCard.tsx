import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Building, Building2, Home, Ruler, Users, ChevronRight, Pencil, Plus, Sparkles, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { UNIT_TYPES, Client } from "./ClientUnitModal";
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

// Status badge helper for construction status
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

  // Fetch developer by ID or name
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

  // Fetch project by ID or name
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

  // Fetch zone for maturity info
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

  // Get clients array, handling legacy single client format
  const clients = data.clients?.length > 0 
    ? data.clients 
    : data.clientName 
      ? [{ id: '1', name: data.clientName, country: data.clientCountry || '' }]
      : [];

  const hasData = data.developer || clients.length > 0 || data.unit || data.projectName;

  // Get background image
  const backgroundImage = heroImageUrl || buildingRenderUrl;
  
  const statusBadge = getStatusBadge(project?.construction_status);
  const maturityBadge = getMaturityBadge(zone?.maturity_level);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }
    }
  };

  if (!hasData) {
    return (
      <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4 mb-4">
        {!readOnly && onEditClick ? (
          <div 
            onClick={onEditClick}
            className="border border-dashed border-[#2a3142] rounded-xl p-6 flex items-center justify-center cursor-pointer hover:bg-[#0d1117] hover:border-[#CCFF00]/30 transition-all group"
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-[#CCFF00]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#CCFF00]/20 transition-colors">
                <Plus className="w-6 h-6 text-[#CCFF00]" />
              </div>
              <p className="text-gray-400 text-sm font-medium">{t('clickToAddClientInfo')}</p>
              <p className="text-gray-500 text-xs mt-1">Developer, Project & Client Details</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No property information</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <motion.div 
        className="relative overflow-hidden rounded-2xl mb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background Image with Ken Burns effect */}
        {backgroundImage && (
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute inset-0 scale-110"
              animate={{ 
                scale: [1.1, 1.15, 1.1],
                x: [0, -5, 0],
                y: [0, -3, 0]
              }}
              transition={{ 
                duration: 20, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <img 
                src={backgroundImage} 
                alt="Property" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/80 to-[#0d1117]/40" />
            <div className="absolute inset-0 backdrop-blur-[2px]" />
          </div>
        )}

        {/* Content Container - Glass Panel */}
        <div className={cn(
          "relative p-5 md:p-6",
          !backgroundImage && "bg-[#1a1f2e] border border-[#2a3142]"
        )}>
          {/* Edit Button - Top Right */}
          {!readOnly && onEditClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditClick}
              className="absolute top-4 right-4 z-10 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-sm"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}

          {/* Main Content Grid */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Developer Section - Clickable */}
            <motion.div 
              variants={itemVariants}
              className={cn(
                "group relative bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10",
                "transition-all duration-300 lg:w-[240px] shrink-0",
                developer && "cursor-pointer hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5"
              )}
              onClick={() => developer && setDeveloperModalOpen(true)}
              whileHover={developer ? { scale: 1.01 } : undefined}
            >
              <div className="flex items-center gap-3">
                {/* Developer Logo */}
                {developer?.logo_url ? (
                  <div className="w-12 h-12 rounded-xl bg-white/10 p-2 flex items-center justify-center shrink-0">
                    <img 
                      src={developer.logo_url} 
                      alt={data.developer} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#CCFF00]/20 flex items-center justify-center shrink-0">
                    <Building className="w-6 h-6 text-[#CCFF00]" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-white/50 font-medium">Developer</p>
                  <p className="text-white font-semibold text-sm truncate">{data.developer}</p>
                  {developer?.founded_year && (
                    <p className="text-[11px] text-white/40 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Est. {developer.founded_year}
                    </p>
                  )}
                </div>

                {/* Trust Score Ring */}
                {trustScore > 0 && (
                  <TrustScoreRing score={trustScore} size={48} className="shrink-0" />
                )}
              </div>

              {/* Tier Badge */}
              {trustScore > 0 && (
                <div 
                  className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: tier.bgColor, color: tier.color }}
                >
                  <span>{tier.emoji}</span>
                  <span>{tier.label}</span>
                </div>
              )}

              {/* Hover indicator */}
              {developer && (
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white/50 flex items-center gap-0.5">
                    View Details <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              )}
            </motion.div>

            {/* Project Section - Clickable */}
            <motion.div 
              variants={itemVariants}
              className={cn(
                "group relative flex-1 bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10",
                "transition-all duration-300",
                project && "cursor-pointer hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5"
              )}
              onClick={() => project && setProjectModalOpen(true)}
              whileHover={project ? { scale: 1.005 } : undefined}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-white/50 font-medium mb-1">Project</p>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 leading-tight">
                    {data.projectName || 'Unnamed Project'}
                  </h2>

                  {/* Badges Row */}
                  <div className="flex flex-wrap gap-2">
                    {/* Construction Status Badge */}
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1",
                      statusBadge.color
                    )}>
                      <span>{statusBadge.icon}</span>
                      {statusBadge.label}
                    </span>

                    {/* Zone Badge */}
                    {data.zoneName && (
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1",
                        maturityBadge ? maturityBadge.color : "bg-white/10 text-white/70 border-white/20"
                      )}>
                        {maturityBadge && <span>{maturityBadge.emoji}</span>}
                        <MapPin className="w-3 h-3" />
                        {data.zoneName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Project Logo */}
                {project?.logo_url && (
                  <div className="w-16 h-16 rounded-xl bg-white/10 p-2 flex items-center justify-center shrink-0">
                    <img 
                      src={project.logo_url} 
                      alt={data.projectName} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Hover indicator */}
              {project && (
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white/50 flex items-center gap-0.5">
                    View Details <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Property Details Row */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4"
          >
            {/* Unit */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 text-center border border-white/5 hover:border-white/10 transition-colors">
              <Home className="w-4 h-4 text-[#CCFF00] mx-auto mb-1.5" />
              <p className="text-[10px] text-white/50 uppercase tracking-wide">Unit</p>
              <p className="text-sm font-bold text-white mt-0.5">{data.unit || '—'}</p>
            </div>

            {/* Type */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 text-center border border-white/5 hover:border-white/10 transition-colors">
              <Building2 className="w-4 h-4 text-cyan-400 mx-auto mb-1.5" />
              <p className="text-[10px] text-white/50 uppercase tracking-wide">Type</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {unitType ? (language === 'es' ? unitType.labelEs : unitType.labelEn) : '—'}
                {data.bedrooms && (data.unitType === 'villa' || data.unitType === 'townhouse') && (
                  <span className="text-white/60 font-normal"> ({data.bedrooms}BR)</span>
                )}
              </p>
            </div>

            {/* Size */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 text-center border border-white/5 hover:border-white/10 transition-colors">
              <Ruler className="w-4 h-4 text-purple-400 mx-auto mb-1.5" />
              <p className="text-[10px] text-white/50 uppercase tracking-wide">Size</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {data.unitSizeSqf > 0 ? `${data.unitSizeSqf.toLocaleString()} sqf` : '—'}
              </p>
              {data.unitSizeM2 > 0 && (
                <p className="text-[10px] text-white/40 mt-0.5">({data.unitSizeM2.toLocaleString()} m²)</p>
              )}
            </div>

            {/* Clients */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 text-center border border-white/5 hover:border-white/10 transition-colors">
              <Users className="w-4 h-4 text-[#00EAFF] mx-auto mb-1.5" />
              <p className="text-[10px] text-white/50 uppercase tracking-wide">
                {clients.length > 1 ? 'Clients' : 'Client'}
              </p>
              <div className="mt-0.5">
                {clients.length > 0 ? (
                  clients.slice(0, 2).map((client) => {
                    const country = getCountryByCode(client.country);
                    return (
                      <p key={client.id} className="text-sm font-bold text-white flex items-center justify-center gap-1">
                        <span className="truncate max-w-[100px]">{client.name}</span>
                        {country && <span className="text-xs">{country.flag}</span>}
                      </p>
                    );
                  })
                ) : (
                  <p className="text-sm font-bold text-white">—</p>
                )}
                {clients.length > 2 && (
                  <p className="text-[10px] text-white/50">+{clients.length - 2} more</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Developer Modal */}
      {developer && (
        <DeveloperInfoModal
          developerId={developer.id}
          open={developerModalOpen}
          onOpenChange={setDeveloperModalOpen}
        />
      )}

      {/* Project Modal */}
      {project && (
        <ProjectInfoModal
          project={project}
          zoneName={data.zoneName}
          open={projectModalOpen}
          onOpenChange={setProjectModalOpen}
        />
      )}
    </>
  );
};

export default PropertyHeroCard;
