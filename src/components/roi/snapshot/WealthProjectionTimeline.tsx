import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { Currency, formatCurrencyShort } from '../currencyUtils';
import { cn } from '@/lib/utils';

interface WealthProjectionTimelineProps {
  basePrice: number;
  constructionMonths: number;
  constructionAppreciation: number;
  growthAppreciation: number;
  matureAppreciation: number;
  growthPeriodYears: number;
  bookingYear: number;
  currency: Currency;
  rate: number;
}

type Phase = 'construction' | 'growth' | 'mature';

interface YearProjection {
  year: number;
  value: number;
  phase: Phase;
  appreciation: number;
}

export const WealthProjectionTimeline = ({
  basePrice,
  constructionMonths,
  constructionAppreciation,
  growthAppreciation,
  matureAppreciation,
  growthPeriodYears,
  bookingYear,
  currency,
  rate,
}: WealthProjectionTimelineProps) => {
  // Generate 7 years of projections
  const projections = useMemo((): YearProjection[] => {
    const data: YearProjection[] = [];
    let currentValue = basePrice;
    const constructionYears = Math.ceil(constructionMonths / 12);
    
    for (let year = 0; year < 7; year++) {
      let phase: Phase;
      let appreciation: number;
      
      if (year < constructionYears) {
        phase = 'construction';
        appreciation = constructionAppreciation;
      } else if (year < constructionYears + growthPeriodYears) {
        phase = 'growth';
        appreciation = growthAppreciation;
      } else {
        phase = 'mature';
        appreciation = matureAppreciation;
      }
      
      if (year > 0) {
        currentValue *= (1 + appreciation / 100);
      }
      
      data.push({
        year: bookingYear + year,
        value: currentValue,
        phase,
        appreciation,
      });
    }
    return data;
  }, [basePrice, constructionMonths, constructionAppreciation, growthAppreciation, matureAppreciation, growthPeriodYears, bookingYear]);
  
  const totalGrowth = ((projections[6].value - basePrice) / basePrice * 100).toFixed(0);
  
  const getPhaseColor = (phase: Phase) => {
    switch (phase) {
      case 'construction': return 'text-orange-400';
      case 'growth': return 'text-green-400';
      case 'mature': return 'text-cyan-400';
    }
  };
  
  const getPhaseBgColor = (phase: Phase) => {
    switch (phase) {
      case 'construction': return 'bg-orange-400';
      case 'growth': return 'bg-green-400';
      case 'mature': return 'bg-cyan-400';
    }
  };

  const getPhaseLabel = (phase: Phase) => {
    switch (phase) {
      case 'construction': return 'Constr';
      case 'growth': return 'Growth';
      case 'mature': return 'Mature';
    }
  };

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-theme-text uppercase tracking-wide">
            Wealth Projection
          </span>
        </div>
        <span className="text-sm font-bold text-green-400">
          +{totalGrowth}% in 7 years
        </span>
      </div>
      
      {/* Timeline Grid - 7 columns */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {projections.map((proj, i) => (
          <div key={proj.year} className="text-center relative">
            {/* Year */}
            <div className="text-[10px] sm:text-xs text-theme-text-muted mb-1">
              {proj.year}
            </div>
            
            {/* Value */}
            <div className="text-[10px] sm:text-xs font-mono font-bold text-theme-text mb-2">
              {formatCurrencyShort(proj.value, currency, rate)}
            </div>
            
            {/* Timeline dot + line */}
            <div className="relative flex items-center justify-center h-4">
              {/* Connecting line - before dot */}
              {i > 0 && (
                <div className="absolute right-1/2 w-full h-0.5 bg-theme-border -z-10" />
              )}
              {/* Connecting line - after dot */}
              {i < 6 && (
                <div className="absolute left-1/2 w-full h-0.5 bg-theme-border -z-10" />
              )}
              {/* Dot */}
              <div className={cn(
                "w-3 h-3 rounded-full z-10 border-2 border-theme-bg",
                getPhaseBgColor(proj.phase)
              )} />
            </div>
            
            {/* Phase + Appreciation */}
            <div className="mt-2">
              <div className={cn(
                "text-[10px] sm:text-xs font-semibold",
                getPhaseColor(proj.phase)
              )}>
                {proj.appreciation}%
              </div>
              <div className="text-[8px] sm:text-[10px] text-theme-text-muted">
                {getPhaseLabel(proj.phase)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-theme-border">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-[10px] text-theme-text-muted">Construction</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[10px] text-theme-text-muted">Growth</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-[10px] text-theme-text-muted">Mature</span>
        </div>
      </div>
    </div>
  );
};
