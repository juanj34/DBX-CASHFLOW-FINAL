import { Home, TrendingUp, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
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
  // New props for principal paydown
  loanAmount: number;
  principalPaidYear10: number;
}

export const MortgageCoverageCard = ({
  monthlyRent,
  monthlyMortgage,
  netCashflow,
  coveragePercent,
  currency,
  rate,
  language,
  loanAmount,
  principalPaidYear10,
}: MortgageCoverageCardProps) => {
  const isFullyCovered = coveragePercent >= 100;
  const cappedCoverage = Math.min(coveragePercent, 150); // Cap display at 150%

  // Calculate yearly values
  const yearlyRent = monthlyRent * 12;
  const yearlyMortgage = monthlyMortgage * 12;
  const yearlyCashflow = netCashflow * 12;

  const formatValue = (value: number): string => {
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  // Principal paydown percentage
  const principalPaydownPercent = loanAmount > 0 
    ? (principalPaidYear10 / loanAmount) * 100 
    : 0;
  const remainingDebt = Math.max(0, loanAmount - principalPaidYear10);

  const t = language === 'es' ? {
    title: isFullyCovered ? '¡El Inquilino Paga Tu Hipoteca!' : 'Cobertura de Hipoteca',
    subtitle: isFullyCovered ? 'La propiedad se paga sola + ganancias' : 'La renta cubre parcialmente la hipoteca',
    monthlyRent: 'Renta Mensual',
    yearlyRent: 'Renta Anual',
    mortgagePayment: 'Pago Hipoteca',
    netCashflow: 'Cashflow Neto',
    coverage: 'Cobertura',
    gap: 'Brecha',
    profit: 'Ganancia',
    selfPaying: '✨ Auto-financiada',
    partialCoverage: 'Cobertura Parcial',
    perMonth: '/mes',
    perYear: '/año',
    hiddenWealth: 'Riqueza Oculta',
    tenantPaysOff: 'Tu inquilino paga',
    ofYourLoan: 'de tu préstamo en 10 años',
    paidOff: 'Pagado',
    remaining: 'Restante',
    principalPaydown: 'Reducción de Principal (10Y)',
  } : {
    title: isFullyCovered ? 'Tenant Pays Your Mortgage!' : 'Mortgage Coverage',
    subtitle: isFullyCovered ? 'Property pays itself + profit' : 'Rent partially covers mortgage',
    monthlyRent: 'Monthly Rent',
    yearlyRent: 'Yearly Rent',
    mortgagePayment: 'Mortgage Payment',
    netCashflow: 'Net Cashflow',
    coverage: 'Coverage',
    gap: 'Gap',
    profit: 'Profit',
    selfPaying: '✨ Self-Paying',
    partialCoverage: 'Partial Coverage',
    perMonth: '/mo',
    perYear: '/yr',
    hiddenWealth: 'Hidden Wealth',
    tenantPaysOff: 'Your tenant pays off',
    ofYourLoan: 'of your loan in 10 years',
    paidOff: 'Paid Off',
    remaining: 'Remaining',
    principalPaydown: 'Principal Paydown (10Y)',
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

      {/* Rent vs Mortgage Breakdown - With Yearly + Monthly */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
          <p className="text-xs text-theme-text-muted mb-1">{t.monthlyRent}</p>
          <p className="text-lg font-semibold text-cyan-500">{formatValue(monthlyRent)}</p>
          <p className="text-xs text-cyan-500/70 mt-0.5">{formatValue(yearlyRent)}{t.perYear}</p>
        </div>
        <div className="p-3 rounded-lg bg-theme-bg/50 border border-theme-border">
          <p className="text-xs text-theme-text-muted mb-1">{t.mortgagePayment}</p>
          <p className="text-lg font-semibold text-theme-text">{formatValue(monthlyMortgage)}</p>
          <p className="text-xs text-theme-text-muted mt-0.5">{formatValue(yearlyMortgage)}{t.perYear}</p>
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

      {/* Net Cashflow - Monthly + Yearly */}
      <div className={`p-3 rounded-lg mb-4 ${
        isFullyCovered 
          ? 'bg-emerald-500/10 border border-emerald-500/30' 
          : 'bg-amber-500/10 border border-amber-500/30'
      }`}>
        <div className="flex items-center justify-between">
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
          <div className="text-right">
            <span className={`text-lg font-bold ${isFullyCovered ? 'text-emerald-500' : 'text-amber-500'}`}>
              {isFullyCovered ? '+' : '-'}{formatValue(Math.abs(netCashflow))}{t.perMonth}
            </span>
            <p className={`text-xs ${isFullyCovered ? 'text-emerald-500/70' : 'text-amber-500/70'}`}>
              {isFullyCovered ? '+' : '-'}{formatValue(Math.abs(yearlyCashflow))}{t.perYear}
            </p>
          </div>
        </div>
      </div>

      {/* Hidden Wealth - Principal Paydown Section */}
      {loanAmount > 0 && principalPaidYear10 > 0 && (
        <div className="border-t border-theme-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-theme-text">{t.hiddenWealth}</span>
          </div>
          
          <p className="text-xs text-theme-text-muted mb-3">
            {t.tenantPaysOff} <span className="text-amber-500 font-semibold">{formatValue(principalPaidYear10)}</span> {t.ofYourLoan}
          </p>
          
          {/* Principal Paydown Progress */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-theme-text-muted">{t.principalPaydown}</span>
              <span className="text-xs font-semibold text-amber-500">
                {principalPaydownPercent.toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={Math.min(principalPaydownPercent, 100)} 
              className="h-2 [&>div]:bg-amber-500"
            />
          </div>
          
          {/* Debt Breakdown */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center justify-between p-2 rounded bg-amber-500/10">
              <span className="text-theme-text-muted">{t.paidOff}</span>
              <span className="text-amber-500 font-semibold">{formatValue(principalPaidYear10)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-theme-bg/50">
              <span className="text-theme-text-muted">{t.remaining}</span>
              <span className="text-theme-text font-semibold">{formatValue(remainingDebt)}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
