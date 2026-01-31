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
  // Property values at Year 10
  offPlanPropertyValue10Y: number;
  secondaryPropertyValue10Y: number;
  // Total Assets at Year 10 (Value + Cumulative Rent - matches table exactly)
  offPlanTotalAssets10Y: number;
  secondaryTotalAssets10Y: number;
  // Year 5 monthly rent for both (meaningful comparison after handover)
  offPlanMonthlyRent5Y: number;
  secondaryMonthlyRent5Y: number;
  // Total rent Secondary earns during construction period
  secondaryRentDuringConstruction: number;
}

export const ComparisonKeyInsights = ({
  metrics,
  rentalMode,
  offPlanLabel,
  currency,
  rate,
  language,
  appreciationDuringConstruction,
  offPlanPropertyValue10Y,
  secondaryPropertyValue10Y,
  offPlanTotalAssets10Y,
  secondaryTotalAssets10Y,
  offPlanMonthlyRent5Y,
  secondaryMonthlyRent5Y,
  secondaryRentDuringConstruction,
}: ComparisonKeyInsightsProps) => {
  // Off-plan multiplier: use total capital at handover (realistic cash deployed)
  const offPlanTotalCapital = metrics.offPlanTotalCapitalAtHandover || metrics.offPlanCapitalDay1;
  const offPlanMultiplier = offPlanTotalCapital > 0
    ? offPlanPropertyValue10Y / offPlanTotalCapital
    : 0;
  
  // Secondary multiplier: use full property commitment (purchase price + closing)
  const secondaryMultiplier = metrics.secondaryCapitalDay1 > 0
    ? secondaryPropertyValue10Y / metrics.secondaryCapitalDay1
    : 0;

  // Total Wealth = Year 10 Total Assets (Property Value + Cumulative Rent)
  // Now passed directly from parent to match table exactly
  const offPlanTotalWealth10 = offPlanTotalAssets10Y;
  const secondaryTotalWealth10 = secondaryTotalAssets10Y;

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
    monthlyRent5Y: 'Renta Mensual (Año 5)',
    monthlyRent5YSubtitle: 'Ingreso a madurez',
    constructionTradeoff: 'Período Construcción',
    constructionTradeoffSubtitle: 'Qué ganas mientras esperas',
    noData: 'N/A',
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
    propertyValue: 'Valor propiedad',
    valueGrowth: '📈 Valor',
    rentEarned: '💰 Renta',
  } : {
    totalWealth: 'Total Wealth',
    totalWealthSubtitle: 'Value + Rent at 10Y',
    moneyMultiplier: 'Value Multiplier',
    moneyMultiplierSubtitle: 'Property Value Growth (10Y)',
    monthlyRent5Y: 'Monthly Rent (Year 5)',
    monthlyRent5YSubtitle: 'Rental at maturity',
    constructionTradeoff: 'Construction Period',
    constructionTradeoffSubtitle: 'What you gain while waiting',
    noData: 'N/A',
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
    propertyValue: 'Property value',
    valueGrowth: '📈 Value',
    rentEarned: '💰 Rent',
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
      winner: offPlanMultiplier > secondaryMultiplier ? 'offplan' : 'secondary',
    },
    {
      key: 'rent5y',
      title: t.monthlyRent5Y,
      subtitle: t.monthlyRent5YSubtitle,
      icon: Coins,
      showComparison: true,
      offPlanValue: formatValue(offPlanMonthlyRent5Y),
      secondaryValue: formatValue(secondaryMonthlyRent5Y),
      winner: offPlanMonthlyRent5Y > secondaryMonthlyRent5Y ? 'offplan' : 'secondary',
    },
    {
      key: 'tradeoff',
      title: t.constructionTradeoff,
      subtitle: t.constructionTradeoffSubtitle,
      icon: Building2,
      showComparison: true,
      offPlanValue: `+${formatValue(appreciationDuringConstruction)}`,
      offPlanSubValue: t.valueGrowth,
      secondaryValue: `+${formatValue(secondaryRentDuringConstruction)}`,
      secondarySubValue: t.rentEarned,
      winner: appreciationDuringConstruction > secondaryRentDuringConstruction ? 'offplan' : 'secondary',
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
              <div className="p-1.5 rounded-lg bg-theme-accent/10">
                <Icon className="w-4 h-4 text-theme-accent" />
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
            {card.showComparison && (
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
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};
