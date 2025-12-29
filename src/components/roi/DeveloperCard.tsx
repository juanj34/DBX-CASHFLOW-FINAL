import { useState, useEffect } from "react";
import { Building2, Star, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Developer {
  id: string;
  name: string;
  logo_url: string | null;
  rating_quality: number | null;
  rating_track_record: number | null;
  on_time_delivery_rate: number | null;
}

interface DeveloperCardProps {
  developerId: string | null;
  developerName?: string;
  onClick?: () => void;
  className?: string;
}

export const DeveloperCard = ({ 
  developerId, 
  developerName,
  onClick,
  className 
}: DeveloperCardProps) => {
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDeveloper = async () => {
      if (!developerId) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('developers')
        .select('id, name, logo_url, rating_quality, rating_track_record, on_time_delivery_rate')
        .eq('id', developerId)
        .maybeSingle();
      
      if (!error && data) {
        setDeveloper(data);
      }
      setLoading(false);
    };
    
    fetchDeveloper();
  }, [developerId]);

  // Calculate average rating
  const avgRating = developer 
    ? ((developer.rating_quality || 0) + (developer.rating_track_record || 0)) / 2
    : 0;

  if (!developerId && !developerName) return null;

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
        {/* Logo */}
        {developer?.logo_url ? (
          <img 
            src={developer.logo_url} 
            alt={developer.name}
            className="w-12 h-12 rounded-lg object-cover border border-[#2a3142]"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-[#2a3142] flex items-center justify-center">
            <Building2 className="w-6 h-6 text-gray-500" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {developer?.name || developerName || 'Unknown Developer'}
          </p>
          
          {developer && (
            <div className="flex items-center gap-3 mt-1">
              {avgRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#CCFF00] fill-[#CCFF00]" />
                  <span className="text-xs text-gray-400">{avgRating.toFixed(1)}</span>
                </div>
              )}
              {developer.on_time_delivery_rate && (
                <span className="text-xs text-green-400">
                  {developer.on_time_delivery_rate}% on-time
                </span>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        {onClick && (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </div>
    </div>
  );
};