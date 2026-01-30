import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Clock, Home, Building2, Percent, BarChart3 } from 'lucide-react';
import { formatCurrency, Currency } from '../currencyUtils';
import { ComparisonMetrics } from './types';
import { cn } from '@/lib/utils';

interface ComparisonSummaryCardsProps {
  metrics: ComparisonMetrics;
  currency?: Currency;
  rate?: number;
  showAirbnb?: boolean;
}

interface SummaryCardProps {
  title: string;
  icon: React.ReactNode;
  offPlanValue: string;
  secondaryValue: string;
  offPlanLabel?: string;
  secondaryLabel?: string;
  winner: 'off-plan' | 'secondary' | 'tie';
  insight: string;
  className?: string;
}

const SummaryCard = ({
  title,
  icon,
  offPlanValue,
  secondaryValue,
  offPlanLabel = 'Off-Plan',
  secondaryLabel = 'Secundaria',
  winner,
  insight,
  className,
}: SummaryCardProps) => {
  return (
    <Card className={cn("bg-theme-card border-theme-border overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-theme-accent/10 text-theme-accent">
            {icon}
          </div>
          <span className="text-sm font-medium text-theme-text">{title}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          {/* Off-Plan */}
          <div className={cn(
            "p-3 rounded-lg border-2 transition-all",
            winner === 'off-plan' 
              ? "border-emerald-500 bg-emerald-500/5" 
              : "border-theme-border bg-theme-bg/50"
          )}>
            <p className="text-xs text-theme-text-muted mb-1">{offPlanLabel}</p>
            <p className={cn(
              "text-lg font-bold",
              winner === 'off-plan' ? "text-emerald-500" : "text-theme-text"
            )}>
              {offPlanValue}
            </p>
          </div>
          
          {/* Secondary */}
          <div className={cn(
            "p-3 rounded-lg border-2 transition-all",
            winner === 'secondary' 
              ? "border-cyan-500 bg-cyan-500/5" 
              : "border-theme-border bg-theme-bg/50"
          )}>
            <p className="text-xs text-theme-text-muted mb-1">{secondaryLabel}</p>
            <p className={cn(
              "text-lg font-bold",
              winner === 'secondary' ? "text-cyan-500" : "text-theme-text"
            )}>
              {secondaryValue}
            </p>
          </div>
        </div>
        
        {/* Winner Badge & Insight */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              winner === 'off-plan' && "border-emerald-500 text-emerald-500 bg-emerald-500/10",
              winner === 'secondary' && "border-cyan-500 text-cyan-500 bg-cyan-500/10",
              winner === 'tie' && "border-theme-border text-theme-text-muted"
            )}
          >
            {winner === 'off-plan' && '🏆 Off-Plan Gana'}
            {winner === 'secondary' && '🏆 Secundaria Gana'}
            {winner === 'tie' && '≈ Empate'}
          </Badge>
          <p className="text-xs text-theme-text-muted flex-1 truncate">{insight}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const ComparisonSummaryCards = ({ 
  metrics, 
  currency = 'AED', 
  rate = 1,
  showAirbnb = true,
}: ComparisonSummaryCardsProps) => {
  const format = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return `${(value / 1000).toFixed(0)}K`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // Determine winners
  const capitalWinner = metrics.offPlanCapitalDay1 < metrics.secondaryCapitalDay1 ? 'off-plan' : 'secondary';
  const wealthWinner = metrics.offPlanWealthYear10 > metrics.secondaryWealthYear10LT ? 'off-plan' : 'secondary';
  const cashflowWinner = metrics.offPlanCashflowYear1 > metrics.secondaryCashflowYear1LT ? 'off-plan' : 'secondary';
  const dscrWinner = metrics.offPlanDSCRLT > metrics.secondaryDSCRLT ? 'off-plan' : 
                     metrics.offPlanDSCRLT < metrics.secondaryDSCRLT ? 'secondary' : 'tie';

  // Calculate capital advantage
  const capitalAdvantage = ((metrics.secondaryCapitalDay1 - metrics.offPlanCapitalDay1) / metrics.secondaryCapitalDay1 * 100).toFixed(0);
  
  // Calculate wealth advantage
  const wealthAdvantage = ((metrics.offPlanWealthYear10 - metrics.secondaryWealthYear10LT) / metrics.secondaryWealthYear10LT * 100).toFixed(0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Capital Inicial */}
      <SummaryCard
        title="💰 Capital Inicial"
        icon={<DollarSign className="w-4 h-4" />}
        offPlanValue={`AED ${format(metrics.offPlanCapitalDay1)}`}
        secondaryValue={`AED ${format(metrics.secondaryCapitalDay1)}`}
        winner={capitalWinner}
        insight={capitalWinner === 'off-plan' ? `${capitalAdvantage}% menos capital` : 'Mayor desembolso inicial'}
      />

      {/* Riqueza Año 10 */}
      <SummaryCard
        title="📈 Riqueza Año 10"
        icon={<TrendingUp className="w-4 h-4" />}
        offPlanValue={`AED ${format(metrics.offPlanWealthYear10)}`}
        secondaryValue={`AED ${format(metrics.secondaryWealthYear10LT)}`}
        winner={wealthWinner}
        insight={wealthWinner === 'off-plan' ? `${wealthAdvantage}% más riqueza` : 'Mejor por cashflow acumulado'}
      />

      {/* Cashflow Año 1 */}
      <SummaryCard
        title="💸 Cashflow Año 1"
        icon={<BarChart3 className="w-4 h-4" />}
        offPlanValue={metrics.offPlanCashflowYear1 === 0 ? 'En construcción' : `AED ${format(metrics.offPlanCashflowYear1)}`}
        secondaryValue={`AED ${format(metrics.secondaryCashflowYear1LT)}/año`}
        winner={cashflowWinner}
        insight={cashflowWinner === 'secondary' ? 'Ingresos desde día 1' : 'Sin ingresos durante construcción'}
      />

      {/* Out of Pocket (Off-Plan) */}
      <SummaryCard
        title="⚠️ Capital Sin Retorno"
        icon={<Clock className="w-4 h-4" />}
        offPlanValue={`AED ${format(metrics.offPlanOutOfPocket)}`}
        secondaryValue="N/A"
        offPlanLabel={`${metrics.offPlanMonthsNoIncome} meses sin ingreso`}
        secondaryLabel="Ingresos inmediatos"
        winner="secondary"
        insight="Off-plan: capital 'muerto' durante construcción"
      />

      {/* DSCR (Cobertura Hipoteca) */}
      <SummaryCard
        title="🏦 Cobertura Hipoteca (LT)"
        icon={<Percent className="w-4 h-4" />}
        offPlanValue={metrics.offPlanDSCRLT === Infinity ? '∞' : `${(metrics.offPlanDSCRLT * 100).toFixed(0)}%`}
        secondaryValue={metrics.secondaryDSCRLT === Infinity ? '∞' : `${(metrics.secondaryDSCRLT * 100).toFixed(0)}%`}
        offPlanLabel="Post-Handover"
        secondaryLabel="Desde Día 1"
        winner={dscrWinner}
        insight={metrics.secondaryDSCRLT >= 1 ? 'Renta cubre hipoteca' : 'Renta no cubre hipoteca'}
      />

      {/* ROE Anualizado */}
      <SummaryCard
        title="📊 ROE Anualizado"
        icon={<TrendingUp className="w-4 h-4" />}
        offPlanValue={formatPercent(metrics.offPlanROEYear10)}
        secondaryValue={formatPercent(metrics.secondaryROEYear10LT)}
        winner={metrics.offPlanROEYear10 > metrics.secondaryROEYear10LT ? 'off-plan' : 'secondary'}
        insight={metrics.offPlanROEYear10 > metrics.secondaryROEYear10LT ? 'Mayor retorno sobre equity' : 'Retornos moderados'}
      />

      {/* Airbnb Cards (if enabled) */}
      {showAirbnb && (
        <>
          <SummaryCard
            title="🏠 DSCR Airbnb"
            icon={<Home className="w-4 h-4" />}
            offPlanValue={metrics.offPlanDSCRST === Infinity ? '∞' : `${(metrics.offPlanDSCRST * 100).toFixed(0)}%`}
            secondaryValue={metrics.secondaryDSCRST === Infinity ? '∞' : `${(metrics.secondaryDSCRST * 100).toFixed(0)}%`}
            offPlanLabel="Post-Handover"
            secondaryLabel="Desde Día 1"
            winner={metrics.offPlanDSCRST > metrics.secondaryDSCRST ? 'off-plan' : 'secondary'}
            insight="Con estrategia de corto plazo"
          />
          
          <SummaryCard
            title="📈 Riqueza Año 10 (Airbnb)"
            icon={<TrendingUp className="w-4 h-4" />}
            offPlanValue={`AED ${format(metrics.offPlanWealthYear10)}`}
            secondaryValue={`AED ${format(metrics.secondaryWealthYear10ST)}`}
            winner={metrics.offPlanWealthYear10 > metrics.secondaryWealthYear10ST ? 'off-plan' : 'secondary'}
            insight="Comparación con ingresos Airbnb"
          />
        </>
      )}

      {/* Crossover Point */}
      {metrics.crossoverYearLT && (
        <SummaryCard
          title="🔄 Punto de Cruce"
          icon={<TrendingUp className="w-4 h-4" />}
          offPlanValue={`Año ${metrics.crossoverYearLT}`}
          secondaryValue="—"
          winner="off-plan"
          insight="Cuando off-plan supera a secundaria"
          className="md:col-span-2 lg:col-span-1"
        />
      )}
    </div>
  );
};
