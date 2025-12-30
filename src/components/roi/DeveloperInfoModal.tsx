import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Globe, MapPin, Calendar, TrendingUp, Trophy, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  calculateTrustScore, 
  getTierInfo, 
  getSuperpower, 
  Developer 
} from "./developerTrustScore";
import { TierBadge } from "./TierBadge";
import { DeveloperRadarChart } from "./DeveloperRadarChart";
import { useLanguage } from "@/contexts/LanguageContext";

interface DeveloperInfoModalProps {
  developerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeveloperInfoModal = ({ developerId, open, onOpenChange }: DeveloperInfoModalProps) => {
  const { language } = useLanguage();
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
        setDeveloper(data as Developer);
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

  const trustScore = developer ? calculateTrustScore(developer) : 0;
  const tier = developer ? getTierInfo(trustScore) : null;
  const superpower = developer ? getSuperpower(developer) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#CCFF00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : developer && tier && (
          <>
            <DialogHeader className="space-y-4">
              {/* Logo, Name, and Tier */}
              <div className="flex items-start gap-4">
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
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-xl font-bold text-white">
                      {developer.name}
                    </DialogTitle>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <TierBadge score={trustScore} variant="default" />
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: tier.color }}
                    >
                      {trustScore.toFixed(1)}
                    </span>
                  </div>
                  {developer.founded_year && (
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-2">
                      <Calendar className="w-3 h-3" />
                      {language === 'es' ? 'Fundado en' : 'Founded'} {developer.founded_year}
                    </p>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Radar Chart - The main visual */}
              <div className="bg-[#2a3142]/30 rounded-xl p-4">
                <DeveloperRadarChart developer={developer} size="md" />
              </div>

              {/* Superpower Badge */}
              {superpower && (
                <div 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                  style={{ 
                    backgroundColor: `${tier.color}15`,
                    borderColor: `${tier.color}40`
                  }}
                >
                  <Trophy className="w-5 h-5" style={{ color: tier.color }} />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      🏆 {language === 'es' ? 'Punto Fuerte' : 'Superpower'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {language === 'es' 
                        ? `Este developer destaca en ${superpower.categoryEs}`
                        : `This developer excels in ${superpower.category}`
                      } ({superpower.score.toFixed(1)}/10)
                    </p>
                  </div>
                </div>
              )}

              {/* Bio */}
              {(developer.short_bio || developer.description) && (
                <p className="text-sm text-gray-400 leading-relaxed">
                  {developer.short_bio || developer.description}
                </p>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                {developer.projects_launched && (
                  <div className="bg-[#2a3142]/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#CCFF00]">
                      {developer.projects_launched}
                    </p>
                    <p className="text-xs text-gray-500">
                      {language === 'es' ? 'Proyectos' : 'Projects'}
                    </p>
                  </div>
                )}
                {developer.units_sold && (
                  <div className="bg-[#2a3142]/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-cyan-500">
                      {(developer.units_sold / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-gray-500">
                      {language === 'es' ? 'Unidades' : 'Units Sold'}
                    </p>
                  </div>
                )}
                {developer.on_time_delivery_rate && (
                  <div className="bg-[#2a3142]/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-500">
                      {developer.on_time_delivery_rate}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {language === 'es' ? 'A tiempo' : 'On-time'}
                    </p>
                  </div>
                )}
              </div>

              {/* Flagship Project */}
              {developer.flagship_project && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#2a3142]/30 rounded-lg border border-[#2a3142]">
                  <Award className="w-4 h-4 text-[#CCFF00]" />
                  <span className="text-sm text-gray-400">
                    {language === 'es' ? 'Proyecto Insignia:' : 'Flagship Project:'}
                  </span>
                  <span className="font-medium text-white">
                    {developer.flagship_project}
                  </span>
                </div>
              )}

              {/* Total Valuation */}
              {developer.total_valuation && (
                <div 
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                  style={{ 
                    backgroundColor: `${tier.color}15`,
                    borderColor: `${tier.color}30`
                  }}
                >
                  <TrendingUp className="w-4 h-4" style={{ color: tier.color }} />
                  <span className="text-sm text-gray-400">
                    {language === 'es' ? 'Valoración Total:' : 'Total Valuation:'}
                  </span>
                  <span className="font-bold text-white">
                    AED {developer.total_valuation}B
                  </span>
                </div>
              )}

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
                    className="flex items-center gap-2 text-cyan-500 hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    <span>{developer.website}</span>
                  </a>
                )}
              </div>

              {/* Last Updated */}
              {developer.updated_at && (
                <p className="text-xs text-gray-500 text-center pt-2 border-t border-[#2a3142]">
                  {language === 'es' ? 'Actualizado:' : 'Last updated:'} {format(new Date(developer.updated_at), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};