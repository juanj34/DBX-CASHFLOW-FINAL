import { Currency, formatDualCurrencyCompact } from '@/components/roi/currencyUtils';

interface ExportOutOfPocketProps {
  offPlanCapitalDuringConstruction: number;
  monthsWithoutIncome: number;
  appreciationDuringConstruction: number;
  secondaryCapitalDay1: number;
  secondaryPurchasePrice: number;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

/**
 * ExportOutOfPocket - Static out-of-pocket card for comparison PDF/PNG exports
 * No animations, no tooltips, no interactivity
 */
export const ExportOutOfPocket = ({
  offPlanCapitalDuringConstruction,
  monthsWithoutIncome,
  appreciationDuringConstruction,
  secondaryCapitalDay1,
  secondaryPurchasePrice,
  currency,
  rate,
  language,
}: ExportOutOfPocketProps) => {
  const avgMonthlyRent = secondaryPurchasePrice * 0.07 / 12;
  const opportunityCost = avgMonthlyRent * monthsWithoutIncome;

  const formatValue = (value: number): string => {
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  const t = language === 'es' ? {
    title: 'Fase de Construcción',
    subtitle: 'Capital sin retorno inmediato',
    totalCapital: 'Capital Total',
    noIncome: 'Sin Ingresos',
    withIncome: 'Con Ingresos',
    appreciation: 'Apreciación',
    estimatedRent: 'Renta Estimada',
    months: 'meses',
    fromDay1: 'Desde día 1',
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
  } : {
    title: 'Construction Phase',
    subtitle: 'Capital without immediate return',
    totalCapital: 'Total Capital',
    noIncome: 'No Income',
    withIncome: 'With Income',
    appreciation: 'Appreciation',
    estimatedRent: 'Estimated Rent',
    months: 'months',
    fromDay1: 'From day 1',
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  };

  const labelStyle = {
    fontSize: '11px',
    color: 'hsl(var(--theme-text-muted))',
  };

  const valueStyle = {
    fontSize: '13px',
    fontWeight: 600,
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Off-Plan Side */}
        <div 
          style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <div 
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#10B981',
              marginBottom: '12px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              display: 'inline-block',
            }}
          >
            {t.offPlan}
          </div>
          
          <div style={rowStyle}>
            <span style={labelStyle}>{t.totalCapital}</span>
            <span style={{ ...valueStyle, color: 'hsl(var(--theme-text))' }}>
              {formatValue(offPlanCapitalDuringConstruction)}
            </span>
          </div>
          
          <div style={rowStyle}>
            <span style={labelStyle}>{t.noIncome}</span>
            <span style={{ ...valueStyle, color: '#F59E0B' }}>
              {monthsWithoutIncome} {t.months}
            </span>
          </div>
          
          <div style={rowStyle}>
            <span style={labelStyle}>{t.appreciation}</span>
            <span style={{ ...valueStyle, color: '#10B981' }}>
              +{formatValue(appreciationDuringConstruction)}
            </span>
          </div>
        </div>

        {/* Secondary Side */}
        <div 
          style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(6, 182, 212, 0.05)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
          }}
        >
          <div 
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#06B6D4',
              marginBottom: '12px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              display: 'inline-block',
            }}
          >
            {t.secondary}
          </div>
          
          <div style={rowStyle}>
            <span style={labelStyle}>{t.totalCapital}</span>
            <span style={{ ...valueStyle, color: 'hsl(var(--theme-text))' }}>
              {formatValue(secondaryCapitalDay1)}
            </span>
          </div>
          
          <div style={rowStyle}>
            <span style={labelStyle}>{t.withIncome}</span>
            <span style={{ ...valueStyle, color: '#06B6D4' }}>
              {t.fromDay1}
            </span>
          </div>
          
          <div style={rowStyle}>
            <span style={labelStyle}>{t.estimatedRent}</span>
            <span style={{ ...valueStyle, color: '#06B6D4' }}>
              +{formatValue(opportunityCost)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
