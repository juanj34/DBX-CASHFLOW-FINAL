import { useState, useEffect } from "react";
import { Building2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { calculateTrustScore, getTierInfo, Developer } from "./developerTrustScore";
import { TierBadge } from "./TierBadge";

interface DeveloperCardProps {
  developerId: string | null;
  developerName?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

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

  if (!developerId && !developerName) return null;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-xl p-4 transition-all",
        onClick && "cursor-pointer hover:border-primary/30 hover:bg-card/80",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Logo */}
        {developer?.logo_url ? (
          <img 
            src={developer.logo_url} 
            alt={developer.name}
            className="w-12 h-12 rounded-lg object-cover border border-border"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground truncate">
              {developer?.name || developerName || 'Unknown Developer'}
            </p>
            {tier && variant === 'default' && (
              <TierBadge score={trustScore} variant="compact" />
            )}
          </div>
          
          {developer && (
            <div className="flex items-center gap-3 mt-1">
              {/* Trust Score */}
              {tier && (
                <div className="flex items-center gap-1.5">
                  <span 
                    className="text-lg font-bold"
                    style={{ color: tier.color }}
                  >
                    {trustScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">Trust</span>
                </div>
              )}
              {developer.on_time_delivery_rate && variant === 'default' && (
                <span className="text-xs text-emerald-500">
                  {developer.on_time_delivery_rate}% on-time
                </span>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        {onClick && (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
};