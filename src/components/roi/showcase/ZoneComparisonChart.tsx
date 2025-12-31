import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ZoneAppreciationRates {
  construction: number;
  growth: number;
  mature: number;
}

interface ZoneComparisonChartProps {
  zoneRates: ZoneAppreciationRates;
  className?: string;
}

// Dubai market averages (baseline)
const MARKET_AVERAGES: ZoneAppreciationRates = {
  construction: 8,
  growth: 5,
  mature: 3,
};

export const ZoneComparisonChart: React.FC<ZoneComparisonChartProps> = ({
  zoneRates,
  className,
}) => {
  const phases = [
    { key: 'construction' as const, label: 'Construction', color: 'bg-cyan-500' },
    { key: 'growth' as const, label: 'Growth', color: 'bg-emerald-500' },
    { key: 'mature' as const, label: 'Mature', color: 'bg-blue-500' },
  ];

  const maxRate = Math.max(
    ...phases.map(p => Math.max(zoneRates[p.key] || 0, MARKET_AVERAGES[p.key]))
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-400 uppercase tracking-wide">vs Market Average</span>
      </div>
      
      {phases.map(phase => {
        const zoneRate = zoneRates[phase.key] || 0;
        const marketRate = MARKET_AVERAGES[phase.key];
        const delta = zoneRate - marketRate;
        const zoneWidth = maxRate > 0 ? (zoneRate / maxRate) * 100 : 0;
        const marketWidth = maxRate > 0 ? (marketRate / maxRate) * 100 : 0;

        return (
          <div key={phase.key} className="space-y-0.5">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-slate-400">{phase.label}</span>
              <div className="flex items-center gap-1">
                <span className="text-white font-medium">{zoneRate}%</span>
                {delta !== 0 && (
                  <span className={cn(
                    "flex items-center gap-0.5 font-medium",
                    delta > 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {delta > 0 ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                )}
                {delta === 0 && (
                  <span className="flex items-center gap-0.5 text-slate-500">
                    <Minus className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            </div>
            <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
              {/* Market average indicator */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-slate-400/50 z-10"
                style={{ left: `${marketWidth}%` }}
              />
              {/* Zone bar */}
              <div 
                className={cn("h-full rounded-full transition-all duration-700", phase.color)}
                style={{ width: `${zoneWidth}%` }}
              />
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-0.5">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400/50" />
          <span className="text-[8px] text-slate-500">Market Avg</span>
        </div>
      </div>
    </div>
  );
};

export default ZoneComparisonChart;
