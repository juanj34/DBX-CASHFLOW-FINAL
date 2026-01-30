import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, Clock, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComparisonMetrics } from './types';

interface ComparisonVerdictProps {
  metrics: ComparisonMetrics;
  offPlanProjectName?: string;
}

export const ComparisonVerdict = ({ metrics, offPlanProjectName }: ComparisonVerdictProps) => {
  // Calculate key advantages
  const capitalAdvantage = ((metrics.secondaryCapitalDay1 - metrics.offPlanCapitalDay1) / metrics.secondaryCapitalDay1 * 100);
  const wealthAdvantage = ((metrics.offPlanWealthYear10 - metrics.secondaryWealthYear10LT) / metrics.secondaryWealthYear10LT * 100);
  const roeAdvantage = metrics.offPlanROEYear10 - metrics.secondaryROEYear10LT;
  
  // Determine overall winner
  const offPlanAdvantages = [
    capitalAdvantage > 20, // Significantly less capital
    wealthAdvantage > 30, // Much more wealth
    roeAdvantage > 10, // Much better ROE
  ].filter(Boolean).length;
  
  const isOffPlanWinner = offPlanAdvantages >= 2;
  
  // Key points for each scenario
  const offPlanPros = [
    { icon: DollarSign, text: `${capitalAdvantage.toFixed(0)}% menos capital inicial`, highlight: capitalAdvantage > 30 },
    { icon: TrendingUp, text: `${wealthAdvantage.toFixed(0)}% más riqueza en 10 años`, highlight: wealthAdvantage > 50 },
    { icon: Award, text: `${roeAdvantage.toFixed(1)}% más ROE anualizado`, highlight: roeAdvantage > 15 },
    metrics.crossoverYearLT && { icon: CheckCircle, text: `Supera secundaria en Año ${metrics.crossoverYearLT}`, highlight: true },
  ].filter(Boolean) as { icon: any; text: string; highlight: boolean }[];
  
  const offPlanCons = [
    { icon: Clock, text: `${metrics.offPlanMonthsNoIncome} meses sin ingresos` },
    { icon: AlertTriangle, text: 'Riesgo de construcción' },
  ];
  
  const secondaryPros = [
    { icon: DollarSign, text: 'Ingresos desde día 1' },
    { icon: CheckCircle, text: `DSCR ${(metrics.secondaryDSCRLT * 100).toFixed(0)}% (cubre hipoteca)` },
    { icon: TrendingUp, text: 'Propiedad lista, sin espera' },
  ];
  
  const secondaryCons = [
    { icon: DollarSign, text: `AED ${(metrics.secondaryCapitalDay1 / 1000).toFixed(0)}K capital requerido` },
    { icon: TrendingUp, text: 'Solo 3% apreciación anual' },
    { icon: Award, text: `ROE ${metrics.secondaryROEYear10LT.toFixed(1)}% (bajo)` },
  ];

  return (
    <Card className="bg-theme-card border-theme-border overflow-hidden">
      {/* Winner Banner */}
      <div className={cn(
        "px-6 py-4",
        isOffPlanWinner 
          ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5" 
          : "bg-gradient-to-r from-cyan-500/20 to-cyan-500/5"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl",
            isOffPlanWinner ? "bg-emerald-500/20" : "bg-cyan-500/20"
          )}>
            <Award className={cn(
              "w-8 h-8",
              isOffPlanWinner ? "text-emerald-500" : "text-cyan-500"
            )} />
          </div>
          <div>
            <Badge className={cn(
              "mb-1 text-xs",
              isOffPlanWinner 
                ? "bg-emerald-500 text-white" 
                : "bg-cyan-500 text-white"
            )}>
              🏆 RECOMENDACIÓN
            </Badge>
            <h3 className="text-xl font-bold text-theme-text">
              {isOffPlanWinner 
                ? `${offPlanProjectName || 'Off-Plan'} es la mejor opción para construcción de riqueza`
                : 'Secundaria es mejor si necesitas cashflow inmediato'
              }
            </h3>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Off-Plan Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500">
                OFF-PLAN
              </Badge>
              {isOffPlanWinner && (
                <Badge className="bg-emerald-500 text-white text-xs">
                  Recomendado
                </Badge>
              )}
            </div>
            
            {/* Pros */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-emerald-500 uppercase tracking-wider">Ventajas</p>
              {offPlanPros.map((pro, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg",
                    pro.highlight 
                      ? "bg-emerald-500/10 border border-emerald-500/30" 
                      : "bg-theme-bg/50"
                  )}
                >
                  <pro.icon className={cn(
                    "w-4 h-4",
                    pro.highlight ? "text-emerald-500" : "text-theme-text-muted"
                  )} />
                  <span className={cn(
                    "text-sm",
                    pro.highlight ? "text-emerald-500 font-medium" : "text-theme-text"
                  )}>
                    {pro.text}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Cons */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-amber-500 uppercase tracking-wider">Trade-offs</p>
              {offPlanCons.map((con, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20"
                >
                  <con.icon className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-600">{con.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500">
                SECUNDARIA
              </Badge>
              {!isOffPlanWinner && (
                <Badge className="bg-cyan-500 text-white text-xs">
                  Recomendado
                </Badge>
              )}
            </div>
            
            {/* Pros */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-cyan-500 uppercase tracking-wider">Ventajas</p>
              {secondaryPros.map((pro, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-theme-bg/50"
                >
                  <pro.icon className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm text-theme-text">{pro.text}</span>
                </div>
              ))}
            </div>
            
            {/* Cons */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-red-500 uppercase tracking-wider">Desventajas</p>
              {secondaryCons.map((con, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20"
                >
                  <con.icon className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">{con.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final Recommendation */}
        <div className="mt-6 p-4 rounded-xl bg-theme-accent/5 border border-theme-accent/20">
          <p className="text-sm text-theme-text leading-relaxed">
            <span className="font-semibold text-theme-accent">💡 Recomendación:</span>{' '}
            {isOffPlanWinner ? (
              <>
                Si puedes cubrir los {metrics.offPlanMonthsNoIncome} meses de construcción sin depender de ingresos 
                de renta, <span className="font-medium text-emerald-500">off-plan ofrece retornos significativamente 
                superiores</span> con {wealthAdvantage.toFixed(0)}% más riqueza y {roeAdvantage.toFixed(1)}% más ROE anualizado.
              </>
            ) : (
              <>
                Si necesitas <span className="font-medium text-cyan-500">cashflow inmediato</span> para cubrir 
                gastos o la hipoteca, secundaria proporciona ingresos desde el día 1 con DSCR de {(metrics.secondaryDSCRLT * 100).toFixed(0)}%.
                Sin embargo, considera que off-plan genera {wealthAdvantage.toFixed(0)}% más riqueza a largo plazo.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
