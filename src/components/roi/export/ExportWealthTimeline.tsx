import { useMemo } from 'react';
import { Currency, formatCurrencyShort } from '../currencyUtils';
import { calculateExitPrice } from '../constructionProgress';

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
  // Handover props
  handoverQuarter?: number;
  handoverYear?: number;
  bookingMonth?: number;
}

type Phase = 'construction' | 'growth' | 'mature' | 'handover';

interface YearProjection {
  year: number;
  value: number;
  phase: Phase;
  appreciation: number;
  isHandover?: boolean;
  label?: string;
}

const quarterToMonth = (quarter: number): number => {
  switch (quarter) {
    case 1: return 2;
    case 2: return 5;
    case 3: return 8;
    case 4: return 11;
    default: return 11;
  }
};

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
  handoverQuarter,
  handoverYear: propHandoverYear,
  bookingMonth = 1,
}: ExportWealthTimelineProps) => {
  // Generate projections with handover milestone
  const projections = useMemo((): YearProjection[] => {
    const data: YearProjection[] = [];
    let currentValue = basePrice;
    const constructionYears = Math.ceil(constructionMonths / 12);
    
    // Calculate handover details
    const handoverYear = propHandoverYear || (bookingYear + constructionYears);
    const handoverMonth = handoverQuarter ? quarterToMonth(handoverQuarter) : 11;
    const bookingDate = new Date(bookingYear, bookingMonth - 1);
    const handoverDate = new Date(handoverYear, handoverMonth - 1);
    const monthsToHandover = Math.max(0, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    
    const handoverValue = calculateExitPrice(
      monthsToHandover,
      basePrice,
      constructionMonths,
      { constructionAppreciation, growthAppreciation, matureAppreciation, growthPeriodYears }
    );
    
    let handoverInserted = false;
    const maxYears = handoverQuarter ? 6 : 7;
    
    for (let year = 0; year < maxYears; year++) {
      const calendarYear = bookingYear + year;
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
        year: calendarYear,
        value: currentValue,
        phase,
        appreciation,
      });
      
      if (!handoverInserted && calendarYear === handoverYear && handoverQuarter) {
        const quarterLabel = `Q${handoverQuarter}'${String(handoverYear).slice(-2)}`;
        data.push({
          year: handoverYear,
          value: handoverValue,
          phase: 'handover',
          appreciation: 0,
          isHandover: true,
          label: `🔑 ${quarterLabel}`,
        });
        handoverInserted = true;
      }
    }
    return data;
  }, [basePrice, constructionMonths, constructionAppreciation, growthAppreciation, matureAppreciation, growthPeriodYears, bookingYear, handoverQuarter, propHandoverYear, bookingMonth]);
  
  const regularData = projections.filter(d => !d.isHandover);
  const totalGrowth = regularData.length > 1
    ? ((regularData[regularData.length - 1].value - basePrice) / basePrice * 100).toFixed(0)
    : '0';
  
  const getPhaseColor = (phase: Phase) => {
    switch (phase) {
      case 'construction': return 'rgb(251, 146, 60)';
      case 'growth': return 'rgb(74, 222, 128)';
      case 'mature': return 'rgb(34, 211, 238)';
      case 'handover': return 'rgb(34, 197, 94)';
    }
  };

  const getPhaseLabel = (phase: Phase, isHandover?: boolean) => {
    if (isHandover) return language === 'es' ? 'Entrega' : 'Handover';
    if (language === 'es') {
      switch (phase) {
        case 'construction': return 'Constr';
        case 'growth': return 'Post-E';
        case 'mature': return 'Madurez';
        default: return 'Entrega';
      }
    }
    switch (phase) {
      case 'construction': return 'Constr';
      case 'growth': return 'Post-HO';
      case 'mature': return 'Maturity';
      default: return 'Handover';
    }
  };

  const t = {
    wealthProjection: language === 'es' ? 'Proyección de Riqueza' : 'Wealth Projection',
    inYears: language === 'es' ? `en ${regularData.length - 1} años` : `in ${regularData.length - 1} years`,
    construction: language === 'es' ? 'En Construcción' : 'Under Construction',
    handover: language === 'es' ? 'Entrega' : 'Handover',
    growth: language === 'es' ? 'Post Entrega' : 'Post Handover',
    mature: language === 'es' ? 'Madurez de Zona' : 'Zone Maturity',
  };

  const numColumns = projections.length;
  const hasHandover = projections.some(p => p.isHandover);

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
      
      {/* Timeline Grid - Dynamic columns */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${numColumns}, 1fr)`, gap: '6px' }}>
        {projections.map((proj, i) => (
          <div 
            key={proj.isHandover ? `handover-${proj.year}` : proj.year} 
            style={{ 
              textAlign: 'center', 
              position: 'relative',
              backgroundColor: proj.isHandover ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
              borderRadius: proj.isHandover ? '8px' : '0',
              padding: proj.isHandover ? '4px 2px' : '0',
            }}
          >
            {/* Year or Handover Label */}
            <div style={{ 
              fontSize: '11px', 
              color: proj.isHandover ? 'rgb(34, 197, 94)' : 'hsl(var(--theme-text-muted))', 
              marginBottom: '4px',
              fontWeight: proj.isHandover ? 700 : 400,
            }}>
              {proj.isHandover ? proj.label : proj.year}
            </div>
            
            {/* Value */}
            <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                fontSize: '11px', 
                fontFamily: 'monospace', 
                fontWeight: 700, 
                color: proj.isHandover ? 'rgb(34, 197, 94)' : 'hsl(var(--theme-text))' 
              }}>
                {formatCurrencyShort(proj.value, 'AED', 1)}
              </div>
              {currency !== 'AED' && rate !== 1 && (
                <div style={{ fontSize: '9px', fontFamily: 'monospace', color: 'hsl(var(--theme-text-muted))' }}>
                  {formatCurrencyShort(proj.value, currency, rate)}
                </div>
              )}
            </div>
            
            {/* Timeline dot + line */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16px' }}>
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
              {i < numColumns - 1 && (
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
              <div 
                style={{
                  width: proj.isHandover ? '16px' : '12px',
                  height: proj.isHandover ? '16px' : '12px',
                  borderRadius: '50%',
                  backgroundColor: getPhaseColor(proj.phase),
                  border: '2px solid hsl(var(--theme-bg))',
                  zIndex: 1,
                  boxShadow: proj.isHandover ? '0 0 0 3px rgba(34, 197, 94, 0.2)' : 'none',
                }}
              />
            </div>
            
            {/* Phase label */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: getPhaseColor(proj.phase) }}>
                {getPhaseLabel(proj.phase, proj.isHandover)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid hsl(var(--theme-border))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgb(251, 146, 60)' }} />
          <span style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>{t.construction}</span>
        </div>
        {hasHandover && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgb(34, 197, 94)', boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.2)' }} />
            <span style={{ fontSize: '10px', color: 'rgb(34, 197, 94)', fontWeight: 500 }}>{t.handover}</span>
          </div>
        )}
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
