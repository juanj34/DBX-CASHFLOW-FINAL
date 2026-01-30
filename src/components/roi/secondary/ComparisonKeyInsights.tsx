import { TrendingUp, Wallet, Target, Calendar, Trophy, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency } from '@/components/roi/currencyUtils';
import { ComparisonMetrics } from './types';

interface ComparisonKeyInsightsProps {
  metrics: ComparisonMetrics;
  rentalMode: 'long-term' | 'airbnb';
  offPlanLabel: string;
}

export const ComparisonKeyInsights = ({
  metrics,
  rentalMode,
  offPlanLabel,
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

  // Determine winners
  const capitalWinner = metrics.offPlanCapitalDay1 < metrics.secondaryCapitalDay1 ? 'offplan' : 'secondary';
  const wealthWinner = metrics.offPlanWealthYear10 > secondaryWealth10 ? 'offplan' : 'secondary';
  const roeWinner = metrics.offPlanROEYear10 > secondaryROE ? 'offplan' : 'secondary';

  const insights = [
    {
      title: 'Capital Inicial',
      tooltip: 'Capital requerido el día 1 (sin hipoteca). Incluye downpayment + costos de entrada.',
      icon: Wallet,
      offPlanValue: formatCurrency(metrics.offPlanCapitalDay1, 'AED', 0),
      secondaryValue: formatCurrency(metrics.secondaryCapitalDay1, 'AED', 0),
      winner: capitalWinner,
      lowerIsBetter: true,
    },
    {
      title: 'Riqueza Año 10',
      tooltip: 'Riqueza total acumulada: Valor de propiedad + Rentas acumuladas - Capital invertido.',
      icon: TrendingUp,
      offPlanValue: formatCurrency(metrics.offPlanWealthYear10, 'AED', 0),
      secondaryValue: formatCurrency(secondaryWealth10, 'AED', 0),
      winner: wealthWinner,
      lowerIsBetter: false,
    },
    {
      title: 'ROE Anualizado',
      tooltip: 'Retorno anualizado sobre tu capital durante 10 años. (Ganancia Total / Capital) / 10.',
      icon: Target,
      offPlanValue: `${metrics.offPlanROEYear10.toFixed(1)}%`,
      secondaryValue: `${secondaryROE.toFixed(1)}%`,
      winner: roeWinner,
      lowerIsBetter: false,
    },
    {
      title: 'Punto de Cruce',
      tooltip: 'El año cuando off-plan supera a secundaria en riqueza total acumulada.',
      icon: Calendar,
      offPlanValue: crossoverYear ? `Año ${crossoverYear}` : 'N/A',
      secondaryValue: crossoverYear ? `Off-Plan gana` : 'Secundaria lidera',
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
