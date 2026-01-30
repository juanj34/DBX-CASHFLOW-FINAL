import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, Clock, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComparisonMetrics } from './types';

interface ComparisonVerdictProps {
  metrics: ComparisonMetrics;
  offPlanProjectName?: string;
  language?: 'en' | 'es';
}

export const ComparisonVerdict = ({ metrics, offPlanProjectName, language = 'es' }: ComparisonVerdictProps) => {
  const t = language === 'es' ? {
    recommendation: 'RECOMENDACIÓN',
    offPlanWinner: 'es la mejor opción para construcción de riqueza',
    secondaryWinner: 'Secundaria es mejor si necesitas cashflow inmediato',
    advantages: 'Ventajas',
    tradeoffs: 'Trade-offs',
    disadvantages: 'Desventajas',
    lessCapital: 'menos capital inicial',
    moreWealth: 'más riqueza en 10 años',
    moreROE: 'más ROE anualizado',
    surpassesYear: 'Supera secundaria en Año',
    monthsNoIncome: 'meses sin ingresos',
    constructionRisk: 'Riesgo de construcción',
    incomeFromDay1: 'Ingresos desde día 1',
    dscrCovers: 'cubre hipoteca',
    readyProperty: 'Propiedad lista, sin espera',
    capitalRequired: 'capital requerido',
    appreciationOnly: 'apreciación anual',
    lowROE: '(bajo)',
    tipLabel: 'Recomendación',
    recommended: 'Recomendado',
    offPlan: 'OFF-PLAN',
    secondary: 'SECUNDARIA',
    ifYouCan: 'Si puedes cubrir los',
    monthsConstruction: 'meses de construcción sin depender de ingresos de renta,',
    offPlanOffers: 'off-plan ofrece retornos significativamente superiores',
    withMore: 'con',
    moreWealthAnd: 'más riqueza y',
    moreROEAnnualized: 'más ROE anualizado.',
    ifYouNeed: 'Si necesitas',
    immediateCashflow: 'cashflow inmediato',
    toCoverExpenses: 'para cubrir gastos o la hipoteca, secundaria proporciona ingresos desde el día 1 con DSCR de',
    howeverConsider: '. Sin embargo, considera que off-plan genera',
    moreWealthLongTerm: 'más riqueza a largo plazo.',
  } : {
    recommendation: 'RECOMMENDATION',
    offPlanWinner: 'is the best option for wealth building',
    secondaryWinner: 'Secondary is better if you need immediate cashflow',
    advantages: 'Advantages',
    tradeoffs: 'Trade-offs',
    disadvantages: 'Disadvantages',
    lessCapital: 'less initial capital',
    moreWealth: 'more wealth in 10 years',
    moreROE: 'more annualized ROE',
    surpassesYear: 'Surpasses secondary in Year',
    monthsNoIncome: 'months without income',
    constructionRisk: 'Construction risk',
    incomeFromDay1: 'Income from day 1',
    dscrCovers: 'covers mortgage',
    readyProperty: 'Ready property, no wait',
    capitalRequired: 'capital required',
    appreciationOnly: 'annual appreciation',
    lowROE: '(low)',
    tipLabel: 'Recommendation',
    recommended: 'Recommended',
    offPlan: 'OFF-PLAN',
    secondary: 'SECONDARY',
    ifYouCan: 'If you can cover the',
    monthsConstruction: 'months of construction without relying on rental income,',
    offPlanOffers: 'off-plan offers significantly superior returns',
    withMore: 'with',
    moreWealthAnd: 'more wealth and',
    moreROEAnnualized: 'more annualized ROE.',
    ifYouNeed: 'If you need',
    immediateCashflow: 'immediate cashflow',
    toCoverExpenses: 'to cover expenses or mortgage, secondary provides income from day 1 with DSCR of',
    howeverConsider: '. However, consider that off-plan generates',
    moreWealthLongTerm: 'more wealth long-term.',
  };

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
    { icon: DollarSign, text: `${capitalAdvantage.toFixed(0)}% ${t.lessCapital}`, highlight: capitalAdvantage > 30 },
    { icon: TrendingUp, text: `${wealthAdvantage.toFixed(0)}% ${t.moreWealth}`, highlight: wealthAdvantage > 50 },
    { icon: Award, text: `${roeAdvantage.toFixed(1)}% ${t.moreROE}`, highlight: roeAdvantage > 15 },
    metrics.crossoverYearLT && { icon: CheckCircle, text: `${t.surpassesYear} ${metrics.crossoverYearLT}`, highlight: true },
  ].filter(Boolean) as { icon: any; text: string; highlight: boolean }[];
  
  const offPlanCons = [
    { icon: Clock, text: `${metrics.offPlanMonthsNoIncome} ${t.monthsNoIncome}` },
    { icon: AlertTriangle, text: t.constructionRisk },
  ];
  
  const secondaryPros = [
    { icon: DollarSign, text: t.incomeFromDay1 },
    { icon: CheckCircle, text: `DSCR ${(metrics.secondaryDSCRLT * 100).toFixed(0)}% (${t.dscrCovers})` },
    { icon: TrendingUp, text: t.readyProperty },
  ];
  
  const secondaryCons = [
    { icon: DollarSign, text: `AED ${(metrics.secondaryCapitalDay1 / 1000).toFixed(0)}K ${t.capitalRequired}` },
    { icon: TrendingUp, text: `3% ${t.appreciationOnly}` },
    { icon: Award, text: `ROE ${metrics.secondaryROEYear10LT.toFixed(1)}% ${t.lowROE}` },
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
              🏆 {t.recommendation}
            </Badge>
            <h3 className="text-xl font-bold text-theme-text">
              {isOffPlanWinner 
                ? `${offPlanProjectName || 'Off-Plan'} ${t.offPlanWinner}`
                : t.secondaryWinner
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
                {t.offPlan}
              </Badge>
              {isOffPlanWinner && (
                <Badge className="bg-emerald-500 text-white text-xs">
                  {t.recommended}
                </Badge>
              )}
            </div>
            
            {/* Pros */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-emerald-500 uppercase tracking-wider">{t.advantages}</p>
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
              <p className="text-xs font-medium text-amber-500 uppercase tracking-wider">{t.tradeoffs}</p>
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
                {t.secondary}
              </Badge>
              {!isOffPlanWinner && (
                <Badge className="bg-cyan-500 text-white text-xs">
                  {t.recommended}
                </Badge>
              )}
            </div>
            
            {/* Pros */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-cyan-500 uppercase tracking-wider">{t.advantages}</p>
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
              <p className="text-xs font-medium text-red-500 uppercase tracking-wider">{t.disadvantages}</p>
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
            <span className="font-semibold text-theme-accent">💡 {t.tipLabel}:</span>{' '}
            {isOffPlanWinner ? (
              <>
                {t.ifYouCan} {metrics.offPlanMonthsNoIncome} {t.monthsConstruction}{' '}
                <span className="font-medium text-emerald-500">{t.offPlanOffers}</span> {t.withMore}{' '}
                {wealthAdvantage.toFixed(0)}% {t.moreWealthAnd} {roeAdvantage.toFixed(1)}% {t.moreROEAnnualized}
              </>
            ) : (
              <>
                {t.ifYouNeed} <span className="font-medium text-cyan-500">{t.immediateCashflow}</span>{' '}
                {t.toCoverExpenses} {(metrics.secondaryDSCRLT * 100).toFixed(0)}%{t.howeverConsider}{' '}
                {wealthAdvantage.toFixed(0)}% {t.moreWealthLongTerm}
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
