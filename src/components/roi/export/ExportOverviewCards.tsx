import { OIInputs, OICalculations } from '../useOICalculations';
import { Currency, formatDualCurrency } from '../currencyUtils';

interface ExportOverviewCardsProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

export const ExportOverviewCards = ({
  inputs,
  calculations,
  currency,
  rate,
  language,
}: ExportOverviewCardsProps) => {
  const { basePrice, downpaymentPercent, preHandoverPercent, oqoodFee, rentalYieldPercent, serviceChargePerSqft = 18, unitSizeSqf = 0 } = inputs;
  
  // Calculate Cash to Start
  const downpaymentAmount = basePrice * (downpaymentPercent / 100);
  const dldFee = basePrice * 0.04;
  const cashToStart = downpaymentAmount + dldFee + oqoodFee;
  
  // Calculate Rental Income
  const grossAnnualRent = basePrice * (rentalYieldPercent / 100);
  const annualServiceCharges = unitSizeSqf * serviceChargePerSqft;
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const monthlyRent = netAnnualRent / 12;
  const netYieldPercent = basePrice > 0 ? (netAnnualRent / basePrice) * 100 : 0;
  
  // Calculate Breakeven
  const yearsToBreakeven = calculations.holdAnalysis?.yearsToPayOff || 0;
  
  // Calculate Monthly Burn Rate
  const preHandoverInstallments = (inputs.additionalPayments || []).reduce(
    (sum, m) => sum + (basePrice * m.paymentPercent / 100), 0
  );
  const totalPreHandoverCash = cashToStart + preHandoverInstallments;
  const monthlyBurnRate = calculations.totalMonths > 0 
    ? totalPreHandoverCash / calculations.totalMonths 
    : 0;
  
  const handoverPercent = 100 - preHandoverPercent;

  // Dual currency values
  const cashToStartDual = formatDualCurrency(cashToStart, currency, rate);
  const monthlyRentDual = formatDualCurrency(monthlyRent, currency, rate);
  const netAnnualRentDual = formatDualCurrency(netAnnualRent, currency, rate);
  const monthlyBurnDual = formatDualCurrency(monthlyBurnRate, currency, rate);

  const t = {
    cashToStart: language === 'es' ? 'Entrada Inicial' : 'Cash to Start',
    rentalIncome: language === 'es' ? 'Renta' : 'Rental Income',
    breakeven: language === 'es' ? 'Punto de Equilibrio' : 'Breakeven',
    monthlyBurn: language === 'es' ? 'Cuota Mensual' : 'Monthly Burn',
    mo: language === 'es' ? 'mes' : 'mo',
    yr: language === 'es' ? 'año' : 'yr',
    years: language === 'es' ? 'años' : 'years',
    fromRent: language === 'es' ? 'desde renta' : 'from rental income',
    untilHandover: language === 'es' ? 'hasta entrega' : 'until handover',
  };

  const cardStyle = {
    backgroundColor: 'hsl(var(--theme-card))',
    border: '1px solid hsl(var(--theme-border))',
    borderRadius: '12px',
    padding: '12px',
    height: '88px',
    display: 'flex',
    flexDirection: 'column' as const,
  };

  const labelStyle = {
    fontSize: '10px',
    color: 'hsl(var(--theme-text-muted))',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const valueStyle = {
    fontSize: '16px',
    fontWeight: 700,
    color: 'hsl(var(--theme-text))',
    fontFamily: 'monospace',
    fontFeatureSettings: '"tnum"' as const,
    lineHeight: 1.2,
  };

  const badgeBase = {
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: 'auto',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
      {/* Card 1: Cash to Start */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={labelStyle}>{t.cashToStart}</span>
          <span style={{ ...badgeBase, backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
            {preHandoverPercent}/{handoverPercent}
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={valueStyle}>{cashToStartDual.primary}</div>
          {cashToStartDual.secondary && (
            <span style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>{cashToStartDual.secondary}</span>
          )}
        </div>
      </div>

      {/* Card 2: Rental Income */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={labelStyle}>{t.rentalIncome}</span>
          <span style={{ ...badgeBase, backgroundColor: 'rgba(34, 211, 238, 0.1)', color: 'rgb(34, 211, 238)' }}>
            {netYieldPercent.toFixed(1)}%
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={valueStyle}>
            {monthlyRentDual.primary}<span style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>/{t.mo}</span>
          </div>
          <span style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>{netAnnualRentDual.primary}/{t.yr}</span>
        </div>
      </div>

      {/* Card 3: Breakeven */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={labelStyle}>{t.breakeven}</span>
          <span style={{ ...badgeBase, backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'rgb(168, 85, 247)' }}>
            {netYieldPercent.toFixed(1)}%
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={valueStyle}>
            {yearsToBreakeven < 999 ? `${yearsToBreakeven.toFixed(1)} ${t.years}` : 'N/A'}
          </div>
          <span style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>{t.fromRent}</span>
        </div>
      </div>

      {/* Card 4: Monthly Burn Rate */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={labelStyle}>{t.monthlyBurn}</span>
          <span style={{ ...badgeBase, backgroundColor: 'rgba(251, 146, 60, 0.1)', color: 'rgb(251, 146, 60)' }}>
            {calculations.totalMonths}{t.mo}
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={valueStyle}>
            ~{monthlyBurnDual.primary}<span style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>/{t.mo}</span>
          </div>
          {monthlyBurnDual.secondary && (
            <span style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>{monthlyBurnDual.secondary}</span>
          )}
          <span style={{ fontSize: '10px', color: 'hsl(var(--theme-text-muted))' }}>{t.untilHandover}</span>
        </div>
      </div>
    </div>
  );
};
