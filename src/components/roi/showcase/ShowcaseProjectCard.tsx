import React, { useEffect, useState } from 'react';
import { Building2, MapPin, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { ZoneComparisonChart } from './ZoneComparisonChart';

interface Zone {
  id: string;
  name: string;
  maturity_level: number | null;
  maturity_label: string | null;
  investment_focus: string | null;
  construction_appreciation: number | null;
  growth_appreciation: number | null;
  mature_appreciation: number | null;
}

interface Project {
  id: string;
  name: string | null;
  logo_url: string | null;
  construction_status: 'off_plan' | 'under_construction' | 'ready' | null;
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
  if (level <= 25) return { label: label || 'EMERGING', color: 'bg-orange-500/20 text-orange-400', emoji: '🟠' };
  if (level <= 50) return { label: label || 'DEVELOPING', color: 'bg-yellow-500/20 text-yellow-400', emoji: '📈' };
  if (level <= 75) return { label: label || 'GROWING', color: 'bg-green-500/20 text-green-400', emoji: '🌱' };
  if (level <= 90) return { label: label || 'MATURE', color: 'bg-blue-500/20 text-blue-400', emoji: '🏢' };
  return { label: label || 'ESTABLISHED', color: 'bg-slate-500/20 text-slate-400', emoji: '🏛️' };
};

const getStatusBadge = (status: string | null) => {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    'off_plan': { label: 'OFF-PLAN', color: 'bg-blue-500/20 text-blue-400', icon: '🏗️' },
    'under_construction': { label: 'BUILDING', color: 'bg-yellow-500/20 text-yellow-400', icon: '🔨' },
    'ready': { label: 'READY', color: 'bg-green-500/20 text-green-400', icon: '✅' },
  };
  return status ? map[status] || null : null;
};

export const ShowcaseProjectCard: React.FC<ShowcaseProjectCardProps> = ({
  projectName,
  zoneName,
  projectId,
  zoneId,
  className,
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (projectId) {
        const { data } = await supabase.from('projects').select('id, name, logo_url, construction_status').eq('id', projectId).maybeSingle();
        if (data) setProject(data);
      } else if (projectName) {
        const { data } = await supabase.from('projects').select('id, name, logo_url, construction_status').ilike('name', `%${projectName}%`).maybeSingle();
        if (data) setProject(data);
      }

      if (zoneId) {
        const { data } = await supabase.from('zones').select('id, name, maturity_level, maturity_label, investment_focus, construction_appreciation, growth_appreciation, mature_appreciation').eq('id', zoneId).maybeSingle();
        if (data) setZone(data);
      } else if (zoneName) {
        const { data } = await supabase.from('zones').select('id, name, maturity_level, maturity_label, investment_focus, construction_appreciation, growth_appreciation, mature_appreciation').ilike('name', `%${zoneName}%`).maybeSingle();
        if (data) setZone(data);
      }
    };
    fetchData();
  }, [projectId, projectName, zoneId, zoneName]);

  const maturityBadge = zone ? getMaturityBadge(zone.maturity_level, zone.maturity_label) : null;
  const statusBadge = project ? getStatusBadge(project.construction_status) : null;
  const hasAppreciation = zone?.construction_appreciation || zone?.growth_appreciation || zone?.mature_appreciation;

  return (
    <div className={cn(
      "bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-lg p-2.5 border border-slate-700/50 backdrop-blur-sm",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {project?.logo_url ? (
          <img src={project.logo_url} alt={projectName} className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Project</p>
          <p className="text-sm font-semibold text-white truncate">{project?.name || projectName || 'Project'}</p>
        </div>
      </div>

      {/* Zone & Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {(zone?.name || zoneName) && (
          <div className="flex items-center gap-1 text-slate-300">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] truncate max-w-[100px]">{zone?.name || zoneName}</span>
          </div>
        )}
        {maturityBadge && (
          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium", maturityBadge.color)}>
            {maturityBadge.emoji} {maturityBadge.label}
          </span>
        )}
        {statusBadge && (
          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium", statusBadge.color)}>
            {statusBadge.icon} {statusBadge.label}
          </span>
        )}
      </div>

      {/* Zone Appreciation Comparison */}
      {hasAppreciation && (
        <ZoneComparisonChart
          zoneRates={{
            construction: zone?.construction_appreciation || 0,
            growth: zone?.growth_appreciation || 0,
            mature: zone?.mature_appreciation || 0,
          }}
        />
      )}

      {/* Investment Focus */}
      {zone?.investment_focus && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-700/30">
          <TrendingUp className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] text-slate-400">Focus:</span>
          <span className="text-[10px] text-white font-medium">{zone.investment_focus}</span>
        </div>
      )}
    </div>
  );
};

export default ShowcaseProjectCard;
