import React, { useEffect, useState } from 'react';
import { MapPin, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { ZoneComparisonChart } from './ZoneComparisonChart';

interface Zone {
  id: string;
  name: string;
  maturity_level: number | null;
  maturity_label: string | null;
  investment_focus: string | null;
  construction_appreciation: number | null;
  growth_appreciation: number | null;
  mature_appreciation: number | null;
}

interface ShowcaseZoneCardProps {
  zoneName?: string;
  zoneId?: string;
  className?: string;
}

const getMaturityBadge = (level: number | null, label: string | null) => {
  if (level === null) return null;
  if (level <= 25) return { label: label || 'EMERGING', color: 'bg-orange-500/20 text-orange-300', emoji: '🟠' };
  if (level <= 50) return { label: label || 'DEVELOPING', color: 'bg-yellow-500/20 text-yellow-300', emoji: '📈' };
  if (level <= 75) return { label: label || 'GROWING', color: 'bg-green-500/20 text-green-300', emoji: '🌱' };
  if (level <= 90) return { label: label || 'MATURE', color: 'bg-blue-500/20 text-blue-300', emoji: '🏢' };
  return { label: label || 'ESTABLISHED', color: 'bg-white/10 text-white/70', emoji: '🏛️' };
};

export const ShowcaseZoneCard: React.FC<ShowcaseZoneCardProps> = ({
  zoneName,
  zoneId,
  className,
}) => {
  const [zone, setZone] = useState<Zone | null>(null);

  useEffect(() => {
    const fetchZone = async () => {
      if (zoneId) {
        const { data } = await supabase.from('zones').select('id, name, maturity_level, maturity_label, investment_focus, construction_appreciation, growth_appreciation, mature_appreciation').eq('id', zoneId).maybeSingle();
        if (data) setZone(data);
      } else if (zoneName) {
        const { data } = await supabase.from('zones').select('id, name, maturity_level, maturity_label, investment_focus, construction_appreciation, growth_appreciation, mature_appreciation').ilike('name', `%${zoneName}%`).maybeSingle();
        if (data) setZone(data);
      }
    };
    fetchZone();
  }, [zoneId, zoneName]);

  const maturityBadge = zone ? getMaturityBadge(zone.maturity_level, zone.maturity_label) : null;
  const hasAppreciation = zone?.construction_appreciation || zone?.growth_appreciation || zone?.mature_appreciation;

  if (!zone && !zoneName) return null;

  return (
    <div className={cn(
      "bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10 shadow-2xl flex flex-col",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/60 uppercase tracking-wide">Zone</p>
          <p className="text-sm font-semibold text-white truncate">{zone?.name || zoneName}</p>
        </div>
        {maturityBadge && (
          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0", maturityBadge.color)}>
            {maturityBadge.emoji} {maturityBadge.label}
          </span>
        )}
      </div>

      {/* Investment Focus */}
      {zone?.investment_focus && (
        <div className="flex items-center gap-1 mb-2">
          <TrendingUp className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] text-white/60">Focus:</span>
          <span className="text-[10px] text-white font-medium">{zone.investment_focus}</span>
        </div>
      )}

      {/* Zone Appreciation Comparison - takes remaining space */}
      {hasAppreciation && (
        <div className="flex-1 min-h-0">
          <ZoneComparisonChart
            zoneRates={{
              construction: zone?.construction_appreciation || 0,
              growth: zone?.growth_appreciation || 0,
              mature: zone?.mature_appreciation || 0,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ShowcaseZoneCard;
