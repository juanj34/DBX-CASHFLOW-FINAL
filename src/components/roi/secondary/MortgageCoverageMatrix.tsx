import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Banknote, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../currencyUtils';

interface MortgageCoverageMatrixProps {
  // Off-Plan (post-handover)
  offPlanMonthlyRentLT: number;
  offPlanMonthlyRentST: number;
  offPlanMonthlyMortgage: number;
  offPlanLoanAmount: number;
  
  // Secondary (immediate)
  secondaryMonthlyRentLT: number;
  secondaryMonthlyRentST: number;
  secondaryMonthlyMortgage: number;
  secondaryLoanAmount: number;
  
  showAirbnb?: boolean;
  language?: 'en' | 'es';
}

interface CoverageCell {
  dscr: number;
  monthlyIncome: number;
  monthlyMortgage: number;
  gap: number;
  status: 'positive' | 'tight' | 'negative';
}

const getCoverageStatus = (dscr: number): 'positive' | 'tight' | 'negative' => {
  if (dscr >= 1.2) return 'positive';
  if (dscr >= 1) return 'tight';
  return 'negative';
};

const StatusIcon = ({ status }: { status: 'positive' | 'tight' | 'negative' }) => {
  switch (status) {
    case 'positive':
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case 'tight':
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    case 'negative':
      return <XCircle className="w-4 h-4 text-red-500" />;
  }
};

const CoverageCellComponent = ({ 
  label, 
  cell, 
  subLabel,
  t,
}: { 
  label: string; 
  cell: CoverageCell;
  subLabel?: string;
  t: {
    income: string;
    mortgage: string;
    surplus: string;
    gap: string;
    perMonth: string;
  };
}) => {
  const dscrPercent = (cell.dscr * 100).toFixed(0);
  
  return (
    <div className={cn(
      "p-4 rounded-lg border-2 transition-all",
      cell.status === 'positive' && "border-emerald-500/50 bg-emerald-500/5",
      cell.status === 'tight' && "border-amber-500/50 bg-amber-500/5",
      cell.status === 'negative' && "border-red-500/50 bg-red-500/5"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-theme-text">{label}</span>
        <StatusIcon status={cell.status} />
      </div>
      
      {subLabel && (
        <p className="text-[10px] text-theme-text-muted mb-2">{subLabel}</p>
      )}
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-theme-text-muted">{t.income}:</span>
          <span className="text-theme-text font-medium">
            AED {cell.monthlyIncome.toLocaleString()}{t.perMonth}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-theme-text-muted">{t.mortgage}:</span>
          <span className="text-theme-text">
            AED {cell.monthlyMortgage.toLocaleString()}{t.perMonth}
          </span>
        </div>
        <div className="flex justify-between text-xs pt-1 border-t border-theme-border mt-1">
          <span className="text-theme-text-muted">
            {cell.gap >= 0 ? `${t.surplus}:` : `${t.gap}:`}
          </span>
          <span className={cn(
            "font-medium",
            cell.gap >= 0 ? "text-emerald-500" : "text-red-500"
          )}>
            {cell.gap >= 0 ? '+' : ''}AED {cell.gap.toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-theme-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-theme-text-muted">DSCR:</span>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              cell.status === 'positive' && "border-emerald-500 text-emerald-500",
              cell.status === 'tight' && "border-amber-500 text-amber-500",
              cell.status === 'negative' && "border-red-500 text-red-500"
            )}
          >
            {dscrPercent}%
          </Badge>
        </div>
      </div>
    </div>
  );
};

export const MortgageCoverageMatrix = ({
  offPlanMonthlyRentLT,
  offPlanMonthlyRentST,
  offPlanMonthlyMortgage,
  offPlanLoanAmount,
  secondaryMonthlyRentLT,
  secondaryMonthlyRentST,
  secondaryMonthlyMortgage,
  secondaryLoanAmount,
  showAirbnb = true,
  language = 'es',
}: MortgageCoverageMatrixProps) => {
  const t = language === 'es' ? {
    title: 'Análisis de Cobertura de Hipoteca',
    subtitle: '¿La renta cubre el pago mensual de la hipoteca?',
    offPlanLoan: 'Off-Plan Préstamo',
    secondaryLoan: 'Secundaria Préstamo',
    postHandover: '(Post-Handover)',
    fromDay1: '(Desde Día 1)',
    longTerm: 'Largo Plazo',
    airbnb: 'Airbnb',
    income: 'Ingreso',
    mortgage: 'Hipoteca',
    surplus: 'Surplus',
    gap: 'Gap',
    perMonth: '/mes',
    dscrComfortable: 'DSCR ≥120%: Holgura cómoda',
    dscrTight: 'DSCR 100-120%: Ajustado',
    dscrNoCover: 'DSCR <100%: No cubre',
    offPlanLT: 'Off-Plan LT',
    offPlanAirbnb: 'Off-Plan Airbnb',
    secondaryLT: 'Secundaria LT',
    secondaryAirbnb: 'Secundaria Airbnb',
  } : {
    title: 'Mortgage Coverage Analysis',
    subtitle: 'Does the rent cover the monthly mortgage payment?',
    offPlanLoan: 'Off-Plan Loan',
    secondaryLoan: 'Secondary Loan',
    postHandover: '(Post-Handover)',
    fromDay1: '(From Day 1)',
    longTerm: 'Long-Term',
    airbnb: 'Airbnb',
    income: 'Income',
    mortgage: 'Mortgage',
    surplus: 'Surplus',
    gap: 'Gap',
    perMonth: '/mo',
    dscrComfortable: 'DSCR ≥120%: Comfortable margin',
    dscrTight: 'DSCR 100-120%: Tight',
    dscrNoCover: 'DSCR <100%: Does not cover',
    offPlanLT: 'Off-Plan LT',
    offPlanAirbnb: 'Off-Plan Airbnb',
    secondaryLT: 'Secondary LT',
    secondaryAirbnb: 'Secondary Airbnb',
  };

  const cellTranslations = {
    income: t.income,
    mortgage: t.mortgage,
    surplus: t.surplus,
    gap: t.gap,
    perMonth: t.perMonth,
  };

  // Calculate all cells
  const offPlanLT: CoverageCell = {
    dscr: offPlanMonthlyMortgage > 0 ? offPlanMonthlyRentLT / offPlanMonthlyMortgage : Infinity,
    monthlyIncome: offPlanMonthlyRentLT,
    monthlyMortgage: offPlanMonthlyMortgage,
    gap: offPlanMonthlyRentLT - offPlanMonthlyMortgage,
    status: getCoverageStatus(offPlanMonthlyMortgage > 0 ? offPlanMonthlyRentLT / offPlanMonthlyMortgage : Infinity),
  };

  const offPlanST: CoverageCell = {
    dscr: offPlanMonthlyMortgage > 0 ? offPlanMonthlyRentST / offPlanMonthlyMortgage : Infinity,
    monthlyIncome: offPlanMonthlyRentST,
    monthlyMortgage: offPlanMonthlyMortgage,
    gap: offPlanMonthlyRentST - offPlanMonthlyMortgage,
    status: getCoverageStatus(offPlanMonthlyMortgage > 0 ? offPlanMonthlyRentST / offPlanMonthlyMortgage : Infinity),
  };

  const secondaryLT: CoverageCell = {
    dscr: secondaryMonthlyMortgage > 0 ? secondaryMonthlyRentLT / secondaryMonthlyMortgage : Infinity,
    monthlyIncome: secondaryMonthlyRentLT,
    monthlyMortgage: secondaryMonthlyMortgage,
    gap: secondaryMonthlyRentLT - secondaryMonthlyMortgage,
    status: getCoverageStatus(secondaryMonthlyMortgage > 0 ? secondaryMonthlyRentLT / secondaryMonthlyMortgage : Infinity),
  };

  const secondaryST: CoverageCell = {
    dscr: secondaryMonthlyMortgage > 0 ? secondaryMonthlyRentST / secondaryMonthlyMortgage : Infinity,
    monthlyIncome: secondaryMonthlyRentST,
    monthlyMortgage: secondaryMonthlyMortgage,
    gap: secondaryMonthlyRentST - secondaryMonthlyMortgage,
    status: getCoverageStatus(secondaryMonthlyMortgage > 0 ? secondaryMonthlyRentST / secondaryMonthlyMortgage : Infinity),
  };

  return (
    <Card className="bg-theme-card border-theme-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-theme-text flex items-center gap-2">
          <Banknote className="w-5 h-5 text-amber-500" />
          {t.title}
        </CardTitle>
        <p className="text-sm text-theme-text-muted">
          {t.subtitle}
        </p>
      </CardHeader>
      <CardContent>
        {/* Loan Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg bg-theme-bg/50 border border-theme-border">
          <div>
            <p className="text-xs text-theme-text-muted mb-1">{t.offPlanLoan}</p>
            <p className="text-sm font-medium text-theme-text">
              AED {offPlanLoanAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-theme-text-muted mb-1">{t.secondaryLoan}</p>
            <p className="text-sm font-medium text-theme-text">
              AED {secondaryLoanAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Matrix */}
        <div className="space-y-4">
          {/* Headers */}
          <div className="grid grid-cols-3 gap-4">
            <div /> {/* Empty corner */}
            <div className="text-center">
              <Badge variant="outline" className="bg-theme-accent/10 text-theme-accent border-theme-accent">
                OFF-PLAN
              </Badge>
              <p className="text-[10px] text-theme-text-muted mt-1">{t.postHandover}</p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500">
                {language === 'es' ? 'SECUNDARIA' : 'SECONDARY'}
              </Badge>
              <p className="text-[10px] text-theme-text-muted mt-1">{t.fromDay1}</p>
            </div>
          </div>

          {/* Long-Term Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center">
              <Badge variant="outline" className="text-xs">
                {t.longTerm}
              </Badge>
            </div>
            <CoverageCellComponent label={t.offPlanLT} cell={offPlanLT} t={cellTranslations} />
            <CoverageCellComponent label={t.secondaryLT} cell={secondaryLT} t={cellTranslations} />
          </div>

          {/* Airbnb Row */}
          {showAirbnb && (
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center">
                <Badge variant="outline" className="text-xs bg-pink-500/10 text-pink-500 border-pink-500">
                  {t.airbnb}
                </Badge>
              </div>
              <CoverageCellComponent label={t.offPlanAirbnb} cell={offPlanST} t={cellTranslations} />
              <CoverageCellComponent label={t.secondaryAirbnb} cell={secondaryST} t={cellTranslations} />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-theme-border">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-theme-text-muted">{t.dscrComfortable}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-theme-text-muted">{t.dscrTight}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-theme-text-muted">{t.dscrNoCover}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
