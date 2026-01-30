import { TrendingUp, Wallet, Target, Building2 } from 'lucide-react';
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
}

export const ComparisonKeyInsights = ({
  metrics,
  rentalMode,
  offPlanLabel,
  currency,
  rate,
  language,
  appreciationDuringConstruction,
}: ComparisonKeyInsightsProps) => {
  const isAirbnb = rentalMode === 'airbnb';

  const secondaryWealth10 = isAirbnb 
    ? metrics.secondaryWealthYear10ST 
    : metrics.secondaryWealthYear10LT;

  // Computed persuasive metrics
  const entrySavings = metrics.secondaryCapitalDay1 > 0
    ? ((metrics.secondaryCapitalDay1 - metrics.offPlanCapitalDay1) / metrics.secondaryCapitalDay1) * 100
    : 0;
  
  const offPlanMultiplier = metrics.offPlanCapitalDay1 > 0
    ? metrics.offPlanWealthYear10 / metrics.offPlanCapitalDay1
    : 0;
  
  // For secondary multiplier: use gross wealth (add back the cash capital that was subtracted)
  // This shows the true "your X became Y" multiplier
  const secondaryGrossWealth = secondaryWealth10 + metrics.secondaryCashCapital;
  const secondaryMultiplier = metrics.secondaryCashCapital > 0
    ? secondaryGrossWealth / metrics.secondaryCashCapital
    : 0;
  
  const crossoverYear = isAirbnb ? metrics.crossoverYearST : metrics.crossoverYearLT;

  const formatValue = (value: number): string => {
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  const t = language === 'es' ? {
    entryTicket: 'Capital Inicial',
    entryTicketTooltip: 'Compromiso total requerido. Off-plan = precio + fees. Secundaria = precio + costos de cierre.',
    moneyMultiplier: 'Multiplicador',
    moneyMultiplierSubtitle: 'Crecimiento 10 años',
    crossoverPoint: 'Punto de Cruce',
    crossoverDescription: 'Año en que Off-Plan supera a Secundaria',
    constructionBonus: 'Bonus Construcción',
    constructionDescription: 'Apreciación "gratis" durante obra',
    save: 'Ahorro',
    growth: 'crecimiento',
    year: 'Año',
    noData: 'N/A',
    freeEquity: '¡Equity gratis!',
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
  } : {
    entryTicket: 'Entry Ticket',
    entryTicketTooltip: 'Total commitment required. Off-plan = price + fees. Secondary = price + closing costs.',
    moneyMultiplier: 'Multiplier',
    moneyMultiplierSubtitle: '10-Year Growth',
    crossoverPoint: 'Crossover Point',
    crossoverDescription: 'Year when Off-Plan beats Secondary',
    constructionBonus: 'Construction Bonus',
    constructionDescription: '"Free" appreciation during build',
    save: 'Save',
    growth: 'growth',
    year: 'Year',
    noData: 'N/A',
    freeEquity: 'Free equity!',
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
  };

  const cards = [
    {
      key: 'entry',
      title: t.entryTicket,
      icon: Wallet,
      showComparison: true,
      offPlanValue: formatValue(metrics.offPlanCapitalDay1),
      secondaryValue: formatValue(metrics.secondaryCapitalDay1),
      badge: entrySavings > 0 ? `${t.save} ${Math.round(entrySavings)}%` : null,
      badgeColor: entrySavings > 0 ? 'emerald' : 'cyan',
      winner: metrics.offPlanCapitalDay1 < metrics.secondaryCapitalDay1 ? 'offplan' : 'secondary',
    },
    {
      key: 'multiplier',
      title: t.moneyMultiplier,
      subtitle: t.moneyMultiplierSubtitle,
      icon: TrendingUp,
      showComparison: true,
      offPlanValue: `${offPlanMultiplier.toFixed(1)}x`,
      secondaryValue: `${secondaryMultiplier.toFixed(1)}x`,
      badge: null,
      badgeColor: null,
      winner: offPlanMultiplier > secondaryMultiplier ? 'offplan' : 'secondary',
    },
    {
      key: 'crossover',
      title: t.crossoverPoint,
      icon: Target,
      showComparison: false,
      singleValue: crossoverYear ? `${t.year} ${crossoverYear}` : t.noData,
      description: t.crossoverDescription,
      isPositive: crossoverYear !== null && crossoverYear <= 5,
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
                  <span className={`text-sm font-semibold ${
                    isOffPlanWinner ? 'text-emerald-500' : 'text-theme-text'
                  }`}>
                    {card.offPlanValue}
                  </span>
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
                  <span className={`text-sm font-semibold ${
                    !isOffPlanWinner ? 'text-cyan-500' : 'text-theme-text'
                  }`}>
                    {card.secondaryValue}
                  </span>
                </div>
                
                {/* Savings Badge */}
                {card.badge && (
                  <div className="pt-1">
                    <Badge className={`text-[10px] w-full justify-center ${
                      card.badgeColor === 'emerald'
                        ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30'
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
