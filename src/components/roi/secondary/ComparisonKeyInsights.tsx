import { TrendingUp, Coins, Building2, Gem } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Currency, formatDualCurrencyCompact } from '@/components/roi/currencyUtils';
import { ComparisonMetrics } from './types';

interface ComparisonKeyInsightsProps {
  metrics: ComparisonMetrics;
  rentalMode: 'long-term' | 'airbnb';
  offPlanLabel: string;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
  appreciationDuringConstruction: number;
  // Props for Monthly Cashflow card
  secondaryMonthlyCashflow: number;
  // NEW: Property values at Year 10
  offPlanPropertyValue10Y: number;
  secondaryPropertyValue10Y: number;
}

export const ComparisonKeyInsights = ({
  metrics,
  rentalMode,
  offPlanLabel,
  currency,
  rate,
  language,
  appreciationDuringConstruction,
  secondaryMonthlyCashflow,
  offPlanPropertyValue10Y,
  secondaryPropertyValue10Y,
}: ComparisonKeyInsightsProps) => {
  const isAirbnb = rentalMode === 'airbnb';

  const secondaryWealth10 = isAirbnb 
    ? metrics.secondaryWealthYear10ST 
    : metrics.secondaryWealthYear10LT;

  // Off-plan multiplier: use total capital at handover (realistic cash deployed)
  const offPlanTotalCapital = metrics.offPlanTotalCapitalAtHandover || metrics.offPlanCapitalDay1;
  const offPlanMultiplier = offPlanTotalCapital > 0
    ? (metrics.offPlanWealthYear10 + offPlanTotalCapital) / offPlanTotalCapital
    : 0;
  
  // Secondary multiplier: use full property commitment (purchase price + closing)
  const secondaryMultiplier = metrics.secondaryCapitalDay1 > 0
    ? (secondaryWealth10 + metrics.secondaryCapitalDay1) / metrics.secondaryCapitalDay1
    : 0;

  // Total Wealth (Gross/Total Assets) = Property Value at Year 10 + Cumulative Net Rent
  // The metrics.offPlanWealthYear10 = propertyValue + cumulativeRent - capital
  // To get Gross Wealth, we add capital back: grossWealth = netWealth + capital
  const offPlanTotalWealth10 = metrics.offPlanWealthYear10 + metrics.offPlanCapitalDay1;
  const secondaryTotalWealth10 = secondaryWealth10 + metrics.secondaryCashCapital;

  const formatValue = (value: number): string => {
    // Handle NaN and invalid values
    if (isNaN(value) || !isFinite(value)) {
      return 'N/A';
    }
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  // Format short property value (just primary)
  const formatPropertyValue = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) {
      return 'N/A';
    }
    const dual = formatDualCurrencyCompact(value, currency, rate);
    return dual.primary;
  };

  const t = language === 'es' ? {
    totalWealth: 'Riqueza Total',
    totalWealthSubtitle: 'Valor + Renta 10 años',
    moneyMultiplier: 'Multiplicador de Valor',
    moneyMultiplierSubtitle: 'Crecimiento del Inmueble (10 años)',
    monthlyCashflow: 'Cashflow Mensual',
    monthlyCashflowSubtitle: 'Durante construcción',
    constructionBonus: 'Bonus Construcción',
    constructionDescription: 'Apreciación "gratis" durante obra',
    noData: 'N/A',
    freeEquity: '¡Equity gratis!',
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
    positive: 'Positivo',
    negative: 'Negativo',
    propertyValue: 'Valor propiedad',
  } : {
    totalWealth: 'Total Wealth',
    totalWealthSubtitle: 'Value + Rent at 10Y',
    moneyMultiplier: 'Value Multiplier',
    moneyMultiplierSubtitle: 'Property Value Growth (10Y)',
    monthlyCashflow: 'Monthly Cashflow',
    monthlyCashflowSubtitle: 'During construction',
    constructionBonus: 'Construction Bonus',
    constructionDescription: '"Free" appreciation during build',
    noData: 'N/A',
    freeEquity: 'Free equity!',
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
    positive: 'Positive',
    negative: 'Negative',
    propertyValue: 'Property value',
  };

  const cards = [
    {
      key: 'wealth10',
      title: t.totalWealth,
      subtitle: t.totalWealthSubtitle,
      icon: Gem,
      showComparison: true,
      offPlanValue: formatValue(offPlanTotalWealth10),
      secondaryValue: formatValue(secondaryTotalWealth10),
      badge: null,
      badgeColor: null,
      winner: offPlanTotalWealth10 > secondaryTotalWealth10 ? 'offplan' : 'secondary',
    },
    {
      key: 'multiplier',
      title: t.moneyMultiplier,
      subtitle: t.moneyMultiplierSubtitle,
      icon: TrendingUp,
      showComparison: true,
      offPlanValue: `${offPlanMultiplier.toFixed(1)}x`,
      offPlanSubValue: `→ ${formatPropertyValue(offPlanPropertyValue10Y)}`,
      secondaryValue: `${secondaryMultiplier.toFixed(1)}x`,
      secondarySubValue: `→ ${formatPropertyValue(secondaryPropertyValue10Y)}`,
      badge: null,
      badgeColor: null,
      winner: offPlanMultiplier > secondaryMultiplier ? 'offplan' : 'secondary',
    },
    {
      key: 'cashflow',
      title: t.monthlyCashflow,
      subtitle: t.monthlyCashflowSubtitle,
      icon: Coins,
      showComparison: true,
      offPlanValue: 'AED 0',
      secondaryValue: formatValue(secondaryMonthlyCashflow),
      badge: secondaryMonthlyCashflow > 0 ? t.positive : t.negative,
      badgeColor: secondaryMonthlyCashflow > 0 ? 'emerald' : 'amber',
      winner: 'secondary', // Secondary always wins during construction
    },
    {
      key: 'bonus',
      title: t.constructionBonus,
      icon: Building2,
      showComparison: false,
      singleValue: `+${formatValue(appreciationDuringConstruction)}`,
      description: t.constructionDescription,
      isPositive: appreciationDuringConstruction > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isOffPlanWinner = card.winner === 'offplan';
        
        return (
          <Card
            key={card.key}
            className="p-4 bg-theme-card border-theme-border relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg ${
                card.isPositive !== undefined
                  ? card.isPositive 
                    ? 'bg-emerald-500/10' 
                    : 'bg-theme-border/50'
                  : 'bg-theme-accent/10'
              }`}>
                <Icon className={`w-4 h-4 ${
                  card.isPositive !== undefined
                    ? card.isPositive 
                      ? 'text-emerald-500' 
                      : 'text-theme-text-muted'
                    : 'text-theme-accent'
                }`} />
              </div>
              <div>
                <span className="text-sm font-medium text-theme-text block leading-tight">
                  {card.title}
                </span>
                {card.subtitle && (
                  <span className="text-[10px] text-theme-text-muted">
                    {card.subtitle}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            {card.showComparison ? (
              <div className="space-y-2">
                {/* Off-Plan Row */}
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-1.5 py-0 ${
                      isOffPlanWinner 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                        : 'border-theme-border text-theme-text-muted'
                    }`}
                  >
                    {isOffPlanWinner && '🏆 '}{t.offPlan}
                  </Badge>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${
                      isOffPlanWinner ? 'text-emerald-500' : 'text-theme-text'
                    }`}>
                      {card.offPlanValue}
                    </span>
                    {(card as any).offPlanSubValue && (
                      <span className={`block text-[10px] ${
                        isOffPlanWinner ? 'text-emerald-500/70' : 'text-theme-text-muted'
                      }`}>
                        {(card as any).offPlanSubValue}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Secondary Row */}
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-1.5 py-0 ${
                      !isOffPlanWinner 
                        ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30' 
                        : 'border-theme-border text-theme-text-muted'
                    }`}
                  >
                    {!isOffPlanWinner && '🏆 '}{t.secondary}
                  </Badge>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${
                      !isOffPlanWinner ? 'text-cyan-500' : 'text-theme-text'
                    }`}>
                      {card.secondaryValue}
                    </span>
                    {(card as any).secondarySubValue && (
                      <span className={`block text-[10px] ${
                        !isOffPlanWinner ? 'text-cyan-500/70' : 'text-theme-text-muted'
                      }`}>
                        {(card as any).secondarySubValue}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Badge */}
                {card.badge && (
                  <div className="pt-1">
                    <Badge className={`text-[10px] w-full justify-center ${
                      card.badgeColor === 'emerald'
                        ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                        : card.badgeColor === 'cyan'
                        ? 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30'
                        : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                    }`}>
                      ✨ {card.badge}
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className={`text-2xl font-bold ${
                  card.isPositive ? 'text-emerald-500' : 'text-theme-text'
                }`}>
                  {card.singleValue}
                </p>
                <p className="text-[10px] text-theme-text-muted mt-1">
                  {card.description}
                </p>
                {card.isPositive && card.key === 'bonus' && (
                  <Badge className="mt-2 bg-emerald-500/20 text-emerald-500 text-[10px]">
                    {t.freeEquity}
                  </Badge>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};
