import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Globe, MapPin, Calendar, TrendingUp, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Developer {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  short_bio: string | null;
  founded_year: number | null;
  headquarters: string | null;
  website: string | null;
  projects_launched: number | null;
  units_sold: number | null;
  on_time_delivery_rate: number | null;
  total_valuation: number | null;
  rating_quality: number | null;
  rating_track_record: number | null;
  rating_sales: number | null;
  rating_design: number | null;
  rating_flip_potential: number | null;
  updated_at: string | null;
}

interface DeveloperInfoModalProps {
  developerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RatingBar = ({ label, value, maxValue = 10 }: { label: string; value: number; maxValue?: number }) => {
  const percentage = (value / maxValue) * 100;
  
  // Color gradient based on value
  const getColor = (val: number) => {
    if (val >= 8) return 'bg-green-500';
    if (val >= 6) return 'bg-[#CCFF00]';
    if (val >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="font-medium text-white">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-[#2a3142] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getColor(value)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const DeveloperInfoModal = ({ developerId, open, onOpenChange }: DeveloperInfoModalProps) => {
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeveloper = async () => {
      if (!developerId) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('id', developerId)
        .maybeSingle();
      
      if (!error && data) {
        setDeveloper(data);
      }
      setLoading(false);
    };
    
    if (open && developerId) {
      fetchDeveloper();
    }
  }, [developerId, open]);

  if (!developer && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#CCFF00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : developer && (
          <>
            <DialogHeader className="space-y-4">
              {/* Logo and Name */}
              <div className="flex items-center gap-4">
                {developer.logo_url ? (
                  <img 
                    src={developer.logo_url} 
                    alt={developer.name}
                    className="w-16 h-16 rounded-xl object-cover border border-[#2a3142]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[#2a3142] flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-500" />
                  </div>
                )}
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    {developer.name}
                  </DialogTitle>
                  {developer.founded_year && (
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      Founded {developer.founded_year}
                    </p>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Bio */}
              {(developer.short_bio || developer.description) && (
                <p className="text-sm text-gray-300 leading-relaxed">
                  {developer.short_bio || developer.description}
                </p>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                {developer.projects_launched && (
                  <div className="bg-[#0d1117] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#CCFF00]">
                      {developer.projects_launched}
                    </p>
                    <p className="text-xs text-gray-400">Projects</p>
                  </div>
                )}
                {developer.units_sold && (
                  <div className="bg-[#0d1117] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#00EAFF]">
                      {(developer.units_sold / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-gray-400">Units Sold</p>
                  </div>
                )}
                {developer.on_time_delivery_rate && (
                  <div className="bg-[#0d1117] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {developer.on_time_delivery_rate}%
                    </p>
                    <p className="text-xs text-gray-400">On-time</p>
                  </div>
                )}
              </div>

              {/* Valuation Badge */}
              {developer.total_valuation && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#CCFF00]/10 to-transparent rounded-lg border border-[#CCFF00]/20">
                  <TrendingUp className="w-4 h-4 text-[#CCFF00]" />
                  <span className="text-sm text-gray-300">Total Valuation:</span>
                  <span className="font-bold text-white">
                    AED {developer.total_valuation}B
                  </span>
                </div>
              )}

              {/* Ratings Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#CCFF00]" />
                  <h3 className="text-sm font-semibold text-white">Our Ratings</h3>
                </div>
                <div className="space-y-3 bg-[#0d1117] rounded-lg p-4">
                  <RatingBar label="Quality" value={developer.rating_quality || 0} />
                  <RatingBar label="Track Record" value={developer.rating_track_record || 0} />
                  <RatingBar label="Sales Performance" value={developer.rating_sales || 0} />
                  <RatingBar label="Design" value={developer.rating_design || 0} />
                  <RatingBar label="Flip Potential" value={developer.rating_flip_potential || 0} />
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-2 text-sm">
                {developer.headquarters && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{developer.headquarters}</span>
                  </div>
                )}
                {developer.website && (
                  <a 
                    href={developer.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#00EAFF] hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    <span>{developer.website}</span>
                  </a>
                )}
              </div>

              {/* Last Updated */}
              {developer.updated_at && (
                <p className="text-xs text-gray-500 text-center pt-2 border-t border-[#2a3142]">
                  Last updated: {format(new Date(developer.updated_at), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};