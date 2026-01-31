import { Currency, formatDualCurrencyCompact } from '@/components/roi/currencyUtils';

interface ExportMortgageCoverageProps {
  monthlyRent: number;
  monthlyMortgage: number;
  netCashflow: number;
  coveragePercent: number;
  loanAmount: number;
  principalPaidYear10: number;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

/**
 * ExportMortgageCoverage - Static mortgage card for comparison PDF/PNG exports
 * No animations, no tooltips, no interactivity
 */
export const ExportMortgageCoverage = ({
  monthlyRent,
  monthlyMortgage,
  netCashflow,
  coveragePercent,
  loanAmount,
  principalPaidYear10,
  currency,
  rate,
  language,
}: ExportMortgageCoverageProps) => {
  const isFullyCovered = coveragePercent >= 100;
  const yearlyRent = monthlyRent * 12;
  const yearlyMortgage = monthlyMortgage * 12;
  const yearlyCashflow = netCashflow * 12;
  const principalPaydownPercent = loanAmount > 0 ? (principalPaidYear10 / loanAmount) * 100 : 0;

  const formatValue = (value: number): string => {
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  const t = language === 'es' ? {
    title: isFullyCovered ? '¡El Inquilino Paga Tu Hipoteca!' : 'Cobertura de Hipoteca',
    subtitle: isFullyCovered ? 'La propiedad se paga sola + ganancias' : 'La renta cubre parcialmente la hipoteca',
    monthlyRent: 'Renta Mensual',
    mortgagePayment: 'Pago Hipoteca',
    netCashflow: 'Cashflow Neto',
    coverage: 'Cobertura',
    hiddenWealth: 'Riqueza Oculta',
    tenantPaysOff: 'Tu inquilino paga',
    ofYourLoan: 'de tu préstamo en 10 años',
    perMonth: '/mes',
    perYear: '/año',
    selfPaying: '✨ Auto-financiada',
    partialCoverage: 'Cobertura Parcial',
  } : {
    title: isFullyCovered ? 'Tenant Pays Your Mortgage!' : 'Mortgage Coverage',
    subtitle: isFullyCovered ? 'Property pays itself + profit' : 'Rent partially covers mortgage',
    monthlyRent: 'Monthly Rent',
    mortgagePayment: 'Mortgage Payment',
    netCashflow: 'Net Cashflow',
    coverage: 'Coverage',
    hiddenWealth: 'Hidden Wealth',
    tenantPaysOff: 'Your tenant pays off',
    ofYourLoan: 'of your loan in 10 years',
    perMonth: '/mo',
    perYear: '/yr',
    selfPaying: '✨ Self-Paying',
    partialCoverage: 'Partial Coverage',
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
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
        <span 
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 600,
            backgroundColor: isFullyCovered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            color: isFullyCovered ? '#10B981' : '#F59E0B',
          }}
        >
          {isFullyCovered ? t.selfPaying : t.partialCoverage}
        </span>
      </div>

      {/* Rent vs Mortgage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div 
          style={{
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: 'rgba(6, 182, 212, 0.05)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
          }}
        >
          <div style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))', marginBottom: '4px' }}>
            {t.monthlyRent}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#06B6D4' }}>
            {formatValue(monthlyRent)}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(6, 182, 212, 0.7)' }}>
            {formatValue(yearlyRent)}{t.perYear}
          </div>
        </div>
        <div 
          style={{
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: 'hsla(var(--theme-bg), 0.5)',
            border: '1px solid hsl(var(--theme-border))',
          }}
        >
          <div style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))', marginBottom: '4px' }}>
            {t.mortgagePayment}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'hsl(var(--theme-text))' }}>
            {formatValue(monthlyMortgage)}
          </div>
          <div style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>
            {formatValue(yearlyMortgage)}{t.perYear}
          </div>
        </div>
      </div>

      {/* Coverage Bar */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>{t.coverage}</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: isFullyCovered ? '#10B981' : '#F59E0B' }}>
            {Math.round(coveragePercent)}%
          </span>
        </div>
        <div 
          style={{
            height: '8px',
            backgroundColor: 'hsl(var(--theme-border))',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div 
            style={{
              height: '100%',
              width: `${Math.min(coveragePercent, 150)}%`,
              backgroundColor: isFullyCovered ? '#10B981' : '#F59E0B',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>

      {/* Net Cashflow */}
      <div 
        style={{
          padding: '10px',
          borderRadius: '8px',
          backgroundColor: isFullyCovered ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${isFullyCovered ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <span style={{ fontSize: '12px', color: 'hsl(var(--theme-text))' }}>
          {t.netCashflow}
        </span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: isFullyCovered ? '#10B981' : '#F59E0B' }}>
            {isFullyCovered ? '+' : '-'}{formatValue(Math.abs(netCashflow))}{t.perMonth}
          </div>
          <div style={{ fontSize: '10px', color: isFullyCovered ? 'rgba(16, 185, 129, 0.7)' : 'rgba(245, 158, 11, 0.7)' }}>
            {isFullyCovered ? '+' : '-'}{formatValue(Math.abs(yearlyCashflow))}{t.perYear}
          </div>
        </div>
      </div>

      {/* Hidden Wealth */}
      {loanAmount > 0 && principalPaidYear10 > 0 && (
        <div style={{ borderTop: '1px solid hsl(var(--theme-border))', paddingTop: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--theme-text))', marginBottom: '8px' }}>
            ✨ {t.hiddenWealth}
          </div>
          <div style={{ fontSize: '11px', color: 'hsl(var(--theme-text-muted))' }}>
            {t.tenantPaysOff} <span style={{ color: '#F59E0B', fontWeight: 600 }}>{formatValue(principalPaidYear10)}</span> ({principalPaydownPercent.toFixed(0)}%) {t.ofYourLoan}
          </div>
        </div>
      )}
    </div>
  );
};
