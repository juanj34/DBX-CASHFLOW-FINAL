import React, { useEffect, useState } from 'react';
import { Building, CheckCircle, Trophy, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { TierBadge } from '../TierBadge';
import { calculateTrustScore, getSuperpower, Developer } from '../developerTrustScore';

interface ShowcaseDeveloperCardProps {
  developerName: string;
  developerId?: string;
  className?: string;
}

const formatNumber = (num: number | null): string => {
  if (num === null || num === undefined) return '-';
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
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
        const { data } = await supabase
          .from('developers')
          .select('*')
          .eq('id', developerId)
          .maybeSingle();
        if (data) setDeveloper(data);
      } else if (developerName) {
        const { data } = await supabase
          .from('developers')
          .select('*')
          .ilike('name', `%${developerName}%`)
          .maybeSingle();
        if (data) setDeveloper(data);
      }
    };
    
    fetchDeveloper();
  }, [developerId, developerName]);

  const trustScore = developer ? calculateTrustScore(developer) : 5;
  const superpower = developer ? getSuperpower(developer) : null;
  const currentYear = new Date().getFullYear();
  const yearsInMarket = developer?.founded_year ? currentYear - developer.founded_year : null;

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
      <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full -translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        {/* Header with logo */}
        <div className="flex items-start gap-3 mb-3">
          {developer?.logo_url ? (
            <img 
              src={developer.logo_url} 
              alt={developerName}
              className="w-14 h-14 rounded-lg object-contain bg-white/10 p-1.5"
            />
          ) : (
            <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              <Building className="w-7 h-7 text-emerald-400" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Developer</p>
            <p className="text-lg font-semibold text-white truncate">{developer?.name || developerName || 'Developer'}</p>
            {developer?.founded_year && (
              <p className="text-xs text-slate-400">Since {developer.founded_year} • {yearsInMarket} years</p>
            )}
          </div>
        </div>

        {/* Trust Score Badge */}
        <div className="mb-3">
          <TierBadge score={trustScore} variant="default" showTooltip={true} />
        </div>

        {/* Superpower highlight */}
        {superpower && (
          <div className="mb-3 p-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-300">
                Superpower: <span className="font-semibold">{superpower.category}</span> ({superpower.score.toFixed(1)})
              </span>
            </div>
          </div>
        )}

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50">
          {developer?.projects_launched !== null && developer?.projects_launched !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium">{developer.projects_launched}</span>
              <span className="text-slate-400 text-xs">Projects</span>
            </div>
          )}
          
          {developer?.units_sold !== null && developer?.units_sold !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-white font-medium">{formatNumber(developer.units_sold)}</span>
              <span className="text-slate-400 text-xs">Units</span>
            </div>
          )}
          
          {developer?.on_time_delivery_rate !== null && developer?.on_time_delivery_rate !== undefined && (
            <div className="flex items-center gap-2 text-sm col-span-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-medium">{developer.on_time_delivery_rate}%</span>
              <span className="text-slate-400 text-xs">On-time Delivery</span>
            </div>
          )}
        </div>

        {/* Flagship project */}
        {developer?.flagship_project && (
          <div className="mt-2 pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">Flagship:</span>
              <span className="text-white truncate">{developer.flagship_project}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowcaseDeveloperCard;
