import { Home, TrendingUp, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Currency, formatDualCurrencyCompact } from '@/components/roi/currencyUtils';

interface RentalComparisonAtHandoverProps {
  offPlanMonthlyRent: number;
  secondaryMonthlyRent: number;
  handoverYear: number;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

export const RentalComparisonAtHandover = ({
  offPlanMonthlyRent,
  secondaryMonthlyRent,
  handoverYear,
  currency,
  rate,
  language,
}: RentalComparisonAtHandoverProps) => {
  const formatValue = (value: number): string => {
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  // Calculate yearly rents
  const offPlanYearlyRent = offPlanMonthlyRent * 12;
  const secondaryYearlyRent = secondaryMonthlyRent * 12;

  // Calculate who has higher rent and by how much
  const offPlanIsHigher = offPlanMonthlyRent > secondaryMonthlyRent;
  const percentDiff = secondaryMonthlyRent > 0
    ? ((offPlanMonthlyRent - secondaryMonthlyRent) / secondaryMonthlyRent) * 100
    : 0;

  const winner = offPlanIsHigher ? 'offplan' : 'secondary';

  const t = language === 'es' ? {
    title: 'Renta al Handover',
    subtitle: `Año ${handoverYear}`,
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
    perMonth: '/mes',
    perYear: '/año',
    offPlanNote: 'Inicio de renta',
    secondaryNote: `Con ${handoverYear} años de crecimiento`,
    offPlanHigher: `Off-Plan: ${Math.abs(percentDiff).toFixed(0)}% más alta`,
    secondaryHigher: `Secundaria: ${Math.abs(percentDiff).toFixed(0)}% más alta`,
  } : {
    title: 'Rent at Handover',
    subtitle: `Year ${handoverYear}`,
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
    perMonth: '/mo',
    perYear: '/yr',
    offPlanNote: 'Rental starts',
    secondaryNote: `After ${handoverYear}yr rent growth`,
    offPlanHigher: `Off-Plan: ${Math.abs(percentDiff).toFixed(0)}% higher`,
    secondaryHigher: `Secondary: ${Math.abs(percentDiff).toFixed(0)}% higher`,
  };

  return (
    <Card className="p-4 bg-theme-card border-theme-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-theme-accent/10">
          <Home className="w-5 h-5 text-theme-accent" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-theme-text">{t.title}</h3>
          <div className="flex items-center gap-2 text-xs text-theme-text-muted">
            <Calendar className="w-3 h-3" />
            {t.subtitle}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Off-Plan */}
        <div className={`p-3 rounded-lg border ${
          winner === 'offplan' 
            ? 'bg-emerald-500/5 border-emerald-500/30' 
            : 'bg-theme-bg/50 border-theme-border'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="outline" 
              className={`text-[10px] ${
                winner === 'offplan'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                  : 'border-theme-border text-theme-text-muted'
              }`}
            >
              {winner === 'offplan' && '🏆 '}{t.offPlan}
            </Badge>
          </div>
          {/* Monthly */}
          <p className={`text-lg font-semibold ${
            winner === 'offplan' ? 'text-emerald-500' : 'text-theme-text'
          }`}>
            {formatValue(offPlanMonthlyRent)}{t.perMonth}
          </p>
          {/* Yearly */}
          <p className={`text-sm ${
            winner === 'offplan' ? 'text-emerald-500/80' : 'text-theme-text-muted'
          }`}>
            {formatValue(offPlanYearlyRent)}{t.perYear}
          </p>
          <p className="text-[10px] text-theme-text-muted mt-1">
            {t.offPlanNote}
          </p>
        </div>

        {/* Secondary */}
        <div className={`p-3 rounded-lg border ${
          winner === 'secondary' 
            ? 'bg-cyan-500/5 border-cyan-500/30' 
            : 'bg-theme-bg/50 border-theme-border'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="outline" 
              className={`text-[10px] ${
                winner === 'secondary'
                  ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
                  : 'border-theme-border text-theme-text-muted'
              }`}
            >
              {winner === 'secondary' && '🏆 '}{t.secondary}
            </Badge>
          </div>
          {/* Monthly */}
          <p className={`text-lg font-semibold ${
            winner === 'secondary' ? 'text-cyan-500' : 'text-theme-text'
          }`}>
            {formatValue(secondaryMonthlyRent)}{t.perMonth}
          </p>
          {/* Yearly */}
          <p className={`text-sm ${
            winner === 'secondary' ? 'text-cyan-500/80' : 'text-theme-text-muted'
          }`}>
            {formatValue(secondaryYearlyRent)}{t.perYear}
          </p>
          <p className="text-[10px] text-theme-text-muted mt-1">
            {t.secondaryNote}
          </p>
        </div>
      </div>

      {/* Winner Badge - Fixed logic */}
      {percentDiff !== 0 && (
        <div className={`p-2 rounded-lg flex items-center justify-center gap-2 ${
          winner === 'offplan' 
            ? 'bg-emerald-500/10 border border-emerald-500/30' 
            : 'bg-cyan-500/10 border border-cyan-500/30'
        }`}>
          <TrendingUp className={`w-4 h-4 ${
            winner === 'offplan' ? 'text-emerald-500' : 'text-cyan-500'
          }`} />
          <span className={`text-sm font-medium ${
            winner === 'offplan' ? 'text-emerald-500' : 'text-cyan-500'
          }`}>
            {winner === 'offplan' ? t.offPlanHigher : t.secondaryHigher}
          </span>
        </div>
      )}
    </Card>
  );
};
