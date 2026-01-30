import { TrendingUp, Wallet, Target, Calendar, Trophy, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Currency, formatDualCurrencyCompact } from '@/components/roi/currencyUtils';
import { ComparisonMetrics } from './types';

interface ComparisonKeyInsightsProps {
  metrics: ComparisonMetrics;
  rentalMode: 'long-term' | 'airbnb';
  offPlanLabel: string;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

export const ComparisonKeyInsights = ({
  metrics,
  rentalMode,
  offPlanLabel,
  currency,
  rate,
  language,
}: ComparisonKeyInsightsProps) => {
  const isAirbnb = rentalMode === 'airbnb';

  const secondaryWealth10 = isAirbnb 
    ? metrics.secondaryWealthYear10ST 
    : metrics.secondaryWealthYear10LT;
  
  const secondaryROE = isAirbnb 
    ? metrics.secondaryROEYear10ST 
    : metrics.secondaryROEYear10LT;
  
  const crossoverYear = isAirbnb 
    ? metrics.crossoverYearST 
    : metrics.crossoverYearLT;

  const capitalWinner = metrics.offPlanCapitalDay1 < metrics.secondaryCapitalDay1 ? 'offplan' : 'secondary';
  const wealthWinner = metrics.offPlanWealthYear10 > secondaryWealth10 ? 'offplan' : 'secondary';
  const roeWinner = metrics.offPlanROEYear10 > secondaryROE ? 'offplan' : 'secondary';

  const formatValue = (value: number): string => {
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  const t = language === 'es' ? {
    initialCapital: 'Capital Inicial',
    initialCapitalTooltip: 'Capital requerido el día 1 (sin hipoteca). Incluye downpayment + costos de entrada.',
    wealthYear10: 'Riqueza Año 10',
    wealthYear10Tooltip: 'Riqueza total acumulada: Valor de propiedad + Rentas acumuladas - Capital invertido.',
    annualizedROE: 'ROE Anualizado',
    annualizedROETooltip: 'Retorno anualizado sobre tu capital durante 10 años. (Ganancia Total / Capital) / 10.',
    crossoverPoint: 'Punto de Cruce',
    crossoverPointTooltip: 'El año cuando off-plan supera a secundaria en riqueza total acumulada.',
    year: 'Año',
    offPlanWins: 'Off-Plan gana',
    secondaryLeads: 'Secundaria lidera',
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
  } : {
    initialCapital: 'Initial Capital',
    initialCapitalTooltip: 'Capital required on day 1 (no mortgage). Includes downpayment + entry costs.',
    wealthYear10: 'Wealth Year 10',
    wealthYear10Tooltip: 'Total accumulated wealth: Property Value + Cumulative Rent - Capital Invested.',
    annualizedROE: 'Annualized ROE',
    annualizedROETooltip: 'Annualized return on your capital over 10 years. (Total Gain / Capital) / 10.',
    crossoverPoint: 'Crossover Point',
    crossoverPointTooltip: 'The year when off-plan surpasses secondary in total accumulated wealth.',
    year: 'Year',
    offPlanWins: 'Off-Plan wins',
    secondaryLeads: 'Secondary leads',
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
  };

  const insights = [
    {
      title: t.initialCapital,
      tooltip: t.initialCapitalTooltip,
      icon: Wallet,
      offPlanValue: formatValue(metrics.offPlanCapitalDay1),
      secondaryValue: formatValue(metrics.secondaryCapitalDay1),
      winner: capitalWinner,
      lowerIsBetter: true,
    },
    {
      title: t.wealthYear10,
      tooltip: t.wealthYear10Tooltip,
      icon: TrendingUp,
      offPlanValue: formatValue(metrics.offPlanWealthYear10),
      secondaryValue: formatValue(secondaryWealth10),
      winner: wealthWinner,
      lowerIsBetter: false,
    },
    {
      title: t.annualizedROE,
      tooltip: t.annualizedROETooltip,
      icon: Target,
      offPlanValue: `${metrics.offPlanROEYear10.toFixed(1)}%`,
      secondaryValue: `${secondaryROE.toFixed(1)}%`,
      winner: roeWinner,
      lowerIsBetter: false,
    },
    {
      title: t.crossoverPoint,
      tooltip: t.crossoverPointTooltip,
      icon: Calendar,
      offPlanValue: crossoverYear ? `${t.year} ${crossoverYear}` : 'N/A',
      secondaryValue: crossoverYear ? t.offPlanWins : t.secondaryLeads,
      winner: crossoverYear ? 'offplan' : 'secondary',
      lowerIsBetter: true,
      isCrossover: true,
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          const isOffPlanWinner = insight.winner === 'offplan';
          
          return (
            <Card
              key={idx}
              className="p-4 bg-theme-card border-theme-border relative overflow-hidden"
            >
              {/* Winner ribbon */}
              {!insight.isCrossover && (
                <div className={`absolute top-0 right-0 px-2 py-0.5 text-[10px] font-medium rounded-bl-lg ${
                  isOffPlanWinner 
                    ? 'bg-emerald-500/20 text-emerald-500' 
                    : 'bg-cyan-500/20 text-cyan-500'
                }`}>
                  <Trophy className="w-3 h-3 inline mr-1" />
                  {isOffPlanWinner ? 'Off-Plan' : 'Secundaria'}
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-theme-accent/10">
                  <Icon className="w-4 h-4 text-theme-accent" />
                </div>
                <span className="text-sm font-medium text-theme-text">{insight.title}</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-theme-text-muted" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px]">
                    <p className="text-xs">{insight.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Values */}
              {insight.isCrossover ? (
                <div className="space-y-1">
                  <p className={`text-lg font-bold ${
                    crossoverYear ? 'text-emerald-500' : 'text-cyan-500'
                  }`}>
                    {insight.offPlanValue}
                  </p>
                  <p className="text-xs text-theme-text-muted">{insight.secondaryValue}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-[10px] ${
                      isOffPlanWinner ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : ''
                    }`}>
                      Off-Plan
                    </Badge>
                    <span className={`text-sm font-semibold ${
                      isOffPlanWinner ? 'text-emerald-500' : 'text-theme-text'
                    }`}>
                      {insight.offPlanValue}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-[10px] ${
                      !isOffPlanWinner ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30' : ''
                    }`}>
                      Secundaria
                    </Badge>
                    <span className={`text-sm font-semibold ${
                      !isOffPlanWinner ? 'text-cyan-500' : 'text-theme-text'
                    }`}>
                      {insight.secondaryValue}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
