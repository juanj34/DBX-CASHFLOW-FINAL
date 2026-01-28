import { OIInputs } from '../useOICalculations';
import { Currency, formatDualCurrency } from '../currencyUtils';

interface ExportPostHandoverCardProps {
  inputs: OIInputs;
  monthlyRent: number;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

// Inline SVG icons for export (no Lucide dependency)
const RefreshCwIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 16h5v5"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);

const translations = {
  postHandoverCoverage: { en: 'Post-Handover Coverage', es: 'Cobertura Post-Entrega' },
  postHandoverPayments: { en: 'Post-HO Payments', es: 'Pagos Post-Entrega' },
  monthlyEquivalent: { en: 'Monthly Equivalent', es: 'Equivalente Mensual' },
  rentalIncome: { en: 'Rental Income', es: 'Ingreso por Alquiler' },
  monthlyGap: { en: 'Monthly Gap', es: 'Diferencia Mensual' },
  monthlySurplus: { en: 'Monthly Surplus', es: 'Excedente Mensual' },
  fullCoverage: { en: 'Full', es: 'Completa' },
  partialCoverage: { en: 'Partial', es: 'Parcial' },
  rentCovers: { en: 'Rent covers', es: 'La renta cubre' },
  totalGapOver: { en: 'gap over', es: 'diferencia en' },
  mo: { en: 'mo', es: 'me' },
};

export const ExportPostHandoverCard = ({
  inputs,
  monthlyRent,
  currency,
  rate,
  language,
}: ExportPostHandoverCardProps) => {
  const t = (key: keyof typeof translations) => translations[key][language];
  
  // Only render if post-handover plan is enabled
  if (!inputs.hasPostHandoverPlan) return null;
  if (!inputs.postHandoverPayments?.length) return null;

  const basePrice = inputs.basePrice;
  
  // Calculate total post-handover payments
  const postHandoverTotal = inputs.postHandoverPayments.reduce(
    (sum, p) => sum + (basePrice * p.paymentPercent / 100), 0
  );

  // Calculate duration in months
  const handoverMonth = (inputs.handoverQuarter - 1) * 3 + 1;
  const handoverDate = new Date(inputs.handoverYear, handoverMonth - 1);
  const endMonth = (inputs.postHandoverEndQuarter - 1) * 3 + 1;
  const endDate = new Date(inputs.postHandoverEndYear, endMonth - 1);
  
  const postHandoverMonths = Math.max(1, 
    (endDate.getFullYear() - handoverDate.getFullYear()) * 12 + 
    (endDate.getMonth() - handoverDate.getMonth())
  );

  // Monthly equivalent payment
  const monthlyEquivalent = postHandoverTotal / postHandoverMonths;

  // Cashflow calculation
  const monthlyCashflow = monthlyRent - monthlyEquivalent;
  const coveragePercent = monthlyEquivalent > 0 
    ? Math.round((monthlyRent / monthlyEquivalent) * 100) 
    : 0;
  const isFullyCovered = monthlyCashflow >= 0;

  // Total gap over the period
  const totalGap = Math.abs(monthlyCashflow) * postHandoverMonths;

  // Dual currency helper
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

  // Format end date for badge
  const endDateStr = `Q${inputs.postHandoverEndQuarter} ${inputs.postHandoverEndYear}`;

  return (
    <div style={{
      backgroundColor: 'hsl(var(--theme-card))',
      border: '1px solid hsl(var(--theme-border))',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px',
        borderBottom: '1px solid hsl(var(--theme-border))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#a855f7' }}><RefreshCwIcon /></span>
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'hsl(var(--theme-text))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {t('postHandoverCoverage')}
          </span>
        </div>
        <span style={{
          fontSize: '9px',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          color: '#a855f7',
        }}>
          {postHandoverMonths}{t('mo')} @ {endDateStr}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        {/* Rows */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: 'hsl(var(--theme-text-muted))' }}>
            {t('postHandoverPayments')} ({inputs.postHandoverPercent || 0}%)
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'hsl(var(--theme-text))' }}>
            {getDualValue(postHandoverTotal).primary}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: 'hsl(var(--theme-text-muted))' }}>
            {t('monthlyEquivalent')}
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, color: '#a855f7' }}>
            {getDualValue(monthlyEquivalent).primary}/{t('mo')}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: 'hsl(var(--theme-text-muted))' }}>
            {t('rentalIncome')}
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#22d3ee' }}>
            +{getDualValue(monthlyRent).primary}/{t('mo')}
          </span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid hsl(var(--border))', marginTop: '8px', paddingTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--theme-text))' }}>
              {isFullyCovered ? t('monthlySurplus') : t('monthlyGap')}
            </span>
            <span style={{ 
              fontSize: '11px', 
              fontFamily: 'monospace', 
              fontWeight: 600, 
              color: isFullyCovered ? '#4ade80' : '#f87171' 
            }}>
              {isFullyCovered ? '+' : '-'}{getDualValue(Math.abs(monthlyCashflow)).primary}/{t('mo')}
            </span>
          </div>
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '9px',
            padding: '2px 6px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: isFullyCovered ? 'rgba(74, 222, 128, 0.1)' : 'rgba(250, 204, 21, 0.1)',
            border: `1px solid ${isFullyCovered ? 'rgba(74, 222, 128, 0.3)' : 'rgba(250, 204, 21, 0.3)'}`,
            color: isFullyCovered ? '#4ade80' : '#facc15',
          }}>
            {isFullyCovered ? <CheckCircleIcon /> : <AlertCircleIcon />}
            {isFullyCovered ? t('fullCoverage') : t('partialCoverage')}
          </span>
          <span style={{
            fontSize: '9px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'hsl(var(--muted))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
          }}>
            {isFullyCovered 
              ? `${t('rentCovers')} ${coveragePercent}%+` 
              : `${getDualValue(totalGap).primary} ${t('totalGapOver')} ${postHandoverMonths}${t('mo')}`
            }
          </span>
        </div>
      </div>
    </div>
  );
};
