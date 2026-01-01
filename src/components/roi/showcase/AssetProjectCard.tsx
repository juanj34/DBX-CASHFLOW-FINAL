import React from 'react';
import { Building2, MapPin, Hammer, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateTrustScore, getTierInfo } from '../developerTrustScore';
import TrustScoreRing from './TrustScoreRing';

interface Developer {
  id: string;
  name: string;
  logo_url?: string | null;
  white_logo_url?: string | null;
  founded_year?: number | null;
  rating_track_record?: number | null;
  rating_quality?: number | null;
  rating_flip_potential?: number | null;
  score_maintenance?: number | null;
}

interface Project {
  id: string;
  name?: string | null;
  logo_url?: string | null;
  construction_status?: string | null;
}

interface Zone {
  id: string;
  name: string;
  maturity_level?: number | null;
  maturity_label?: string | null;
}

interface AssetProjectCardProps {
  project?: Project | null;
  developer?: Developer | null;
  zone?: Zone | null;
  zoneName?: string;
  onDeveloperClick?: () => void;
  onProjectClick?: () => void;
  className?: string;
}

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'ready':
      return { label: 'Ready', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-400/10' };
    case 'under_construction':
      return { label: 'Under Construction', icon: Hammer, color: 'text-amber-400 bg-amber-400/10' };
    case 'off_plan':
    default:
      return { label: 'Off-Plan', icon: Clock, color: 'text-blue-400 bg-blue-400/10' };
  }
};

const getMaturityBadge = (level: number | null, label: string | null) => {
  if (!level) return null;
  const colors: Record<number, string> = {
    1: 'text-purple-400 bg-purple-400/10',
    2: 'text-blue-400 bg-blue-400/10',
    3: 'text-emerald-400 bg-emerald-400/10',
    4: 'text-amber-400 bg-amber-400/10',
    5: 'text-rose-400 bg-rose-400/10',
  };
  return { label: label || `Level ${level}`, color: colors[level] || colors[3] };
};

export const AssetProjectCard: React.FC<AssetProjectCardProps> = ({
  project,
  developer,
  zone,
  zoneName,
  onDeveloperClick,
  onProjectClick,
  className,
}) => {
  const statusBadge = project ? getStatusBadge(project.construction_status) : null;
  const maturityBadge = zone ? getMaturityBadge(zone.maturity_level, zone.maturity_label) : null;
  const trustScore = developer ? calculateTrustScore(developer) : null;
  const tierInfo = trustScore ? getTierInfo(trustScore) : null;

  return (
    <div className={cn(
      "bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-5",
      className
    )}>
      {/* Project Section */}
      {project && (
        <div 
          className={cn(
            "flex items-center gap-3 mb-4 pb-4 border-b border-[#2a3142]",
            onProjectClick && "cursor-pointer hover:opacity-80 transition-opacity"
          )}
          onClick={onProjectClick}
        >
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
            {project.logo_url ? (
              <img src={project.logo_url} alt={project.name || ''} className="w-full h-full object-contain p-1" />
            ) : (
              <Building2 className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Project</p>
            <p className="text-base font-semibold text-white truncate">{project.name || 'Unknown'}</p>
          </div>
          {statusBadge && (
            <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1", statusBadge.color)}>
              <statusBadge.icon className="w-3 h-3" />
              {statusBadge.label}
            </span>
          )}
        </div>
      )}

      {/* Developer Section */}
      {developer && (
        <div 
          className={cn(
            "flex items-center justify-between gap-4",
            (zone || zoneName) && "mb-4 pb-4 border-b border-[#2a3142]",
            onDeveloperClick && "cursor-pointer hover:opacity-80 transition-opacity"
          )}
          onClick={onDeveloperClick}
        >
          {/* Developer Logo */}
          <div className="flex-1 min-w-0">
            {developer.white_logo_url ? (
              <img 
                src={developer.white_logo_url} 
                alt={developer.name} 
                className="h-8 max-w-[140px] object-contain" 
              />
            ) : developer.logo_url ? (
              <img 
                src={developer.logo_url} 
                alt={developer.name} 
                className="h-8 max-w-[140px] object-contain brightness-0 invert" 
              />
            ) : (
              <span className="text-sm font-medium text-white">{developer.name}</span>
            )}
          </div>
          
          {/* Trust Score + Badge */}
          {trustScore !== null && tierInfo && (
            <div className="flex items-center gap-2">
              <TrustScoreRing score={trustScore} size={36} />
              <span className="text-white font-bold text-sm">{trustScore.toFixed(1)}</span>
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide",
                tierInfo.color
              )}>
                {tierInfo.label}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Zone Section */}
      {(zone || zoneName) && (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-300">{zone?.name || zoneName}</span>
          {maturityBadge && (
            <span className={cn("px-2 py-0.5 text-[10px] font-medium rounded-full ml-auto", maturityBadge.color)}>
              {maturityBadge.label}
            </span>
          )}
        </div>
      )}

      {/* Empty State */}
      {!project && !developer && !zone && !zoneName && (
        <div className="flex items-center justify-center py-6 text-gray-500">
          <Building2 className="w-5 h-5 mr-2" />
          <span className="text-sm">No project info available</span>
        </div>
      )}
    </div>
  );
};

export default AssetProjectCard;
