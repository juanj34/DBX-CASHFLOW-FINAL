import React, { useEffect, useState } from 'react';
import { Building, CheckCircle, Trophy, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { calculateTrustScore, getTierInfo, getSuperpower, Developer } from '../developerTrustScore';
import { TrustScoreRing } from './TrustScoreRing';

interface ShowcaseDeveloperCardProps {
  developerName: string;
  developerId?: string;
  className?: string;
}

const formatNumber = (num: number | null): string => {
  if (num === null || num === undefined) return '-';
  if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`;
  return num.toString();
};

export const ShowcaseDeveloperCard: React.FC<ShowcaseDeveloperCardProps> = ({
  developerName,
  developerId,
  className,
}) => {
  const [developer, setDeveloper] = useState<Developer | null>(null);

  useEffect(() => {
    const fetchDeveloper = async () => {
      if (developerId) {
        const { data } = await supabase.from('developers').select('*').eq('id', developerId).maybeSingle();
        if (data) setDeveloper(data);
      } else if (developerName) {
        const { data } = await supabase.from('developers').select('*').ilike('name', `%${developerName}%`).maybeSingle();
        if (data) setDeveloper(data);
      }
    };
    fetchDeveloper();
  }, [developerId, developerName]);

  const trustScore = developer ? calculateTrustScore(developer) : 5;
  const tierInfo = getTierInfo(trustScore);
  const superpower = developer ? getSuperpower(developer) : null;

  return (
    <div className={cn(
      "bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-lg p-2.5 border border-slate-700/50 backdrop-blur-sm",
      className
    )}>
      {/* Header with Trust Ring */}
      <div className="flex items-center gap-2 mb-2">
        {developer?.logo_url ? (
          <img src={developer.logo_url} alt={developerName} className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Building className="w-4 h-4 text-emerald-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Developer</p>
          <p className="text-sm font-semibold text-white truncate">{developer?.name || developerName || 'Developer'}</p>
          {developer?.founded_year && (
            <p className="text-[10px] text-slate-500">Since {developer.founded_year}</p>
          )}
        </div>
        {developer && <TrustScoreRing score={trustScore} size={44} />}
      </div>

      {/* Tier Badge + Superpower Row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {developer && (
          <span className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold",
            tierInfo.color.replace('text-', 'bg-').replace('-400', '-500/20'),
            tierInfo.color
          )}>
            {tierInfo.emoji} {tierInfo.label}
          </span>
        )}
        {superpower && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded text-[9px]">
            <Trophy className="w-2.5 h-2.5" />
            {superpower.category}
          </span>
        )}
      </div>

      {/* Stats Row */}
      {developer && (
        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-700/30">
          <div className="text-center">
            <Package className="w-3 h-3 text-slate-400 mx-auto mb-0.5" />
            <p className="text-xs font-semibold text-white">{formatNumber(developer.projects_launched)}</p>
            <p className="text-[8px] text-slate-500">Projects</p>
          </div>
          <div className="text-center">
            <Building className="w-3 h-3 text-slate-400 mx-auto mb-0.5" />
            <p className="text-xs font-semibold text-white">{formatNumber(developer.units_sold)}</p>
            <p className="text-[8px] text-slate-500">Units</p>
          </div>
          <div className="text-center">
            <CheckCircle className="w-3 h-3 text-slate-400 mx-auto mb-0.5" />
            <p className="text-xs font-semibold text-white">
              {developer.on_time_delivery_rate ? `${developer.on_time_delivery_rate}%` : '-'}
            </p>
            <p className="text-[8px] text-slate-500">On-Time</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowcaseDeveloperCard;
