import { format } from 'date-fns';
import { Currency, formatDualCurrencyCompact } from '@/components/roi/currencyUtils';

interface ExportComparisonHeaderProps {
  offPlanProjectName: string;
  offPlanBasePrice: number;
  secondaryPropertyName?: string;
  secondaryPurchasePrice: number;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

/**
 * ExportComparisonHeader - Static header for comparison PDF/PNG exports
 * No animations, fixed dimensions for html2canvas capture
 */
export const ExportComparisonHeader = ({
  offPlanProjectName,
  offPlanBasePrice,
  secondaryPropertyName,
  secondaryPurchasePrice,
  currency,
  rate,
  language,
}: ExportComparisonHeaderProps) => {
  const formatValue = (value: number): string => {
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  const t = language === 'es' ? {
    title: 'Comparación Off-Plan vs Secundaria',
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
    vs: 'vs',
    generatedOn: 'Generado el',
  } : {
    title: 'Off-Plan vs Secondary Comparison',
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
    vs: 'vs',
    generatedOn: 'Generated on',
  };

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '2px solid hsl(var(--theme-accent))',
      }}
    >
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h1 
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'hsl(var(--theme-text))',
            margin: 0,
          }}
        >
          {t.title}
        </h1>
        <p 
          style={{
            fontSize: '12px',
            color: 'hsl(var(--theme-text-muted))',
            margin: 0,
          }}
        >
          {t.generatedOn} {format(new Date(), 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Property Comparison */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Off-Plan Badge */}
        <div 
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <div 
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#10B981',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}
          >
            🏗️ {t.offPlan}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--theme-text))' }}>
            {offPlanProjectName}
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--theme-text-muted))' }}>
            {formatValue(offPlanBasePrice)}
          </div>
        </div>

        {/* VS */}
        <div 
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'hsl(var(--theme-text-muted))',
          }}
        >
          {t.vs}
        </div>

        {/* Secondary Badge */}
        <div 
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
          }}
        >
          <div 
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#06B6D4',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}
          >
            🏠 {t.secondary}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--theme-text))' }}>
            {secondaryPropertyName || t.secondary}
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--theme-text-muted))' }}>
            {formatValue(secondaryPurchasePrice)}
          </div>
        </div>
      </div>
    </div>
  );
};
