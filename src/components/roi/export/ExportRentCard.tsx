import { OIInputs } from '../useOICalculations';
import { Currency, formatDualCurrency } from '../currencyUtils';

interface ExportRentCardProps {
  inputs: OIInputs;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

export const ExportRentCard = ({
  inputs,
  currency,
  rate,
  language,
}: ExportRentCardProps) => {
  const { 
    basePrice,
    rentalYieldPercent, 
    serviceChargePerSqft = 18,
    unitSizeSqf = 0,
    showAirbnbComparison,
    shortTermRental
  } = inputs;
  
  if (rentalYieldPercent <= 0) return null;

  // Long-term calculations
  const grossAnnualRent = basePrice * (rentalYieldPercent / 100);
  const annualServiceCharges = unitSizeSqf * serviceChargePerSqft;
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const monthlyRent = netAnnualRent / 12;
  const grossYield = rentalYieldPercent;
  const netYield = basePrice > 0 ? (netAnnualRent / basePrice) * 100 : 0;
  
  // Short-term calculations
  const adrValue = shortTermRental?.averageDailyRate || 800;
  const occupancyPercent = shortTermRental?.occupancyPercent || 70;
  const operatingExpensePercent = shortTermRental?.operatingExpensePercent || 25;
  const managementFeePercent = shortTermRental?.managementFeePercent || 15;
  
  const grossAirbnbAnnual = adrValue * 365 * (occupancyPercent / 100);
  const totalExpensePercent = operatingExpensePercent + managementFeePercent;
  const airbnbOperatingExpenses = grossAirbnbAnnual * (totalExpensePercent / 100);
  const netAirbnbAnnual = grossAirbnbAnnual - airbnbOperatingExpenses - annualServiceCharges;
  const monthlyAirbnb = netAirbnbAnnual / 12;
  
  const airbnbDifferencePercent = netAnnualRent > 0 
    ? ((netAirbnbAnnual - netAnnualRent) / netAnnualRent) * 100
    : 0;

  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

  const t = {
    rentalIncome: language === 'es' ? 'Ingresos por Renta' : 'Rental Income',
    longTerm: language === 'es' ? 'Largo Plazo' : 'Long-Term',
    shortTerm: language === 'es' ? 'Corto Plazo' : 'Short-Term',
    gross: language === 'es' ? 'Bruto' : 'Gross',
    service: language === 'es' ? 'Servicio' : 'Service',
    netYear: language === 'es' ? 'Neto/Año' : 'Net/Year',
    monthly: language === 'es' ? 'Mensual' : 'Monthly',
    net: language === 'es' ? 'Neto' : 'Net',
    expenses: language === 'es' ? 'Gastos' : 'Expenses',
    vsLongTerm: language === 'es' ? 'vs Largo Plazo' : 'vs Long-Term',
    ltStBadge: language === 'es' ? 'LP + CP' : 'LT + ST',
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
          🏠 {t.rentalIncome}
        </span>
        {showAirbnbComparison && (
          <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(251, 146, 60, 0.1)', border: '1px solid rgba(251, 146, 60, 0.3)', color: 'rgb(251, 146, 60)' }}>
            {t.ltStBadge}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ display: showAirbnbComparison ? 'grid' : 'block', gridTemplateColumns: showAirbnbComparison ? '1fr 1fr' : '1fr' }}>
        {/* Long-Term Section */}
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: 'rgb(34, 211, 238)', marginBottom: '8px' }}>
            {t.longTerm}
          </div>
          
          <div style={rowStyle}>
            <span style={labelStyle}>{t.gross}</span>
            <span style={valueStyle}>
              {getDualValue(grossAnnualRent).primary}
              {getDualValue(grossAnnualRent).secondary && (
                <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(grossAnnualRent).secondary})</span>
              )}
            </span>
          </div>
          
          {unitSizeSqf > 0 && (
            <div style={rowStyle}>
              <span style={labelStyle}>− {t.service}</span>
              <span style={{ ...valueStyle, color: 'rgb(248, 113, 113)' }}>
                -{getDualValue(annualServiceCharges).primary}
                {getDualValue(annualServiceCharges).secondary && (
                  <span style={{ marginLeft: '4px' }}>({getDualValue(annualServiceCharges).secondary})</span>
                )}
              </span>
            </div>
          )}
          
          <div style={{ ...rowStyle, borderTop: '1px solid hsl(var(--theme-border))', marginTop: '4px', paddingTop: '8px' }}>
            <span style={{ ...labelStyle, fontWeight: 600 }}>= {t.netYear}</span>
            <span style={{ ...valueStyle, fontWeight: 700, color: 'hsl(var(--primary))' }}>
              {getDualValue(netAnnualRent).primary}
              {getDualValue(netAnnualRent).secondary && (
                <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px', fontWeight: 400 }}>({getDualValue(netAnnualRent).secondary})</span>
              )}
            </span>
          </div>
          
          <div style={rowStyle}>
            <span style={labelStyle}>{t.monthly}</span>
            <span style={{ ...valueStyle, color: 'rgb(34, 211, 238)' }}>
              {getDualValue(monthlyRent).primary}
              {getDualValue(monthlyRent).secondary && (
                <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(monthlyRent).secondary})</span>
              )}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
              {t.gross}: {grossYield.toFixed(1)}%
            </span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.3)', color: 'rgb(34, 211, 238)' }}>
              {t.net}: {netYield.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Short-Term Section */}
        {showAirbnbComparison && (
          <div style={{ padding: '12px', borderLeft: '1px solid hsl(var(--border))', backgroundColor: 'rgba(251, 146, 60, 0.05)' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: 'rgb(251, 146, 60)', marginBottom: '8px' }}>
              {t.shortTerm}
            </div>
            
            <div style={rowStyle}>
              <span style={labelStyle}>ADR × {occupancyPercent}%</span>
              <span style={valueStyle}>
                {getDualValue(grossAirbnbAnnual).primary}
                {getDualValue(grossAirbnbAnnual).secondary && (
                  <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(grossAirbnbAnnual).secondary})</span>
                )}
              </span>
            </div>
            
            <div style={rowStyle}>
              <span style={labelStyle}>− {t.expenses}</span>
              <span style={{ ...valueStyle, color: 'rgb(248, 113, 113)' }}>
                -{getDualValue(airbnbOperatingExpenses + annualServiceCharges).primary}
                {getDualValue(airbnbOperatingExpenses + annualServiceCharges).secondary && (
                  <span style={{ marginLeft: '4px' }}>({getDualValue(airbnbOperatingExpenses + annualServiceCharges).secondary})</span>
                )}
              </span>
            </div>
            
            <div style={{ ...rowStyle, borderTop: '1px solid rgba(251, 146, 60, 0.2)', marginTop: '4px', paddingTop: '8px' }}>
              <span style={{ ...labelStyle, fontWeight: 600 }}>= {t.netYear}</span>
              <span style={{ ...valueStyle, fontWeight: 700, color: 'rgb(251, 146, 60)' }}>
                {getDualValue(netAirbnbAnnual).primary}
                {getDualValue(netAirbnbAnnual).secondary && (
                  <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px', fontWeight: 400 }}>({getDualValue(netAirbnbAnnual).secondary})</span>
                )}
              </span>
            </div>
            
            <div style={rowStyle}>
              <span style={labelStyle}>{t.monthly}</span>
              <span style={{ ...valueStyle, color: 'rgb(251, 146, 60)' }}>
                {getDualValue(monthlyAirbnb).primary}
                {getDualValue(monthlyAirbnb).secondary && (
                  <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>({getDualValue(monthlyAirbnb).secondary})</span>
                )}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 500, color: airbnbDifferencePercent >= 0 ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)' }}>
                {airbnbDifferencePercent >= 0 ? '📈' : '📉'} {airbnbDifferencePercent >= 0 ? '+' : ''}{airbnbDifferencePercent.toFixed(0)}% {t.vsLongTerm}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
