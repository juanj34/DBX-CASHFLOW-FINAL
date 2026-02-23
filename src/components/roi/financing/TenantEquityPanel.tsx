import { TrendingUp, Users } from "lucide-react";
import { Currency, formatCurrency } from "../currencyUtils";
import { AmortizationPoint } from "../useMortgageCalculations";
import { useLanguage } from '@/contexts/LanguageContext';

interface TenantEquityPanelProps {
  loanAmount: number;
  amortizationSchedule: AmortizationPoint[];
  principalPaidYear5: number;
  principalPaidYear10: number;
  loanTermYears: number;
  currency: Currency;
  rate: number;
}

export const TenantEquityPanel = ({
  loanAmount,
  amortizationSchedule,
  principalPaidYear5,
  principalPaidYear10,
  loanTermYears,
  currency,
  rate,
}: TenantEquityPanelProps) => {
  const { t } = useLanguage();
  // Get key data points for the mini chart
  const chartPoints = amortizationSchedule
    .filter((_, i) => i % 5 === 4 || i === 0 || i === amortizationSchedule.length - 1)
    .slice(0, 6);

  // Calculate SVG path for the area chart
  const width = 100;
  const height = 40;
  const padding = 2;
  
  const maxBalance = loanAmount;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = amortizationSchedule.map((point, i) => {
    const x = padding + (i / (amortizationSchedule.length - 1)) * chartWidth;
    const y = padding + ((maxBalance - point.balance) / maxBalance) * chartHeight;
    return { x, y, year: point.year, balance: point.balance, principalPaid: point.principalPaid };
  });

  // Create path for the area (filled from bottom)
  const areaPath = points.length > 0
    ? `M ${points[0].x} ${height - padding} ` +
      points.map(p => `L ${p.x} ${height - padding - (p.principalPaid / maxBalance) * chartHeight}`).join(' ') +
      ` L ${points[points.length - 1].x} ${height - padding} Z`
    : '';

  return (
    <div className="p-4 rounded-xl bg-theme-card border border-theme-border h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-theme-text-highlight" />
        <span className="text-xs font-medium text-theme-text-muted uppercase tracking-wider">{t('tenantFundedEquityLabel')}</span>
      </div>

      {/* Mini Area Chart */}
      <div className="flex-1 flex items-center justify-center mb-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12">
          <defs>
            <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--theme-text-highlight))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--theme-text-highlight))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Background */}
          <rect x={padding} y={padding} width={chartWidth} height={chartHeight} fill="transparent" rx="2" />
          
          {/* Area fill */}
          <path d={areaPath} fill="url(#equityGradient)" />
          
          {/* Top line */}
          {points.length > 1 && (
            <polyline
              points={points.map(p => `${p.x},${height - padding - (p.principalPaid / maxBalance) * chartHeight}`).join(' ')}
              fill="none"
              stroke="hsl(var(--theme-text-highlight))"
              strokeWidth="1.5"
            />
          )}
          
          {/* End point */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={height - padding - (points[points.length - 1].principalPaid / maxBalance) * chartHeight}
              r="2"
              fill="hsl(var(--theme-text-highlight))"
            />
          )}
        </svg>
      </div>

      {/* Key Milestones */}
      <div className="space-y-2">
        {loanTermYears >= 5 && (
          <div className="flex items-center justify-between p-2 bg-theme-bg-alt rounded-lg">
            <span className="text-xs text-theme-text-muted">{t('year5')}</span>
            <span className="text-sm font-mono font-semibold text-theme-text-highlight">
              {formatCurrency(principalPaidYear5, currency, rate)}
            </span>
          </div>
        )}
        
        {loanTermYears >= 10 && (
          <div className="flex items-center justify-between p-2 bg-theme-bg-alt rounded-lg">
            <span className="text-xs text-theme-text-muted">{t('year10Label')}</span>
            <span className="text-sm font-mono font-semibold text-theme-text-highlight">
              {formatCurrency(principalPaidYear10, currency, rate)}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between p-2 bg-theme-text-highlight/10 rounded-lg border border-theme-text-highlight/30">
          <span className="text-xs text-theme-text-muted">{t('fullTermLabel')} ({loanTermYears}{t('yearsShort')})</span>
          <span className="text-sm font-mono font-bold text-theme-positive">
            {formatCurrency(loanAmount, currency, rate)}
          </span>
        </div>
      </div>

      {/* Pitch Text */}
      <p className="text-[9px] text-theme-text-muted text-center mt-3 leading-relaxed">
        {t('tenantEquityPitchPrefix')} {formatCurrency(principalPaidYear10 || loanAmount, currency, rate)} {t('tenantEquityPitchSuffix')}
      </p>
    </div>
  );
};
