import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Globe, MapPin, Calendar, TrendingUp, Trophy, Award, Sparkles, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  calculateTrustScore, 
  getTierInfo, 
  getSuperpower, 
  getScoreBreakdown,
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
  const breakdown = developer ? getScoreBreakdown(developer) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="border-[#2a3142] text-white max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&>button]:text-gray-400 [&>button]:hover:text-white [&>button]:hover:bg-[#2a3142] [&>button]:transition-colors"
        style={{ backgroundColor: '#0f1219' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-[#CCFF00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : developer && tier && (
          <div className="animate-fade-in">
            {/* Header with gradient background */}
            <div 
              className="relative px-6 pt-6 pb-4"
              style={{
                background: `linear-gradient(180deg, ${tier.color}15 0%, transparent 100%)`
              }}
            >
              <DialogHeader className="space-y-0">
                <div className="flex items-start gap-4">
                  {/* Logo with glow effect */}
                  <div className="relative">
                    {developer.logo_url ? (
                      <img 
                        src={developer.logo_url} 
                        alt={developer.name}
                        className="w-18 h-18 rounded-2xl object-cover border-2 transition-transform hover:scale-105"
                        style={{ borderColor: tier.color + '60' }}
                      />
                    ) : (
                      <div 
                        className="w-18 h-18 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: tier.color + '20' }}
                      >
                        <Building2 className="w-9 h-9" style={{ color: tier.color }} />
                      </div>
                    )}
                    {/* Glow effect */}
                    <div 
                      className="absolute inset-0 rounded-2xl blur-xl opacity-30 -z-10"
                      style={{ backgroundColor: tier.color }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-2xl font-bold text-white truncate">
                      {developer.name}
                    </DialogTitle>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <TierBadge score={trustScore} variant="default" />
                      <div className="flex items-baseline gap-1">
                        <span 
                          className="text-3xl font-black tracking-tight"
                          style={{ color: tier.color }}
                        >
                          {trustScore.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">/10</span>
                      </div>
                    </div>
                    
                    {developer.founded_year && (
                      <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {language === 'es' ? 'Fundado en' : 'Est.'} {developer.founded_year}
                      </p>
                    )}
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="px-6 pb-6 space-y-5">
              {/* Radar Chart Section */}
              <div 
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{ backgroundColor: '#141820' }}
              >
                {/* Subtle grid pattern */}
                <div 
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, ${tier.color} 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }}
                />
                <DeveloperRadarChart developer={developer} size="md" />
                
                {/* Score breakdown pills */}
                {breakdown && (
                  <div className="flex flex-wrap justify-center gap-2 mt-3 relative z-10">
                    {[
                      { label: 'Track', value: breakdown.trackRecord, color: '#22d3ee' },
                      { label: 'Quality', value: breakdown.buildQuality, color: '#a78bfa' },
                      { label: 'ROI', value: breakdown.roiPotential, color: '#4ade80' },
                      { label: 'Maint.', value: breakdown.maintenance, color: '#fbbf24' },
                    ].map((item, i) => (
                      <div 
                        key={i}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
                        style={{ 
                          backgroundColor: item.color + '15',
                          color: item.color,
                        }}
                      >
                        <span className="opacity-70">{item.label}</span>
                        <span className="font-bold">{item.value.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Superpower Badge - More prominent */}
              {superpower && (
                <div 
                  className="relative overflow-hidden rounded-2xl p-4 transition-all hover:scale-[1.01]"
                  style={{ 
                    background: `linear-gradient(135deg, ${tier.color}20 0%, ${tier.color}05 100%)`,
                    border: `1px solid ${tier.color}30`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: tier.color + '25' }}
                    >
                      <Sparkles className="w-6 h-6" style={{ color: tier.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-white flex items-center gap-2">
                        <span className="text-lg">🏆</span>
                        {language === 'es' ? 'Punto Fuerte' : 'Superpower'}
                      </p>
                      <p className="text-sm text-gray-300 mt-0.5">
                        {language === 'es' 
                          ? `Destaca en ${superpower.categoryEs}`
                          : `Excels in ${superpower.category}`
                        }
                        <span 
                          className="ml-2 font-bold"
                          style={{ color: tier.color }}
                        >
                          {superpower.score.toFixed(1)}/10
                        </span>
                      </p>
                    </div>
                  </div>
                  {/* Decorative element */}
                  <div 
                    className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-20"
                    style={{ backgroundColor: tier.color }}
                  />
                </div>
              )}

              {/* Bio - Better typography */}
              {(developer.short_bio || developer.description) && (
                <p className="text-sm text-gray-300 leading-relaxed px-1">
                  {developer.short_bio || developer.description}
                </p>
              )}

              {/* Quick Stats - More visual */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { 
                    value: developer.projects_launched, 
                    label: language === 'es' ? 'Proyectos' : 'Projects',
                    color: '#CCFF00',
                    format: (v: number) => v.toString()
                  },
                  { 
                    value: developer.units_sold, 
                    label: language === 'es' ? 'Unidades' : 'Units',
                    color: '#22d3ee',
                    format: (v: number) => (v / 1000).toFixed(1) + 'K'
                  },
                  { 
                    value: developer.on_time_delivery_rate, 
                    label: language === 'es' ? 'A tiempo' : 'On-time',
                    color: '#4ade80',
                    format: (v: number) => v + '%'
                  },
                ].filter(item => item.value).map((item, i) => (
                  <div 
                    key={i}
                    className="rounded-xl p-4 text-center transition-all hover:scale-105 relative overflow-hidden group"
                    style={{ backgroundColor: '#141820' }}
                  >
                    <p 
                      className="text-2xl font-black tracking-tight"
                      style={{ color: item.color }}
                    >
                      {item.format(item.value as number)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">
                      {item.label}
                    </p>
                    {/* Hover glow */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity rounded-xl"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                ))}
              </div>

              {/* Flagship Project */}
              {developer.flagship_project && (
                <div 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: '#141820' }}
                >
                  <Award className="w-5 h-5 text-[#CCFF00] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      {language === 'es' ? 'Proyecto Insignia' : 'Flagship'}
                    </span>
                    <p className="font-semibold text-white truncate">
                      {developer.flagship_project}
                    </p>
                  </div>
                </div>
              )}

              {/* Total Valuation - Premium look */}
              {developer.total_valuation && (
                <div 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
                  style={{ 
                    background: `linear-gradient(90deg, ${tier.color}15 0%, transparent 100%)`,
                    borderLeft: `3px solid ${tier.color}`,
                  }}
                >
                  <TrendingUp className="w-5 h-5 flex-shrink-0" style={{ color: tier.color }} />
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      {language === 'es' ? 'Valoración Total' : 'Total Valuation'}
                    </span>
                    <p className="font-bold text-white text-lg">
                      AED {developer.total_valuation}B
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Info - Cleaner */}
              <div className="flex flex-wrap gap-4 text-sm pt-2">
                {developer.headquarters && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{developer.headquarters}</span>
                  </div>
                )}
                {developer.website && (
                  <a 
                    href={developer.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors group"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="group-hover:underline">Website</span>
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                )}
              </div>

              {/* Last Updated - Subtle footer */}
              {developer.updated_at && (
                <p className="text-xs text-gray-600 text-center pt-3 border-t border-gray-800">
                  {language === 'es' ? 'Actualizado' : 'Updated'} {format(new Date(developer.updated_at), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
