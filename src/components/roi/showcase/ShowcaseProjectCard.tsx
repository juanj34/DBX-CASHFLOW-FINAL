import React, { useEffect, useState } from 'react';
import { Building2, MapPin, TrendingUp, DollarSign, Hammer, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface Zone {
  id: string;
  name: string;
  maturity_level: number | null;
  maturity_label: string | null;
  investment_focus: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  tagline: string | null;
}

interface Project {
  id: string;
  name: string | null;
  logo_url: string | null;
  construction_status: 'off_plan' | 'under_construction' | 'ready' | null;
  delivery_date: string | null;
}

interface ShowcaseProjectCardProps {
  projectName: string;
  zoneName?: string;
  projectId?: string;
  zoneId?: string;
  className?: string;
}

const getMaturityBadge = (level: number | null, label: string | null) => {
  if (level === null) return null;
  
  if (level <= 25) {
    return { label: label || 'EMERGING', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', emoji: '🟠' };
  }
  if (level <= 50) {
    return { label: label || 'DEVELOPING', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', emoji: '📈' };
  }
  if (level <= 75) {
    return { label: label || 'GROWING', color: 'bg-green-500/20 text-green-400 border-green-500/30', emoji: '🌱' };
  }
  if (level <= 90) {
    return { label: label || 'MATURE', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', emoji: '🏢' };
  }
  return { label: label || 'ESTABLISHED', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', emoji: '🏛️' };
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'off_plan':
      return { label: 'OFF-PLAN', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Building2 };
    case 'under_construction':
      return { label: 'BUILDING', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Hammer };
    case 'ready':
      return { label: 'READY', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle };
    default:
      return null;
  }
};

export const ShowcaseProjectCard: React.FC<ShowcaseProjectCardProps> = ({
  projectName,
  zoneName,
  projectId,
  zoneId,
  className,
}) => {
  const { language } = useLanguage();
  const [project, setProject] = useState<Project | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch project data
      if (projectId) {
        const { data } = await supabase
          .from('projects')
          .select('id, name, logo_url, construction_status, delivery_date')
          .eq('id', projectId)
          .maybeSingle();
        if (data) setProject(data);
      } else if (projectName) {
        const { data } = await supabase
          .from('projects')
          .select('id, name, logo_url, construction_status, delivery_date')
          .ilike('name', `%${projectName}%`)
          .maybeSingle();
        if (data) setProject(data);
      }

      // Fetch zone data
      if (zoneId) {
        const { data } = await supabase
          .from('zones')
          .select('id, name, maturity_level, maturity_label, investment_focus, price_range_min, price_range_max, tagline')
          .eq('id', zoneId)
          .maybeSingle();
        if (data) setZone(data);
      } else if (zoneName) {
        const { data } = await supabase
          .from('zones')
          .select('id, name, maturity_level, maturity_label, investment_focus, price_range_min, price_range_max, tagline')
          .ilike('name', `%${zoneName}%`)
          .maybeSingle();
        if (data) setZone(data);
      }
    };
    
    fetchData();
  }, [projectId, projectName, zoneId, zoneName]);

  const maturityBadge = zone ? getMaturityBadge(zone.maturity_level, zone.maturity_label) : null;
  const statusBadge = project ? getStatusBadge(project.construction_status) : null;

  const formatPriceRange = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    const formatNum = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : n.toString();
    if (min && max) return `${formatNum(min)} - ${formatNum(max)} AED/sqft`;
    if (min) return `From ${formatNum(min)} AED/sqft`;
    if (max) return `Up to ${formatNum(max)} AED/sqft`;
    return null;
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl p-4",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80",
        "border border-slate-700/50",
        "backdrop-blur-sm",
        className
      )}
    >
      {/* Accent glow */}
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-2xl rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        {/* Header with logo */}
        <div className="flex items-start gap-3 mb-3">
          {project?.logo_url ? (
            <img 
              src={project.logo_url} 
              alt={projectName}
              className="w-12 h-12 rounded-lg object-contain bg-white/10 p-1"
            />
          ) : (
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Project</p>
            <p className="text-lg font-semibold text-white truncate">{projectName || 'Project'}</p>
          </div>
        </div>

        {/* Zone info */}
        <div className="flex items-center gap-2 text-slate-300 mb-3">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-sm">{zone?.name || zoneName || 'Dubai'}</span>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2 mb-3">
          {maturityBadge && (
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
              maturityBadge.color
            )}>
              <span>{maturityBadge.emoji}</span>
              <span>{maturityBadge.label}</span>
            </span>
          )}
          {statusBadge && (
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
              statusBadge.color
            )}>
              <statusBadge.icon className="w-3 h-3" />
              <span>{statusBadge.label}</span>
            </span>
          )}
        </div>

        {/* Zone details */}
        {zone && (
          <div className="space-y-2 pt-2 border-t border-slate-700/50">
            {zone.investment_focus && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">Focus:</span>
                <span className="text-white">{zone.investment_focus}</span>
              </div>
            )}
            {(zone.price_range_min || zone.price_range_max) && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">{formatPriceRange(zone.price_range_min, zone.price_range_max)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowcaseProjectCard;
