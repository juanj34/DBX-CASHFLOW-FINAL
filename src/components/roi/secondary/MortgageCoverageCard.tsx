import { Home, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Currency, formatDualCurrencyCompact } from '@/components/roi/currencyUtils';

interface MortgageCoverageCardProps {
  monthlyRent: number;
  monthlyMortgage: number;
  netCashflow: number;
  coveragePercent: number;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

export const MortgageCoverageCard = ({
  monthlyRent,
  monthlyMortgage,
  netCashflow,
  coveragePercent,
  currency,
  rate,
  language,
}: MortgageCoverageCardProps) => {
  const isFullyCovered = coveragePercent >= 100;
  const cappedCoverage = Math.min(coveragePercent, 150); // Cap display at 150%

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
    gap: 'Brecha Mensual',
    profit: 'Ganancia Mensual',
    selfPaying: '✨ Auto-financiada',
    partialCoverage: 'Cobertura Parcial',
    perMonth: '/mes',
  } : {
    title: isFullyCovered ? 'Tenant Pays Your Mortgage!' : 'Mortgage Coverage',
    subtitle: isFullyCovered ? 'Property pays itself + profit' : 'Rent partially covers mortgage',
    monthlyRent: 'Monthly Rent',
    mortgagePayment: 'Mortgage Payment',
    netCashflow: 'Net Cashflow',
    coverage: 'Coverage',
    gap: 'Monthly Gap',
    profit: 'Monthly Profit',
    selfPaying: '✨ Self-Paying',
    partialCoverage: 'Partial Coverage',
    perMonth: '/mo',
  };

  return (
    <Card className="p-4 bg-theme-card border-theme-border">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${isFullyCovered ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
          <Home className={`w-5 h-5 ${isFullyCovered ? 'text-emerald-500' : 'text-amber-500'}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-theme-text">{t.title}</h3>
          <p className="text-xs text-theme-text-muted">{t.subtitle}</p>
        </div>
        <Badge className={`${
          isFullyCovered 
            ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' 
            : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
        }`}>
          {isFullyCovered ? t.selfPaying : t.partialCoverage}
        </Badge>
      </div>

      {/* Rent vs Mortgage Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
          <p className="text-xs text-theme-text-muted mb-1">{t.monthlyRent}</p>
          <p className="text-lg font-semibold text-cyan-500">{formatValue(monthlyRent)}</p>
        </div>
        <div className="p-3 rounded-lg bg-theme-bg/50 border border-theme-border">
          <p className="text-xs text-theme-text-muted mb-1">{t.mortgagePayment}</p>
          <p className="text-lg font-semibold text-theme-text">{formatValue(monthlyMortgage)}</p>
        </div>
      </div>

      {/* Coverage Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-theme-text-muted">{t.coverage}</span>
          <span className={`text-sm font-semibold ${isFullyCovered ? 'text-emerald-500' : 'text-amber-500'}`}>
            {Math.round(coveragePercent)}%
          </span>
        </div>
        <Progress 
          value={cappedCoverage} 
          className={`h-3 ${isFullyCovered ? '[&>div]:bg-emerald-500' : '[&>div]:bg-amber-500'}`}
        />
      </div>

      {/* Net Cashflow */}
      <div className={`p-3 rounded-lg flex items-center justify-between ${
        isFullyCovered 
          ? 'bg-emerald-500/10 border border-emerald-500/30' 
          : 'bg-amber-500/10 border border-amber-500/30'
      }`}>
        <div className="flex items-center gap-2">
          {isFullyCovered ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-500" />
          )}
          <span className="text-sm text-theme-text">
            {isFullyCovered ? t.profit : t.gap}
          </span>
        </div>
        <span className={`text-lg font-bold ${isFullyCovered ? 'text-emerald-500' : 'text-amber-500'}`}>
          {isFullyCovered ? '+' : '-'}{formatValue(Math.abs(netCashflow))}{t.perMonth}
        </span>
      </div>
    </Card>
  );
};
