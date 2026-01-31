import { SecondaryYearlyProjection } from '../types';
import { OIYearlyProjection } from '@/components/roi/useOICalculations';
import { Currency } from '@/components/roi/currencyUtils';

interface ExportWealthTableProps {
  offPlanProjections: OIYearlyProjection[];
  secondaryProjections: SecondaryYearlyProjection[];
  handoverYearIndex: number;
  rentalMode: 'long-term' | 'airbnb';
  offPlanBasePrice: number;
  secondaryPurchasePrice: number;
  language: 'en' | 'es';
}

const formatCompact = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '—';
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toFixed(0);
};

/**
 * ExportWealthTable - Static year-by-year table for comparison PDF/PNG exports
 * No animations, no tooltips, no interactivity
 */
export const ExportWealthTable = ({
  offPlanProjections,
  secondaryProjections,
  handoverYearIndex,
  rentalMode,
  offPlanBasePrice,
  secondaryPurchasePrice,
  language,
}: ExportWealthTableProps) => {
  const isAirbnb = rentalMode === 'airbnb';
  const currentYear = new Date().getFullYear();

  const t = language === 'es' ? {
    title: 'Progresión de Activos Año a Año',
    year: 'Año',
    value: 'Valor',
    rent: 'Renta Acum.',
    wealth: 'Activos',
    delta: 'Delta',
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
    purchase: 'Compra',
    handover: '🔑',
    noRent: '—',
  } : {
    title: 'Year-by-Year Asset Progression',
    year: 'Year',
    value: 'Value',
    rent: 'Cumul. Rent',
    wealth: 'Assets',
    delta: 'Delta',
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
    purchase: 'Purchase',
    handover: '🔑',
    noRent: '—',
  };

  // Build table data
  const tableData = [];
  
  // Year 0 - Purchase Day
  tableData.push({
    year: 0,
    offPlanValue: offPlanBasePrice,
    offPlanCumulativeRent: 0,
    offPlanWealth: offPlanBasePrice,
    secondaryValue: secondaryPurchasePrice,
    secondaryCumulativeRent: 0,
    secondaryWealth: secondaryPurchasePrice,
    delta: offPlanBasePrice - secondaryPurchasePrice,
    isHandover: false,
    isBeforeHandover: true,
    isPurchase: true,
  });
  
  // Years 1-10
  let opCumulativeRent = 0;
  let secCumulativeRent = 0;
  
  for (let index = 0; index < Math.min(offPlanProjections.length, 10); index++) {
    const opProj = offPlanProjections[index];
    const secProj = secondaryProjections[index];
    const year = index + 1;
    
    const isBeforeHandover = year < handoverYearIndex;
    
    const opAnnualRent = isBeforeHandover ? 0 : (opProj?.netIncome || 0);
    const secAnnualRent = isAirbnb ? (secProj?.netRentST || 0) : (secProj?.netRentLT || 0);
    
    opCumulativeRent += opAnnualRent;
    secCumulativeRent += secAnnualRent;
    
    const offPlanValue = opProj?.propertyValue || offPlanBasePrice;
    const secondaryValue = secProj?.propertyValue || secondaryPurchasePrice;
    
    const opWealth = offPlanValue + opCumulativeRent;
    const secWealth = secondaryValue + secCumulativeRent;
    
    tableData.push({
      year,
      offPlanValue,
      offPlanCumulativeRent: opCumulativeRent,
      offPlanWealth: opWealth,
      secondaryValue,
      secondaryCumulativeRent: secCumulativeRent,
      secondaryWealth: secWealth,
      delta: opWealth - secWealth,
      isHandover: year === handoverYearIndex,
      isBeforeHandover,
      isPurchase: false,
    });
  }

  const cellStyle = {
    padding: '8px 6px',
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
      <div 
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'hsl(var(--theme-text))',
          marginBottom: '12px',
        }}
      >
        {t.title}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...headerCellStyle, textAlign: 'left', width: '60px' }}>{t.year}</th>
            <th style={{ ...headerCellStyle, textAlign: 'center' }} colSpan={3}>
              <span style={{ color: '#10B981' }}>● {t.offPlan}</span>
            </th>
            <th style={{ ...headerCellStyle, textAlign: 'center' }} colSpan={3}>
              <span style={{ color: '#06B6D4' }}>● {t.secondary}</span>
            </th>
            <th style={{ ...headerCellStyle, textAlign: 'right', width: '100px' }}>{t.delta}</th>
          </tr>
          <tr>
            <th style={{ ...headerCellStyle }}></th>
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>{t.value}</th>
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>{t.rent}</th>
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>{t.wealth}</th>
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>{t.value}</th>
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>{t.rent}</th>
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>{t.wealth}</th>
            <th style={{ ...headerCellStyle }}></th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => (
            <tr 
              key={row.year}
              style={{
                backgroundColor: row.isPurchase 
                  ? 'rgba(var(--theme-accent), 0.05)' 
                  : row.isHandover 
                    ? 'rgba(16, 185, 129, 0.05)' 
                    : 'transparent',
              }}
            >
              <td style={{ ...cellStyle, textAlign: 'left', color: 'hsl(var(--theme-text))' }}>
                {row.isPurchase ? (
                  <span style={{ fontStyle: 'italic', color: 'hsl(var(--theme-text-muted))' }}>
                    0 ({t.purchase})
                  </span>
                ) : (
                  <>
                    {row.year}
                    {row.isHandover && (
                      <span style={{ marginLeft: '6px' }}>{t.handover}</span>
                    )}
                  </>
                )}
              </td>
              <td style={{ ...cellStyle, textAlign: 'right', color: 'hsl(var(--theme-text))' }}>
                AED {formatCompact(row.offPlanValue)}
              </td>
              <td style={{ ...cellStyle, textAlign: 'right', color: row.isPurchase || row.isBeforeHandover ? 'hsl(var(--theme-text-muted))' : 'hsl(var(--theme-text))' }}>
                {row.isPurchase || row.isBeforeHandover ? t.noRent : `AED ${formatCompact(row.offPlanCumulativeRent)}`}
              </td>
              <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600, color: row.delta > 0 ? '#10B981' : 'hsl(var(--theme-text))' }}>
                AED {formatCompact(row.offPlanWealth)}
              </td>
              <td style={{ ...cellStyle, textAlign: 'right', color: 'hsl(var(--theme-text))' }}>
                AED {formatCompact(row.secondaryValue)}
              </td>
              <td style={{ ...cellStyle, textAlign: 'right', color: row.isPurchase ? 'hsl(var(--theme-text-muted))' : 'hsl(var(--theme-text))' }}>
                {row.isPurchase ? t.noRent : `AED ${formatCompact(row.secondaryCumulativeRent)}`}
              </td>
              <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600, color: row.delta < 0 ? '#06B6D4' : 'hsl(var(--theme-text))' }}>
                AED {formatCompact(row.secondaryWealth)}
              </td>
              <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600, color: row.delta > 0 ? '#10B981' : row.delta < 0 ? '#EF4444' : 'hsl(var(--theme-text-muted))' }}>
                {row.delta >= 0 ? '+' : '-'}AED {formatCompact(Math.abs(row.delta))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
