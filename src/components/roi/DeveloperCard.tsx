import { useState, useEffect } from "react";
import { Building2, ChevronRight, Clock, Layers, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { calculateTrustScore, getTierInfo, getSuperpower, Developer } from "./developerTrustScore";
import { TierBadge } from "./TierBadge";

interface DeveloperCardProps {
  developerId: string | null;
  developerName?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

const formatNumber = (num: number | null | undefined): string => {
  if (num == null) return '-';
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const DeveloperCard = ({ 
  developerId, 
  developerName,
  onClick,
  className,
  variant = 'default'
}: DeveloperCardProps) => {
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDeveloper = async () => {
      if (!developerId) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('developers')
        .select('id, name, logo_url, rating_quality, rating_track_record, rating_flip_potential, score_maintenance, on_time_delivery_rate, projects_launched, units_sold, founded_year, flagship_project')
        .eq('id', developerId)
        .maybeSingle();
      
      if (!error && data) {
        setDeveloper(data as Developer);
      }
      setLoading(false);
    };
    
    fetchDeveloper();
  }, [developerId]);

  const trustScore = developer ? calculateTrustScore(developer) : 0;
  const tier = developer ? getTierInfo(trustScore) : null;
  const superpower = developer ? getSuperpower(developer) : null;

  if (!developerId && !developerName) return null;

  // Compact variant - simpler display
  if (variant === 'compact') {
    return (
      <div 
        onClick={onClick}
        className={cn(
          "bg-[#1a1f2e] border border-[#2a3142] rounded-xl p-4 transition-all",
          onClick && "cursor-pointer hover:border-[#CCFF00]/30 hover:bg-[#1a1f2e]/80",
          className
        )}
      >
        <div className="flex items-center gap-3">
          {developer?.logo_url ? (
            <img 
              src={developer.logo_url} 
              alt={developer.name}
              className="w-10 h-10 rounded-lg object-cover border border-[#2a3142]"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#2a3142] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {developer?.name || developerName || 'Unknown Developer'}
            </p>
            {tier && (
              <div className="flex items-center gap-2 mt-1">
                <TierBadge score={trustScore} variant="compact" />
                <span className="text-sm font-bold" style={{ color: tier.color }}>
                  {trustScore.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          {onClick && <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
    );
  }

  // Default variant - rich display with stats
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-[#1a1f2e] border border-[#2a3142] rounded-xl overflow-hidden transition-all",
        onClick && "cursor-pointer hover:border-[#CCFF00]/40 hover:shadow-lg hover:shadow-[#CCFF00]/5",
        className
      )}
    >
      {/* Header with logo and trust score */}
      <div className="p-4 flex items-start gap-4">
        {/* Logo */}
        {developer?.logo_url ? (
          <img 
            src={developer.logo_url} 
            alt={developer.name}
            className="w-14 h-14 rounded-xl object-cover border border-[#2a3142] flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-[#2a3142] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-gray-500" />
          </div>
        )}

        {/* Name and tier */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-semibold text-white truncate">
              {developer?.name || developerName || 'Unknown Developer'}
            </p>
          </div>
          
          {tier && (
            <div className="flex items-center gap-2 mt-1">
              <TierBadge score={trustScore} variant="compact" />
              <span 
                className="text-xl font-bold"
                style={{ color: tier.color }}
              >
                {trustScore.toFixed(1)}
              </span>
            </div>
          )}

          {developer?.founded_year && (
            <p className="text-xs text-gray-400 mt-1">
              Est. {developer.founded_year}
            </p>
          )}
        </div>

        {onClick && (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </div>

      {/* Superpower badge */}
      {superpower && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/20">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-[#CCFF00]">
              Excels in {superpower.category} ({superpower.score.toFixed(1)}/10)
            </span>
          </div>
        </div>
      )}

      {/* Stats row */}
      {developer && (
        <div className="border-t border-[#2a3142] bg-[#2a3142]/30">
          <div className="grid grid-cols-3 divide-x divide-[#2a3142]">
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <p className="text-lg font-bold text-white">
                {developer.projects_launched || '-'}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                Projects
              </p>
            </div>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-lg font-bold text-white">
                {formatNumber(developer.units_sold)}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                Units Sold
              </p>
            </div>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <p className={cn(
                "text-lg font-bold",
                developer.on_time_delivery_rate && developer.on_time_delivery_rate >= 90 
                  ? "text-emerald-500" 
                  : "text-white"
              )}>
                {developer.on_time_delivery_rate ? `${developer.on_time_delivery_rate}%` : '-'}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                On-time
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};