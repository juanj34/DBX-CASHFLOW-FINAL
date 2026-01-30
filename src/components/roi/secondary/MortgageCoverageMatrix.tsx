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

const CoverageCell = ({ 
  label, 
  cell, 
  subLabel 
}: { 
  label: string; 
  cell: CoverageCell;
  subLabel?: string;
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
          <span className="text-theme-text-muted">Ingreso:</span>
          <span className="text-theme-text font-medium">
            AED {cell.monthlyIncome.toLocaleString()}/mes
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-theme-text-muted">Hipoteca:</span>
          <span className="text-theme-text">
            AED {cell.monthlyMortgage.toLocaleString()}/mes
          </span>
        </div>
        <div className="flex justify-between text-xs pt-1 border-t border-theme-border mt-1">
          <span className="text-theme-text-muted">
            {cell.gap >= 0 ? 'Surplus:' : 'Gap:'}
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
}: MortgageCoverageMatrixProps) => {
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
          Análisis de Cobertura de Hipoteca
        </CardTitle>
        <p className="text-sm text-theme-text-muted">
          ¿La renta cubre el pago mensual de la hipoteca?
        </p>
      </CardHeader>
      <CardContent>
        {/* Loan Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg bg-theme-bg/50 border border-theme-border">
          <div>
            <p className="text-xs text-theme-text-muted mb-1">Off-Plan Préstamo</p>
            <p className="text-sm font-medium text-theme-text">
              AED {offPlanLoanAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-theme-text-muted mb-1">Secundaria Préstamo</p>
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
              <p className="text-[10px] text-theme-text-muted mt-1">(Post-Handover)</p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500">
                SECUNDARIA
              </Badge>
              <p className="text-[10px] text-theme-text-muted mt-1">(Desde Día 1)</p>
            </div>
          </div>

          {/* Long-Term Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center">
              <Badge variant="outline" className="text-xs">
                Largo Plazo
              </Badge>
            </div>
            <CoverageCell label="Off-Plan LT" cell={offPlanLT} />
            <CoverageCell label="Secundaria LT" cell={secondaryLT} />
          </div>

          {/* Airbnb Row */}
          {showAirbnb && (
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center">
                <Badge variant="outline" className="text-xs bg-pink-500/10 text-pink-500 border-pink-500">
                  Airbnb
                </Badge>
              </div>
              <CoverageCell label="Off-Plan Airbnb" cell={offPlanST} />
              <CoverageCell label="Secundaria Airbnb" cell={secondaryST} />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-theme-border">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-theme-text-muted">DSCR ≥120%: Holgura cómoda</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-theme-text-muted">DSCR 100-120%: Ajustado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-theme-text-muted">DSCR &lt;100%: No cubre</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
