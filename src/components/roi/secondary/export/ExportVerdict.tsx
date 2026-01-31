import { ComparisonMetrics } from '../types';
import { formatCurrency } from '@/components/roi/currencyUtils';

interface ExportVerdictProps {
  metrics: ComparisonMetrics;
  offPlanProjectName?: string;
  language: 'en' | 'es';
}

/**
 * ExportVerdict - Static verdict card for comparison PDF/PNG exports
 * No animations, no interactivity
 */
export const ExportVerdict = ({ metrics, offPlanProjectName, language }: ExportVerdictProps) => {
  // Calculate key advantages
  const capitalAdvantage = ((metrics.secondaryCapitalDay1 - metrics.offPlanCapitalDay1) / metrics.secondaryCapitalDay1 * 100);
  const wealthAdvantage = ((metrics.offPlanWealthYear10 - metrics.secondaryWealthYear10LT) / metrics.secondaryWealthYear10LT * 100);
  const roeAdvantage = metrics.offPlanROEYear10 - metrics.secondaryROEYear10LT;
  
  // Determine overall winner
  const offPlanAdvantages = [
    capitalAdvantage > 20,
    wealthAdvantage > 30,
    roeAdvantage > 10,
  ].filter(Boolean).length;
  
  const isOffPlanWinner = offPlanAdvantages >= 2;

  const formatSecondaryCapital = (value: number) => {
    if (value >= 1000000) {
      return `AED ${(value / 1000000).toFixed(2)}M`;
    }
    return `AED ${(value / 1000).toFixed(0)}K`;
  };

  const t = language === 'es' ? {
    recommendation: 'RECOMENDACIÓN',
    offPlanWinner: 'es la mejor opción para construcción de riqueza',
    secondaryWinner: 'Secundaria es mejor si necesitas cashflow inmediato',
    advantages: 'Ventajas',
    tradeoffs: 'Trade-offs',
    disadvantages: 'Desventajas',
    lessCapital: 'menos capital inicial',
    moreWealth: 'más riqueza en 10 años',
    moreROE: 'más ROE anualizado',
    surpassesYear: 'Supera secundaria en Año',
    monthsNoIncome: 'meses sin ingresos',
    constructionRisk: 'Riesgo de construcción',
    incomeFromDay1: 'Ingresos desde día 1',
    dscrCovers: 'cubre hipoteca',
    readyProperty: 'Propiedad lista, sin espera',
    capitalRequired: 'capital requerido',
    appreciationOnly: 'apreciación anual',
    lowROE: '(bajo)',
    offPlan: 'OFF-PLAN',
    secondary: 'SECUNDARIA',
    recommended: 'Recomendado',
  } : {
    recommendation: 'RECOMMENDATION',
    offPlanWinner: 'is the best option for wealth building',
    secondaryWinner: 'Secondary is better if you need immediate cashflow',
    advantages: 'Advantages',
    tradeoffs: 'Trade-offs',
    disadvantages: 'Disadvantages',
    lessCapital: 'less initial capital',
    moreWealth: 'more wealth in 10 years',
    moreROE: 'more annualized ROE',
    surpassesYear: 'Surpasses secondary in Year',
    monthsNoIncome: 'months without income',
    constructionRisk: 'Construction risk',
    incomeFromDay1: 'Income from day 1',
    dscrCovers: 'covers mortgage',
    readyProperty: 'Ready property, no wait',
    capitalRequired: 'capital required',
    appreciationOnly: 'annual appreciation',
    lowROE: '(low)',
    offPlan: 'OFF-PLAN',
    secondary: 'SECONDARY',
    recommended: 'Recommended',
  };

  const offPlanPros = [
    `${capitalAdvantage.toFixed(0)}% ${t.lessCapital}`,
    `${wealthAdvantage.toFixed(0)}% ${t.moreWealth}`,
    `${roeAdvantage.toFixed(1)}% ${t.moreROE}`,
    metrics.crossoverYearLT ? `${t.surpassesYear} ${metrics.crossoverYearLT}` : null,
  ].filter(Boolean) as string[];
  
  const offPlanCons = [
    `${metrics.offPlanMonthsNoIncome} ${t.monthsNoIncome}`,
    t.constructionRisk,
  ];
  
  const secondaryPros = [
    t.incomeFromDay1,
    `DSCR ${(metrics.secondaryDSCRLT * 100).toFixed(0)}% (${t.dscrCovers})`,
    t.readyProperty,
  ];
  
  const secondaryCons = [
    `${formatSecondaryCapital(metrics.secondaryCapitalDay1)} ${t.capitalRequired}`,
    `3% ${t.appreciationOnly}`,
    `ROE ${metrics.secondaryROEYear10LT.toFixed(1)}% ${t.lowROE}`,
  ];

  const proItemStyle = {
    padding: '8px',
    borderRadius: '6px',
    fontSize: '11px',
    marginBottom: '6px',
  };

  return (
    <div 
      style={{
        borderRadius: '8px',
        backgroundColor: 'hsl(var(--theme-card))',
        border: '1px solid hsl(var(--theme-border))',
        overflow: 'hidden',
      }}
    >
      {/* Winner Banner */}
      <div 
        style={{
          padding: '16px 20px',
          background: isOffPlanWinner 
            ? 'linear-gradient(to right, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))' 
            : 'linear-gradient(to right, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.05))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            style={{
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: isOffPlanWinner ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)',
            }}
          >
            <span style={{ fontSize: '24px' }}>🏆</span>
          </div>
          <div>
            <div 
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: isOffPlanWinner ? '#10B981' : '#06B6D4',
                color: 'white',
                marginBottom: '4px',
              }}
            >
              {t.recommendation}
            </div>
            <div 
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'hsl(var(--theme-text))',
              }}
            >
              {isOffPlanWinner 
                ? `${offPlanProjectName || 'Off-Plan'} ${t.offPlanWinner}`
                : t.secondaryWinner
              }
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Off-Plan Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span 
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  border: '1px solid #10B981',
                }}
              >
                {t.offPlan}
              </span>
              {isOffPlanWinner && (
                <span 
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: '#10B981',
                    color: 'white',
                  }}
                >
                  {t.recommended}
                </span>
              )}
            </div>
            
            {/* Pros */}
            <div style={{ marginBottom: '12px' }}>
              <div 
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  color: '#10B981',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                {t.advantages}
              </div>
              {offPlanPros.map((pro, idx) => (
                <div 
                  key={idx}
                  style={{
                    ...proItemStyle,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10B981',
                  }}
                >
                  ✓ {pro}
                </div>
              ))}
            </div>
            
            {/* Cons */}
            <div>
              <div 
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  color: '#F59E0B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                {t.tradeoffs}
              </div>
              {offPlanCons.map((con, idx) => (
                <div 
                  key={idx}
                  style={{
                    ...proItemStyle,
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    color: '#D97706',
                  }}
                >
                  ⚠ {con}
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span 
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  color: '#06B6D4',
                  border: '1px solid #06B6D4',
                }}
              >
                {t.secondary}
              </span>
              {!isOffPlanWinner && (
                <span 
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: '#06B6D4',
                    color: 'white',
                  }}
                >
                  {t.recommended}
                </span>
              )}
            </div>
            
            {/* Pros */}
            <div style={{ marginBottom: '12px' }}>
              <div 
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  color: '#06B6D4',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                {t.advantages}
              </div>
              {secondaryPros.map((pro, idx) => (
                <div 
                  key={idx}
                  style={{
                    ...proItemStyle,
                    backgroundColor: 'hsla(var(--theme-bg), 0.5)',
                    border: '1px solid hsl(var(--theme-border))',
                    color: 'hsl(var(--theme-text))',
                  }}
                >
                  ✓ {pro}
                </div>
              ))}
            </div>
            
            {/* Cons */}
            <div>
              <div 
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  color: '#EF4444',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                {t.disadvantages}
              </div>
              {secondaryCons.map((con, idx) => (
                <div 
                  key={idx}
                  style={{
                    ...proItemStyle,
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#DC2626',
                  }}
                >
                  ✗ {con}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
