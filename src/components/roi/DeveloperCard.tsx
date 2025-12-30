import { useState, useEffect } from "react";
import { Building2, ChevronRight, Clock, Layers, Trophy, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { calculateTrustScore, getTierInfo, getSuperpower, Developer } from "./developerTrustScore";
import { TierBadge } from "./TierBadge";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeveloper = async () => {
      if (!developerId) {
        setLoading(false);
        return;
      }
      
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

  // Compact variant - Trust Seal design
  if (variant === 'compact') {
    // Loading skeleton for compact variant
    if (loading) {
      return (
        <div 
          className={cn(
            "relative rounded-2xl p-4 overflow-hidden",
            className
          )}
          style={{
            backgroundColor: '#0f1318',
            border: '1px solid #1e2632',
          }}
        >
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl bg-[#1e2632]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 bg-[#1e2632]" />
              <Skeleton className="h-5 w-24 bg-[#1e2632]" />
            </div>
            <Skeleton className="h-4 w-20 bg-[#1e2632]" />
          </div>
        </div>
      );
    }

    return (
      <div 
        onClick={onClick}
        className={cn(
          "relative rounded-2xl p-4 transition-all duration-300 group overflow-hidden",
          onClick && "cursor-pointer",
          className
        )}
        style={{
          backgroundColor: '#0f1318',
          border: tier ? `1px solid ${tier.color}40` : '1px solid #1e2632',
          boxShadow: tier ? `0 0 20px ${tier.color}15, inset 0 1px 0 ${tier.color}10` : 'none',
        }}
      >
        {/* Animated gradient border glow on hover */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: tier 
              ? `linear-gradient(135deg, ${tier.color}08 0%, transparent 50%, ${tier.color}05 100%)`
              : 'transparent',
          }}
        />
        
        <div className="relative flex items-center gap-4">
          {/* Developer Logo/Placeholder with premium styling */}
          <div className="relative flex-shrink-0">
            {developer?.logo_url ? (
              <div className="relative">
                <img 
                  src={developer.logo_url} 
                  alt={developer.name}
                  className="w-12 h-12 rounded-xl object-cover transition-all duration-300 group-hover:scale-105"
                  style={{ 
                    border: `2px solid ${tier?.color || '#2a3142'}60`,
                    boxShadow: tier ? `0 4px 12px ${tier.color}30` : 'none',
                  }}
                />
                {/* Glow effect behind logo */}
                {tier && (
                  <div 
                    className="absolute inset-0 rounded-xl blur-xl opacity-50 -z-10 scale-110"
                    style={{ backgroundColor: tier.color }}
                  />
                )}
              </div>
            ) : (
              <div 
                className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ 
                  background: tier 
                    ? `linear-gradient(135deg, ${tier.color}25 0%, ${tier.color}08 100%)`
                    : 'linear-gradient(135deg, #2a3142 0%, #1a1f2e 100%)',
                  border: `2px solid ${tier?.color || '#2a3142'}50`,
                }}
              >
                <Shield className="w-6 h-6" style={{ color: tier?.color || '#6b7280' }} />
                {tier && (
                  <div 
                    className="absolute inset-0 rounded-xl blur-xl opacity-40 -z-10 scale-125"
                    style={{ backgroundColor: tier.color }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Name + Tier Badge */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-white truncate block">
              {developer?.name || developerName || 'Developer'}
            </span>
            {tier && (
              <div className="mt-1">
                <TierBadge score={trustScore} variant="compact" showTooltip={false} />
              </div>
            )}
          </div>

          {/* On-time micro-data with better styling */}
          {developer?.on_time_delivery_rate != null && (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
              style={{
                backgroundColor: developer.on_time_delivery_rate >= 90 ? '#10b98115' : '#1e2632',
                border: developer.on_time_delivery_rate >= 90 ? '1px solid #10b98130' : '1px solid #2a3142',
              }}
            >
              <Clock 
                className="w-3.5 h-3.5" 
                style={{ color: developer.on_time_delivery_rate >= 90 ? '#10b981' : '#6b7280' }} 
              />
              <span 
                className="text-xs font-medium"
                style={{ color: developer.on_time_delivery_rate >= 90 ? '#10b981' : '#9ca3af' }}
              >
                {developer.on_time_delivery_rate}%
              </span>
            </div>
          )}

          {onClick && (
            <ChevronRight 
              className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" 
            />
          )}
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