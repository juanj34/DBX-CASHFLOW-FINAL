import { Wallet, Clock, TrendingUp, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Currency, formatDualCurrencyCompact } from '@/components/roi/currencyUtils';

interface OutOfPocketCardProps {
  offPlanCapitalDuringConstruction: number;
  monthsWithoutIncome: number;
  appreciationDuringConstruction: number;
  secondaryCapitalDay1: number;
  secondaryIncomeMonths: number;
  secondaryPurchasePrice: number; // NEW: Full property price for accurate rent calculation
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

export const OutOfPocketCard = ({
  offPlanCapitalDuringConstruction,
  monthsWithoutIncome,
  appreciationDuringConstruction,
  secondaryCapitalDay1,
  secondaryIncomeMonths,
  secondaryPurchasePrice,
  currency,
  rate,
  language,
}: OutOfPocketCardProps) => {
  // Calculate opportunity cost using PROPERTY PRICE (not cash equity) for accurate yield
  const avgMonthlyRent = secondaryPurchasePrice * 0.07 / 12; // 7% yield on property value
  const opportunityCost = avgMonthlyRent * monthsWithoutIncome;

  const formatValue = (value: number): string => {
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  const t = language === 'es' ? {
    title: 'Fase de Construcción',
    subtitle: 'Capital sin retorno inmediato',
    tooltip: 'Durante la construcción, off-plan no genera renta pero sí apreciación. Secundaria genera cashflow desde el día 1.',
    totalCapital: 'Capital Total',
    noIncome: 'Sin Ingresos',
    withIncome: 'Con Ingresos',
    appreciation: 'Apreciación',
    estimatedRent: 'Renta Estimada',
    months: 'meses',
    fromDay1: 'Desde día 1',
    tradeoff: 'Trade-off',
    tradeoffText: (m: number, app: string) => `Off-Plan requiere ${m} meses sin cashflow, pero la apreciación durante construcción (${app}) compensa el costo de oportunidad.`,
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
  } : {
    title: 'Construction Phase',
    subtitle: 'Capital without immediate return',
    tooltip: 'During construction, off-plan generates no rent but appreciates. Secondary generates cashflow from day 1.',
    totalCapital: 'Total Capital',
    noIncome: 'No Income',
    withIncome: 'With Income',
    appreciation: 'Appreciation',
    estimatedRent: 'Estimated Rent',
    months: 'months',
    fromDay1: 'From day 1',
    tradeoff: 'Trade-off',
    tradeoffText: (m: number, app: string) => `Off-Plan requires ${m} months without cashflow, but appreciation during construction (${app}) offsets the opportunity cost.`,
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
  };

  return (
    <TooltipProvider>
      <Card className="p-4 bg-theme-card border-theme-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Wallet className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-theme-text">{t.title}</h3>
            <p className="text-xs text-theme-text-muted">{t.subtitle}</p>
          </div>
          <Tooltip>
            <TooltipTrigger className="ml-auto">
              <Info className="w-4 h-4 text-theme-text-muted" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px]">
              <p className="text-xs">{t.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Off-Plan Side */}
          <div className="space-y-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs">
              {t.offPlan}
            </Badge>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  {t.totalCapital}
                </span>
                <span className="text-sm font-medium text-theme-text">
                  {formatValue(offPlanCapitalDuringConstruction)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t.noIncome}
                </span>
                <span className="text-sm font-medium text-amber-500">
                  {monthsWithoutIncome} {t.months}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {t.appreciation}
                </span>
                <span className="text-sm font-medium text-emerald-500">
                  +{formatValue(appreciationDuringConstruction)}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Side */}
          <div className="space-y-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/30 text-xs">
              {t.secondary}
            </Badge>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  {t.totalCapital}
                </span>
                <span className="text-sm font-medium text-theme-text">
                  {formatValue(secondaryCapitalDay1)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t.withIncome}
                </span>
                <span className="text-sm font-medium text-cyan-500">
                  {t.fromDay1}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {t.estimatedRent}
                </span>
                <span className="text-sm font-medium text-cyan-500">
                  +{formatValue(opportunityCost)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 rounded-lg bg-theme-bg/50 text-xs text-theme-text-muted">
          <p>
            <strong className="text-theme-text">{t.tradeoff}:</strong> {t.tradeoffText(monthsWithoutIncome, formatValue(appreciationDuringConstruction))}
          </p>
        </div>
      </Card>
    </TooltipProvider>
  );
};
