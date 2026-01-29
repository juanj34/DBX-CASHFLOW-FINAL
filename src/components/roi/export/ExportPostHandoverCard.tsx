import { OIInputs, PaymentMilestone } from '../useOICalculations';
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
  perInstallment: { en: 'Per Installment', es: 'Por Cuota' },
  onHandover: { en: 'On Handover', es: 'En Entrega' },
  tenantCovers: { en: 'Tenant Covers', es: 'Inquilino Cubre' },
  youPay: { en: 'You Pay', es: 'Tu Pagas' },
  payments: { en: 'payments', es: 'pagos' },
  tenantFullyCovers: { en: 'Tenant fully covers!', es: '¡Inquilino cubre totalmente!' },
  surplus: { en: 'surplus', es: 'excedente' },
  net: { en: 'Net', es: 'Neto' },
};

// Check if a payment is AFTER the handover quarter (strictly after Q end)
const isPaymentAfterHandoverQuarter = (
  monthsFromBooking: number,
  bookingMonth: number,
  bookingYear: number,
  handoverQuarter: number,
  handoverYear: number
): boolean => {
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
  
  const handoverQuarterEndMonth = handoverQuarter * 3;
  const handoverQuarterEnd = new Date(handoverYear, handoverQuarterEndMonth - 1, 28);
  
  return paymentDate > handoverQuarterEnd;
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

  const basePrice = inputs.basePrice;
  
  // On-handover payment
  const onHandoverPercent = inputs.onHandoverPercent || 0;
  const onHandoverAmount = basePrice * (onHandoverPercent / 100);
  
  // First try dedicated postHandoverPayments array
  let postHandoverPaymentsToUse: PaymentMilestone[] = inputs.postHandoverPayments || [];
  
  // If empty, derive from additionalPayments (time-based payments AFTER handover quarter end)
  if (postHandoverPaymentsToUse.length === 0 && inputs.additionalPayments?.length > 0) {
    postHandoverPaymentsToUse = inputs.additionalPayments.filter(p => {
      if (p.type !== 'time') return false;
      return isPaymentAfterHandoverQuarter(
        p.triggerValue,
        inputs.bookingMonth,
        inputs.bookingYear,
        inputs.handoverQuarter,
        inputs.handoverYear
      );
    });
  }
  
  // Return null only if no post-handover payments found
  if (postHandoverPaymentsToUse.length === 0) return null;

  // Calculate post-handover percentage from actual payments
  const postHandoverPercent = postHandoverPaymentsToUse.reduce(
    (sum, p) => sum + p.paymentPercent, 0
  );
  
  // Calculate total post-handover payments
  const postHandoverTotal = basePrice * (postHandoverPercent / 100);
  
  // Count actual number of payments
  const numberOfPayments = postHandoverPaymentsToUse.length;

  // Calculate duration from actual payment schedule
  const paymentMonths = postHandoverPaymentsToUse.map(p => p.triggerValue);
  const lastPaymentMonth = Math.max(...paymentMonths);
  const firstPaymentMonth = Math.min(...paymentMonths);
  const actualDurationMonths = Math.max(1, lastPaymentMonth - firstPaymentMonth + 1);

  // Per installment amount
  const perInstallmentAmount = postHandoverTotal / numberOfPayments;

  // Monthly cashflow burn rate
  const monthlyEquivalent = postHandoverTotal / actualDurationMonths;

  // Cashflow calculation
  const monthlyCashflow = monthlyRent - monthlyEquivalent;
  const isFullyCovered = monthlyCashflow >= 0;

  // Total tenant contribution over the post-handover period
  const totalTenantContribution = monthlyRent * actualDurationMonths;

  // What investor actually pays out of pocket
  const netOutOfPocket = Math.max(0, postHandoverTotal - totalTenantContribution);

  // Coverage percentage
  const tenantCoversPercent = postHandoverTotal > 0 
    ? Math.min(100, Math.round((totalTenantContribution / postHandoverTotal) * 100))
    : 0;

  // Surplus if tenant pays more than post-HO
  const surplus = totalTenantContribution - postHandoverTotal;

  // Dual currency helper
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

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
          {actualDurationMonths}{t('mo')} ({numberOfPayments} {t('payments')})
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        {/* Post-HO Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: 'hsl(var(--theme-text-muted))' }}>
            {t('postHandoverPayments')} ({Math.round(postHandoverPercent)}%)
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'hsl(var(--theme-text))' }}>
            {getDualValue(postHandoverTotal).primary}
          </span>
        </div>
        
        {/* Per Installment */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: 'hsl(var(--theme-text-muted))' }}>
            {t('perInstallment')} ({numberOfPayments}x)
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, color: '#a855f7' }}>
            {getDualValue(perInstallmentAmount).primary}
          </span>
        </div>

        {/* Monthly Cashflow Analysis */}
        <div style={{ borderTop: '1px dashed hsl(var(--theme-border))', marginTop: '8px', paddingTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--theme-text-muted))' }}>
              {t('monthlyEquivalent')}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'hsl(var(--theme-text))' }}>
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

        {/* Simple Summary */}
        <div style={{ borderTop: '1px solid hsl(var(--theme-border))', marginTop: '8px', paddingTop: '8px' }}>
          {onHandoverAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'hsl(var(--theme-text-muted))' }}>
                {t('onHandover')}
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#facc15' }}>
                {getDualValue(onHandoverAmount).primary}
              </span>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--theme-text-muted))' }}>
              {t('tenantCovers')} ({actualDurationMonths}{t('mo')})
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#22d3ee' }}>
              +{getDualValue(totalTenantContribution).primary}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--theme-text))' }}>
              {t('youPay')}
            </span>
            <span style={{ 
              fontSize: '11px', 
              fontFamily: 'monospace', 
              fontWeight: 600, 
              color: netOutOfPocket > 0 ? '#f87171' : '#4ade80' 
            }}>
              {getDualValue(netOutOfPocket).primary}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{ marginTop: '8px' }}>
          <div style={{
            padding: '8px',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            backgroundColor: tenantCoversPercent >= 100 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(250, 204, 21, 0.1)',
            border: `1px solid ${tenantCoversPercent >= 100 ? 'rgba(74, 222, 128, 0.3)' : 'rgba(250, 204, 21, 0.3)'}`,
            color: tenantCoversPercent >= 100 ? '#4ade80' : '#facc15',
          }}>
            {tenantCoversPercent >= 100 ? (
              <>
                <CheckCircleIcon />
                {t('tenantFullyCovers')} +{getDualValue(surplus).primary} {t('surplus')}
              </>
            ) : (
              <>
                <AlertCircleIcon />
                {t('tenantCovers')} {tenantCoversPercent}% • {t('net')}: {getDualValue(netOutOfPocket).primary}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
