import React, { useEffect, useState } from 'react';
import { Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { calculateTrustScore, getTierInfo, Developer } from '../developerTrustScore';
import { TrustScoreRing } from './TrustScoreRing';

interface ShowcaseDeveloperCardProps {
  developerName: string;
  developerId?: string;
  className?: string;
}

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

  return (
    <div className={cn(
      "bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl",
      className
    )}>
      <div className="flex items-center gap-2">
        {developer?.white_logo_url ? (
          <img src={developer.white_logo_url} alt={developerName} className="w-8 h-8 rounded-lg object-contain" />
        ) : developer?.logo_url ? (
          <img src={developer.logo_url} alt={developerName} className="w-8 h-8 rounded-lg object-contain filter brightness-0 invert opacity-90" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Building className="w-4 h-4 text-emerald-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/60 uppercase tracking-wide">Developer</p>
          <p className="text-sm font-semibold text-white truncate">{developer?.name || developerName || 'Developer'}</p>
          {developer?.founded_year && (
            <p className="text-[10px] text-white/40">Since {developer.founded_year}</p>
          )}
        </div>
        
        {/* Trust Score Ring + Tier Badge */}
        {developer && (
          <div className="flex flex-col items-center gap-0.5">
            <TrustScoreRing score={trustScore} size={40} />
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm",
              trustScore >= 9 
                ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900" 
                : trustScore >= 8 
                  ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                  : "bg-white/10 text-white/70"
            )}>
              {tierInfo.emoji} {tierInfo.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowcaseDeveloperCard;
