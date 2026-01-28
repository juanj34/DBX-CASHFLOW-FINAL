import { useMemo } from 'react';
import { Currency, formatCurrencyShort } from '../currencyUtils';

interface ExportWealthTimelineProps {
  basePrice: number;
  constructionMonths: number;
  constructionAppreciation: number;
  growthAppreciation: number;
  matureAppreciation: number;
  growthPeriodYears: number;
  bookingYear: number;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

type Phase = 'construction' | 'growth' | 'mature';

interface YearProjection {
  year: number;
  value: number;
  phase: Phase;
  appreciation: number;
}

export const ExportWealthTimeline = ({
  basePrice,
  constructionMonths,
  constructionAppreciation,
  growthAppreciation,
  matureAppreciation,
  growthPeriodYears,
  bookingYear,
  currency,
  rate,
  language,
}: ExportWealthTimelineProps) => {
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
      case 'construction': return 'rgb(251, 146, 60)';
      case 'growth': return 'rgb(74, 222, 128)';
      case 'mature': return 'rgb(34, 211, 238)';
    }
  };

  const getPhaseLabel = (phase: Phase) => {
    if (language === 'es') {
      switch (phase) {
        case 'construction': return 'Constr';
        case 'growth': return 'Crec';
        case 'mature': return 'Maduro';
      }
    }
    switch (phase) {
      case 'construction': return 'Constr';
      case 'growth': return 'Growth';
      case 'mature': return 'Mature';
    }
  };

  const t = {
    wealthProjection: language === 'es' ? 'Proyección de Riqueza' : 'Wealth Projection',
    inYears: language === 'es' ? 'en 7 años' : 'in 7 years',
    construction: language === 'es' ? 'Construcción' : 'Construction',
    growth: language === 'es' ? 'Crecimiento' : 'Growth',
    mature: language === 'es' ? 'Maduro' : 'Mature',
  };

  return (
    <div 
      style={{
        backgroundColor: 'hsl(var(--theme-card))',
        border: '1px solid hsl(var(--theme-border))',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--theme-text))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📈 {t.wealthProjection}
          </span>
        </div>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgb(74, 222, 128)' }}>
          +{totalGrowth}% {t.inYears}
        </span>
      </div>
      
      {/* Timeline Grid - 7 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {projections.map((proj, i) => (
          <div key={proj.year} style={{ textAlign: 'center', position: 'relative' }}>
            {/* Year */}
            <div style={{ fontSize: '12px', color: 'hsl(var(--theme-text-muted))', marginBottom: '4px' }}>
              {proj.year}
            </div>
            
            {/* Value */}
            <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: 'hsl(var(--theme-text))' }}>
                {formatCurrencyShort(proj.value, 'AED', 1)}
              </div>
              {currency !== 'AED' && (
                <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'hsl(var(--theme-text-muted))' }}>
                  {formatCurrencyShort(proj.value, currency, rate)}
                </div>
              )}
            </div>
            
            {/* Timeline dot + line */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16px' }}>
              {/* Connecting line - before dot */}
              {i > 0 && (
                <div 
                  style={{
                    position: 'absolute',
                    right: '50%',
                    width: '100%',
                    height: '2px',
                    backgroundColor: 'hsl(var(--theme-border))',
                    zIndex: 0,
                  }}
                />
              )}
              {/* Connecting line - after dot */}
              {i < 6 && (
                <div 
                  style={{
                    position: 'absolute',
                    left: '50%',
                    width: '100%',
                    height: '2px',
                    backgroundColor: 'hsl(var(--theme-border))',
                    zIndex: 0,
                  }}
                />
              )}
              {/* Dot */}
              <div 
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: getPhaseColor(proj.phase),
                  border: '2px solid hsl(var(--theme-bg))',
                  zIndex: 1,
                }}
              />
            </div>
            
            {/* Phase label */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: getPhaseColor(proj.phase) }}>
                {getPhaseLabel(proj.phase)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid hsl(var(--theme-border))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgb(251, 146, 60)' }} />
          <span style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>{t.construction}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgb(74, 222, 128)' }} />
          <span style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>{t.growth}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgb(34, 211, 238)' }} />
          <span style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>{t.mature}</span>
        </div>
      </div>
    </div>
  );
};
