import { Currency, formatDualCurrencyCompact } from '@/components/roi/currencyUtils';

interface ExportRentalComparisonProps {
  offPlanMonthlyRent: number;
  secondaryMonthlyRent: number;
  handoverYear: number;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

/**
 * ExportRentalComparison - Static rental comparison card for PDF/PNG exports
 * No animations, no tooltips, no interactivity
 */
export const ExportRentalComparison = ({
  offPlanMonthlyRent,
  secondaryMonthlyRent,
  handoverYear,
  currency,
  rate,
  language,
}: ExportRentalComparisonProps) => {
  const formatValue = (value: number): string => {
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  const offPlanYearlyRent = offPlanMonthlyRent * 12;
  const secondaryYearlyRent = secondaryMonthlyRent * 12;

  const offPlanIsHigher = offPlanMonthlyRent > secondaryMonthlyRent;
  const percentDiff = secondaryMonthlyRent > 0
    ? ((offPlanMonthlyRent - secondaryMonthlyRent) / secondaryMonthlyRent) * 100
    : 0;

  const winner = offPlanIsHigher ? 'offplan' : 'secondary';

  const t = language === 'es' ? {
    title: 'Renta al Handover',
    subtitle: `Año ${handoverYear}`,
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
    perMonth: '/mes',
    perYear: '/año',
    offPlanNote: 'Inicio de renta',
    secondaryNote: `Con ${handoverYear} años de crecimiento`,
    offPlanHigher: `Off-Plan: ${Math.abs(percentDiff).toFixed(0)}% más alta`,
    secondaryHigher: `Secundaria: ${Math.abs(percentDiff).toFixed(0)}% más alta`,
  } : {
    title: 'Rent at Handover',
    subtitle: `Year ${handoverYear}`,
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
    perMonth: '/mo',
    perYear: '/yr',
    offPlanNote: 'Rental starts',
    secondaryNote: `After ${handoverYear}yr rent growth`,
    offPlanHigher: `Off-Plan: ${Math.abs(percentDiff).toFixed(0)}% higher`,
    secondaryHigher: `Secondary: ${Math.abs(percentDiff).toFixed(0)}% higher`,
  };

  return (
    <div 
      style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: 'hsl(var(--theme-card))',
        border: '1px solid hsl(var(--theme-border))',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <div 
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'hsl(var(--theme-text))',
          }}
        >
          {t.title}
        </div>
        <div 
          style={{
            fontSize: '11px',
            color: 'hsl(var(--theme-text-muted))',
          }}
        >
          {t.subtitle}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {/* Off-Plan */}
        <div 
          style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: winner === 'offplan' ? 'rgba(16, 185, 129, 0.05)' : 'hsla(var(--theme-bg), 0.5)',
            border: `1px solid ${winner === 'offplan' ? 'rgba(16, 185, 129, 0.3)' : 'hsl(var(--theme-border))'}`,
          }}
        >
          <div 
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: winner === 'offplan' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              color: winner === 'offplan' ? '#10B981' : 'hsl(var(--theme-text-muted))',
              border: `1px solid ${winner === 'offplan' ? 'rgba(16, 185, 129, 0.3)' : 'hsl(var(--theme-border))'}`,
              display: 'inline-block',
              marginBottom: '8px',
            }}
          >
            {winner === 'offplan' && '🏆 '}{t.offPlan}
          </div>
          <div 
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: winner === 'offplan' ? '#10B981' : 'hsl(var(--theme-text))',
            }}
          >
            {formatValue(offPlanMonthlyRent)}{t.perMonth}
          </div>
          <div 
            style={{
              fontSize: '12px',
              color: winner === 'offplan' ? 'rgba(16, 185, 129, 0.8)' : 'hsl(var(--theme-text-muted))',
            }}
          >
            {formatValue(offPlanYearlyRent)}{t.perYear}
          </div>
          <div 
            style={{
              fontSize: '9px',
              color: 'hsl(var(--theme-text-muted))',
              marginTop: '4px',
            }}
          >
            {t.offPlanNote}
          </div>
        </div>

        {/* Secondary */}
        <div 
          style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: winner === 'secondary' ? 'rgba(6, 182, 212, 0.05)' : 'hsla(var(--theme-bg), 0.5)',
            border: `1px solid ${winner === 'secondary' ? 'rgba(6, 182, 212, 0.3)' : 'hsl(var(--theme-border))'}`,
          }}
        >
          <div 
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: winner === 'secondary' ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
              color: winner === 'secondary' ? '#06B6D4' : 'hsl(var(--theme-text-muted))',
              border: `1px solid ${winner === 'secondary' ? 'rgba(6, 182, 212, 0.3)' : 'hsl(var(--theme-border))'}`,
              display: 'inline-block',
              marginBottom: '8px',
            }}
          >
            {winner === 'secondary' && '🏆 '}{t.secondary}
          </div>
          <div 
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: winner === 'secondary' ? '#06B6D4' : 'hsl(var(--theme-text))',
            }}
          >
            {formatValue(secondaryMonthlyRent)}{t.perMonth}
          </div>
          <div 
            style={{
              fontSize: '12px',
              color: winner === 'secondary' ? 'rgba(6, 182, 212, 0.8)' : 'hsl(var(--theme-text-muted))',
            }}
          >
            {formatValue(secondaryYearlyRent)}{t.perYear}
          </div>
          <div 
            style={{
              fontSize: '9px',
              color: 'hsl(var(--theme-text-muted))',
              marginTop: '4px',
            }}
          >
            {t.secondaryNote}
          </div>
        </div>
      </div>

      {/* Winner Badge */}
      {percentDiff !== 0 && (
        <div 
          style={{
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: winner === 'offplan' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(6, 182, 212, 0.1)',
            border: `1px solid ${winner === 'offplan' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
            textAlign: 'center',
          }}
        >
          <span 
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: winner === 'offplan' ? '#10B981' : '#06B6D4',
            }}
          >
            📈 {winner === 'offplan' ? t.offPlanHigher : t.secondaryHigher}
          </span>
        </div>
      )}
    </div>
  );
};
