import { useMemo } from 'react';
import { Currency, formatDualCurrencyCompact } from '@/components/roi/currencyUtils';
import { OIInputs } from '@/components/roi/useOICalculations';
import { ExitComparisonPoint } from '../types';
import { 
  calculateEquityAtExitWithDetails, 
  calculateExitPrice 
} from '@/components/roi/constructionProgress';

interface ExportExitScenariosProps {
  exitMonths: number[];
  offPlanInputs: OIInputs;
  offPlanBasePrice: number;
  offPlanTotalMonths: number;
  offPlanEntryCosts: number;
  secondaryPurchasePrice: number;
  secondaryAppreciationRate: number;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

/**
 * ExportExitScenarios - Static exit table for comparison PDF/PNG exports
 * No animations, no tooltips, no interactivity
 */
export const ExportExitScenarios = ({
  exitMonths,
  offPlanInputs,
  offPlanBasePrice,
  offPlanTotalMonths,
  offPlanEntryCosts,
  secondaryPurchasePrice,
  secondaryAppreciationRate,
  currency,
  rate,
  language,
}: ExportExitScenariosProps) => {
  const t = language === 'es' ? {
    title: 'Escenarios de Salida',
    subtitle: 'ROE basado en apreciación pura',
    exit: 'Salida',
    value: 'Valor',
    profit: 'Ganancia',
    roe: 'ROE',
    roePY: '/año',
    winner: 'Ganador',
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
  } : {
    title: 'Exit Scenarios',
    subtitle: 'ROE based on pure appreciation',
    exit: 'Exit',
    value: 'Value',
    profit: 'Profit',
    roe: 'ROE',
    roePY: '/yr',
    winner: 'Winner',
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
  };

  const exitData = useMemo((): ExitComparisonPoint[] => {
    return exitMonths.map((months) => {
      const years = months / 12;
      
      // Off-Plan calculations
      const equityResult = calculateEquityAtExitWithDetails(
        months, 
        offPlanInputs, 
        offPlanTotalMonths, 
        offPlanBasePrice
      );
      const opCapitalAtExit = equityResult.finalEquity + offPlanEntryCosts;
      
      const opExitPrice = calculateExitPrice(
        months, 
        offPlanBasePrice, 
        offPlanTotalMonths, 
        offPlanInputs
      );
      const opAppreciation = opExitPrice - offPlanBasePrice;
      const opROE = opCapitalAtExit > 0 ? (opAppreciation / opCapitalAtExit) * 100 : 0;
      const opAnnualizedROE = years > 0 ? opROE / years : 0;
      
      // Secondary calculations
      const secExitPrice = secondaryPurchasePrice * Math.pow(1 + secondaryAppreciationRate / 100, years);
      const secProfit = secExitPrice - secondaryPurchasePrice;
      const secROE = secondaryPurchasePrice > 0 ? (secProfit / secondaryPurchasePrice) * 100 : 0;
      const secAnnualizedROE = years > 0 ? secROE / years : 0;
      
      return {
        months,
        offPlan: {
          propertyValue: opExitPrice,
          capitalInvested: opCapitalAtExit,
          profit: opAppreciation,
          totalROE: opROE,
          annualizedROE: opAnnualizedROE,
        },
        secondary: {
          propertyValue: secExitPrice,
          capitalInvested: secondaryPurchasePrice,
          profit: secProfit,
          totalROE: secROE,
          annualizedROE: secAnnualizedROE,
        },
      };
    });
  }, [exitMonths, offPlanInputs, offPlanBasePrice, offPlanTotalMonths, offPlanEntryCosts, secondaryPurchasePrice, secondaryAppreciationRate]);

  const formatValue = (value: number) => {
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  const formatExitLabel = (months: number) => {
    const years = months / 12;
    if (Number.isInteger(years)) {
      return language === 'es' ? `Año ${years}` : `Year ${years}`;
    }
    return `${months}m`;
  };

  if (exitMonths.length === 0) {
    return null;
  }

  const cellStyle = {
    padding: '10px 8px',
    fontSize: '11px',
    borderBottom: '1px solid hsl(var(--theme-border))',
  };

  const headerCellStyle = {
    ...cellStyle,
    fontSize: '10px',
    fontWeight: 600,
    color: 'hsl(var(--theme-text-muted))',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  };

  return (
    <div 
      style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: 'hsl(var(--theme-card))',
        border: '1px solid hsl(var(--theme-border))',
        marginBottom: '16px',
      }}
    >
      <div style={{ marginBottom: '12px' }}>
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

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...headerCellStyle, textAlign: 'left', width: '80px' }}>{t.exit}</th>
            <th style={{ ...headerCellStyle, textAlign: 'center' }} colSpan={3}>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '4px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
              }}>
                🏗️ {t.offPlan}
              </span>
            </th>
            <th style={{ ...headerCellStyle, textAlign: 'center' }} colSpan={3}>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '4px',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                color: '#06B6D4',
              }}>
                🏠 {t.secondary}
              </span>
            </th>
            <th style={{ ...headerCellStyle, textAlign: 'center', width: '60px' }}>{t.winner}</th>
          </tr>
          <tr>
            <th style={{ ...headerCellStyle }}></th>
            <th style={{ ...headerCellStyle, textAlign: 'center' }}>{t.value}</th>
            <th style={{ ...headerCellStyle, textAlign: 'center' }}>{t.profit}</th>
            <th style={{ ...headerCellStyle, textAlign: 'center' }}>{t.roe}</th>
            <th style={{ ...headerCellStyle, textAlign: 'center' }}>{t.value}</th>
            <th style={{ ...headerCellStyle, textAlign: 'center' }}>{t.profit}</th>
            <th style={{ ...headerCellStyle, textAlign: 'center' }}>{t.roe}</th>
            <th style={{ ...headerCellStyle }}></th>
          </tr>
        </thead>
        <tbody>
          {exitData.map((exit) => {
            const winner = exit.offPlan.annualizedROE > exit.secondary.annualizedROE ? 'offplan' : 'secondary';
            
            return (
              <tr key={exit.months}>
                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 500, color: 'hsl(var(--theme-text))' }}>
                  {formatExitLabel(exit.months)}
                </td>
                
                {/* Off-Plan */}
                <td style={{ ...cellStyle, textAlign: 'center', color: 'hsl(var(--theme-text))' }}>
                  {formatValue(exit.offPlan.propertyValue)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center', color: winner === 'offplan' ? '#10B981' : 'hsl(var(--theme-text))', fontWeight: winner === 'offplan' ? 600 : 400 }}>
                  +{formatValue(exit.offPlan.profit)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <div style={{ color: winner === 'offplan' ? '#10B981' : 'hsl(var(--theme-text))', fontWeight: 500 }}>
                    {exit.offPlan.totalROE.toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '9px', color: 'hsl(var(--theme-text-muted))' }}>
                    ({exit.offPlan.annualizedROE.toFixed(1)}%{t.roePY})
                  </div>
                </td>
                
                {/* Secondary */}
                <td style={{ ...cellStyle, textAlign: 'center', color: 'hsl(var(--theme-text))' }}>
                  {formatValue(exit.secondary.propertyValue)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center', color: winner === 'secondary' ? '#06B6D4' : 'hsl(var(--theme-text))', fontWeight: winner === 'secondary' ? 600 : 400 }}>
                  +{formatValue(exit.secondary.profit)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <div style={{ color: winner === 'secondary' ? '#06B6D4' : 'hsl(var(--theme-text))', fontWeight: 500 }}>
                    {exit.secondary.totalROE.toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '9px', color: 'hsl(var(--theme-text-muted))' }}>
                    ({exit.secondary.annualizedROE.toFixed(1)}%{t.roePY})
                  </div>
                </td>
                
                {/* Winner */}
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <span 
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 600,
                      backgroundColor: winner === 'offplan' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                      color: winner === 'offplan' ? '#10B981' : '#06B6D4',
                    }}
                  >
                    🏆 {winner === 'offplan' ? 'OP' : 'SEC'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
