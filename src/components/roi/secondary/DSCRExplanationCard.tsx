import { Info, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DSCRExplanationCardProps {
  offPlanDSCR: number;
  secondaryDSCR: number;
  rentalMode: 'long-term' | 'airbnb';
  language: 'en' | 'es';
}

export const DSCRExplanationCard = ({
  offPlanDSCR,
  secondaryDSCR,
  rentalMode,
  language,
}: DSCRExplanationCardProps) => {
  const t = language === 'es' ? {
    title: '¿Qué es DSCR?',
    subtitle: 'Debt Service Coverage Ratio',
    explanation: 'El DSCR mide si tu ingreso de renta cubre el pago de la hipoteca:',
    formula: 'DSCR = Ingreso Mensual Neto / Pago Mensual Hipoteca',
    excellent: 'Excelente',
    tight: 'Ajustado',
    deficit: 'Déficit',
    noMortgage: 'Sin Hipoteca',
    coversWithMargin: 'La renta cubre hipoteca con margen',
    barelyCovers: 'La renta apenas cubre',
    outOfPocket: 'Necesitas aportar de bolsillo',
    longTerm: 'Renta Larga',
    airbnb: 'Airbnb',
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
  } : {
    title: 'What is DSCR?',
    subtitle: 'Debt Service Coverage Ratio',
    explanation: 'DSCR measures if your rental income covers the mortgage payment:',
    formula: 'DSCR = Net Monthly Income / Monthly Mortgage Payment',
    excellent: 'Excellent',
    tight: 'Tight',
    deficit: 'Deficit',
    noMortgage: 'No Mortgage',
    coversWithMargin: 'Rent covers mortgage with margin',
    barelyCovers: 'Rent barely covers',
    outOfPocket: 'Need to contribute out of pocket',
    longTerm: 'Long-Term',
    airbnb: 'Airbnb',
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
  };

  const getDSCRStatus = (dscr: number) => {
    if (dscr === Infinity) return { label: t.noMortgage, color: 'text-theme-text-muted', bg: 'bg-theme-border', icon: Shield };
    if (dscr >= 1.2) return { label: t.excellent, color: 'text-emerald-500', bg: 'bg-emerald-500/20', icon: CheckCircle2 };
    if (dscr >= 1.0) return { label: t.tight, color: 'text-amber-500', bg: 'bg-amber-500/20', icon: AlertTriangle };
    return { label: t.deficit, color: 'text-red-500', bg: 'bg-red-500/20', icon: AlertTriangle };
  };

  const getDSCRProgress = (dscr: number) => {
    if (dscr === Infinity) return 100;
    return Math.min(Math.max((dscr / 1.5) * 100, 0), 100);
  };

  const opStatus = getDSCRStatus(offPlanDSCR);
  const secStatus = getDSCRStatus(secondaryDSCR);

  return (
    <Card className="p-4 bg-theme-card border-theme-border">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-theme-accent/10">
          <Info className="w-5 h-5 text-theme-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-theme-text">
            {t.title}
            <Badge variant="outline" className="ml-2 text-[10px]">
              {rentalMode === 'airbnb' ? t.airbnb : t.longTerm}
            </Badge>
          </h3>
          <p className="text-sm text-theme-text-muted mt-1">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Explanation */}
        <div className="p-3 rounded-lg bg-theme-bg/50 text-sm text-theme-text-muted">
          <p className="mb-2">
            {language === 'es' ? (
              <>El DSCR mide si tu <strong className="text-theme-text">ingreso de renta cubre el pago de la hipoteca</strong>:</>
            ) : (
              <>DSCR measures if your <strong className="text-theme-text">rental income covers the mortgage payment</strong>:</>
            )}
          </p>
          <code className="block bg-theme-card p-2 rounded text-xs text-theme-accent font-mono">
            {t.formula}
          </code>
        </div>

        {/* Thresholds */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-1 text-emerald-500 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              ≥ 120%
            </div>
            <p className="text-theme-text-muted mt-1">{t.coversWithMargin}</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-1 text-amber-500 font-medium">
              <AlertTriangle className="w-3 h-3" />
              100-120%
            </div>
            <p className="text-theme-text-muted mt-1">{t.barelyCovers}</p>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-1 text-red-500 font-medium">
              <AlertTriangle className="w-3 h-3" />
              &lt; 100%
            </div>
            <p className="text-theme-text-muted mt-1">{t.outOfPocket}</p>
          </div>
        </div>

        {/* Current DSCR Values */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-theme-border">
          {/* Off-Plan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs">
                {t.offPlan}
              </Badge>
              <span className={`text-sm font-semibold ${opStatus.color}`}>
                {offPlanDSCR === Infinity ? '∞' : `${(offPlanDSCR * 100).toFixed(0)}%`}
              </span>
            </div>
            <Progress 
              value={getDSCRProgress(offPlanDSCR)} 
              className="h-2"
            />
            <div className={`flex items-center gap-1 text-xs ${opStatus.color}`}>
              <opStatus.icon className="w-3 h-3" />
              {opStatus.label}
            </div>
          </div>

          {/* Secondary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/30 text-xs">
                {t.secondary}
              </Badge>
              <span className={`text-sm font-semibold ${secStatus.color}`}>
                {secondaryDSCR === Infinity ? '∞' : `${(secondaryDSCR * 100).toFixed(0)}%`}
              </span>
            </div>
            <Progress 
              value={getDSCRProgress(secondaryDSCR)} 
              className="h-2"
            />
            <div className={`flex items-center gap-1 text-xs ${secStatus.color}`}>
              <secStatus.icon className="w-3 h-3" />
              {secStatus.label}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
