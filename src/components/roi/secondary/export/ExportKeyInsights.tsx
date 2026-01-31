import { Currency, formatDualCurrencyCompact } from '@/components/roi/currencyUtils';

interface ExportKeyInsightsProps {
  offPlanTotalAssets10Y: number;
  secondaryTotalAssets10Y: number;
  offPlanPropertyValue10Y: number;
  secondaryPropertyValue10Y: number;
  offPlanTotalCapital: number;
  secondaryCapitalDay1: number;
  offPlanMonthlyRent5Y: number;
  secondaryMonthlyRent5Y: number;
  appreciationDuringConstruction: number;
  secondaryRentDuringConstruction: number;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

/**
 * ExportKeyInsights - Static 4-card grid for comparison PDF/PNG exports
 * No animations, no tooltips, no interactivity
 */
export const ExportKeyInsights = ({
  offPlanTotalAssets10Y,
  secondaryTotalAssets10Y,
  offPlanPropertyValue10Y,
  secondaryPropertyValue10Y,
  offPlanTotalCapital,
  secondaryCapitalDay1,
  offPlanMonthlyRent5Y,
  secondaryMonthlyRent5Y,
  appreciationDuringConstruction,
  secondaryRentDuringConstruction,
  currency,
  rate,
  language,
}: ExportKeyInsightsProps) => {
  // Multiplier calculations
  const offPlanMultiplier = offPlanTotalCapital > 0
    ? offPlanPropertyValue10Y / offPlanTotalCapital
    : 0;
  const secondaryMultiplier = secondaryCapitalDay1 > 0
    ? secondaryPropertyValue10Y / secondaryCapitalDay1
    : 0;

  const formatValue = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  const formatPropertyValue = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    const dual = formatDualCurrencyCompact(value, currency, rate);
    return dual.primary;
  };

  const t = language === 'es' ? {
    totalWealth: 'Riqueza Total',
    totalWealthSubtitle: 'Valor + Renta 10 años',
    moneyMultiplier: 'Multiplicador de Valor',
    moneyMultiplierSubtitle: 'Crecimiento del Inmueble (10 años)',
    monthlyRent5Y: 'Renta Mensual (Año 5)',
    monthlyRent5YSubtitle: 'Ingreso a madurez',
    constructionTradeoff: 'Período Construcción',
    constructionTradeoffSubtitle: 'Qué ganas mientras esperas',
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
    valueGrowth: '📈 Valor',
    rentEarned: '💰 Renta',
  } : {
    totalWealth: 'Total Wealth',
    totalWealthSubtitle: 'Value + Rent at 10Y',
    moneyMultiplier: 'Value Multiplier',
    moneyMultiplierSubtitle: 'Property Value Growth (10Y)',
    monthlyRent5Y: 'Monthly Rent (Year 5)',
    monthlyRent5YSubtitle: 'Rental at maturity',
    constructionTradeoff: 'Construction Period',
    constructionTradeoffSubtitle: 'What you gain while waiting',
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
    valueGrowth: '📈 Value',
    rentEarned: '💰 Rent',
  };

  const cards = [
    {
      title: t.totalWealth,
      subtitle: t.totalWealthSubtitle,
      offPlanValue: formatValue(offPlanTotalAssets10Y),
      secondaryValue: formatValue(secondaryTotalAssets10Y),
      winner: offPlanTotalAssets10Y > secondaryTotalAssets10Y ? 'offplan' : 'secondary',
    },
    {
      title: t.moneyMultiplier,
      subtitle: t.moneyMultiplierSubtitle,
      offPlanValue: `${offPlanMultiplier.toFixed(1)}x`,
      offPlanSubValue: `→ ${formatPropertyValue(offPlanPropertyValue10Y)}`,
      secondaryValue: `${secondaryMultiplier.toFixed(1)}x`,
      secondarySubValue: `→ ${formatPropertyValue(secondaryPropertyValue10Y)}`,
      winner: offPlanMultiplier > secondaryMultiplier ? 'offplan' : 'secondary',
    },
    {
      title: t.monthlyRent5Y,
      subtitle: t.monthlyRent5YSubtitle,
      offPlanValue: formatValue(offPlanMonthlyRent5Y),
      secondaryValue: formatValue(secondaryMonthlyRent5Y),
      winner: offPlanMonthlyRent5Y > secondaryMonthlyRent5Y ? 'offplan' : 'secondary',
    },
    {
      title: t.constructionTradeoff,
      subtitle: t.constructionTradeoffSubtitle,
      offPlanValue: `+${formatValue(appreciationDuringConstruction)}`,
      offPlanSubValue: t.valueGrowth,
      secondaryValue: `+${formatValue(secondaryRentDuringConstruction)}`,
      secondarySubValue: t.rentEarned,
      winner: appreciationDuringConstruction > secondaryRentDuringConstruction ? 'offplan' : 'secondary',
    },
  ];

  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}
    >
      {cards.map((card, index) => {
        const isOffPlanWinner = card.winner === 'offplan';
        
        return (
          <div
            key={index}
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: 'hsl(var(--theme-card))',
              border: '1px solid hsl(var(--theme-border))',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '12px' }}>
              <div 
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text))',
                  marginBottom: '2px',
                }}
              >
                {card.title}
              </div>
              <div 
                style={{
                  fontSize: '10px',
                  color: 'hsl(var(--theme-text-muted))',
                }}
              >
                {card.subtitle}
              </div>
            </div>

            {/* Off-Plan Row */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span 
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: isOffPlanWinner ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                  color: isOffPlanWinner ? '#10B981' : 'hsl(var(--theme-text-muted))',
                  border: `1px solid ${isOffPlanWinner ? 'rgba(16, 185, 129, 0.3)' : 'hsl(var(--theme-border))'}`,
                }}
              >
                {isOffPlanWinner && '🏆 '}{t.offPlan}
              </span>
              <div style={{ textAlign: 'right' }}>
                <div 
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isOffPlanWinner ? '#10B981' : 'hsl(var(--theme-text))',
                  }}
                >
                  {card.offPlanValue}
                </div>
                {(card as any).offPlanSubValue && (
                  <div 
                    style={{
                      fontSize: '10px',
                      color: isOffPlanWinner ? 'rgba(16, 185, 129, 0.7)' : 'hsl(var(--theme-text-muted))',
                    }}
                  >
                    {(card as any).offPlanSubValue}
                  </div>
                )}
              </div>
            </div>

            {/* Secondary Row */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span 
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: !isOffPlanWinner ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                  color: !isOffPlanWinner ? '#06B6D4' : 'hsl(var(--theme-text-muted))',
                  border: `1px solid ${!isOffPlanWinner ? 'rgba(6, 182, 212, 0.3)' : 'hsl(var(--theme-border))'}`,
                }}
              >
                {!isOffPlanWinner && '🏆 '}{t.secondary}
              </span>
              <div style={{ textAlign: 'right' }}>
                <div 
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: !isOffPlanWinner ? '#06B6D4' : 'hsl(var(--theme-text))',
                  }}
                >
                  {card.secondaryValue}
                </div>
                {(card as any).secondarySubValue && (
                  <div 
                    style={{
                      fontSize: '10px',
                      color: !isOffPlanWinner ? 'rgba(6, 182, 212, 0.7)' : 'hsl(var(--theme-text-muted))',
                    }}
                  >
                    {(card as any).secondarySubValue}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
