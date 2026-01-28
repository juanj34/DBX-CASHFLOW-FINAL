import { MortgageInputs, MortgageAnalysis } from '../useMortgageCalculations';
import { Currency, formatDualCurrency } from '../currencyUtils';

interface ExportMortgageCardProps {
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  monthlyRent: number;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

export const ExportMortgageCard = ({
  mortgageInputs,
  mortgageAnalysis,
  monthlyRent,
  currency,
  rate,
  language,
}: ExportMortgageCardProps) => {
  if (!mortgageInputs.enabled) return null;

  const { loanAmount, monthlyPayment, totalInterest, equityRequiredPercent } = mortgageAnalysis;
  
  const monthlyCashflow = monthlyRent - monthlyPayment;
  const isPositive = monthlyCashflow >= 0;

  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

  const t = {
    mortgage: language === 'es' ? 'Hipoteca' : 'Mortgage',
    loanAmount: language === 'es' ? 'Monto del Préstamo' : 'Loan Amount',
    monthlyPayment: language === 'es' ? 'Cuota Mensual' : 'Monthly Payment',
    rentalIncome: language === 'es' ? 'Ingreso Renta' : 'Rental Income',
    monthlyCashflow: language === 'es' ? 'Flujo Mensual' : 'Monthly Cashflow',
    interest: language === 'es' ? 'Interés' : 'Interest',
    positive: language === 'es' ? 'Positivo' : 'Positive',
    negative: language === 'es' ? 'Negativo' : 'Negative',
    years: language === 'es' ? 'años' : 'yrs',
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    fontSize: '12px',
  };
  const labelStyle = { color: 'hsl(var(--theme-text-muted))' };
  const valueStyle = { 
    fontFamily: 'monospace', 
    color: 'hsl(var(--theme-text))',
    fontFeatureSettings: '"tnum"' as const,
  };

  return (
    <div 
      style={{
        backgroundColor: 'hsl(var(--theme-card))',
        border: '1px solid hsl(var(--theme-border))',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div 
        style={{
          padding: '12px',
          borderBottom: '1px solid hsl(var(--theme-border))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--theme-text))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🏦 {t.mortgage}
        </span>
        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', color: 'rgb(168, 85, 247)' }}>
          {mortgageInputs.loanTermYears}{t.years} @ {mortgageInputs.interestRate}%
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        <div style={rowStyle}>
          <span style={labelStyle}>{t.loanAmount} ({100 - equityRequiredPercent}%)</span>
          <span style={valueStyle}>{getDualValue(loanAmount).primary}</span>
        </div>
        
        <div style={rowStyle}>
          <span style={{ ...labelStyle, fontWeight: 600 }}>{t.monthlyPayment}</span>
          <span style={{ ...valueStyle, fontWeight: 700, color: 'rgb(168, 85, 247)' }}>{getDualValue(monthlyPayment).primary}</span>
        </div>
        
        <div style={rowStyle}>
          <span style={labelStyle}>{t.rentalIncome}</span>
          <span style={{ ...valueStyle, color: 'rgb(34, 211, 238)' }}>+{getDualValue(monthlyRent).primary}</span>
        </div>
        
        <div style={{ ...rowStyle, borderTop: '1px solid hsl(var(--border))', marginTop: '8px', paddingTop: '8px' }}>
          <span style={{ ...labelStyle, fontWeight: 600 }}>{t.monthlyCashflow}</span>
          <span style={{ ...valueStyle, fontWeight: 700, color: isPositive ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)' }}>
            {isPositive ? '+' : ''}{getDualValue(monthlyCashflow).primary}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
            {t.interest}: {getDualValue(totalInterest).primary}
          </span>
          <span 
            style={{ 
              fontSize: '10px', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: isPositive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
              border: `1px solid ${isPositive ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
              color: isPositive ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)',
            }}
          >
            {isPositive ? '📈' : '📉'} {isPositive ? t.positive : t.negative}
          </span>
        </div>
      </div>
    </div>
  );
};
