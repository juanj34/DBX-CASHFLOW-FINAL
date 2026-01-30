import { Wallet, Clock, TrendingUp, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency } from '@/components/roi/currencyUtils';

interface OutOfPocketCardProps {
  offPlanCapitalDuringConstruction: number;
  monthsWithoutIncome: number;
  appreciationDuringConstruction: number;
  secondaryCapitalDay1: number;
  secondaryIncomeMonths: number;
}

export const OutOfPocketCard = ({
  offPlanCapitalDuringConstruction,
  monthsWithoutIncome,
  appreciationDuringConstruction,
  secondaryCapitalDay1,
  secondaryIncomeMonths,
}: OutOfPocketCardProps) => {
  // Calculate opportunity cost (secondary rent that could have been earned)
  const avgMonthlyRent = secondaryCapitalDay1 * 0.07 / 12; // Assume 7% yield
  const opportunityCost = avgMonthlyRent * monthsWithoutIncome;

  return (
    <TooltipProvider>
      <Card className="p-4 bg-theme-card border-theme-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Wallet className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-theme-text">Fase de Construcción</h3>
            <p className="text-xs text-theme-text-muted">Capital sin retorno inmediato</p>
          </div>
          <Tooltip>
            <TooltipTrigger className="ml-auto">
              <Info className="w-4 h-4 text-theme-text-muted" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px]">
              <p className="text-xs">
                Durante la construcción, off-plan no genera renta pero sí apreciación.
                Secundaria genera cashflow desde el día 1.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Off-Plan Side */}
          <div className="space-y-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs">
              Off-Plan
            </Badge>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  Capital Total
                </span>
                <span className="text-sm font-medium text-theme-text">
                  {formatCurrency(offPlanCapitalDuringConstruction, 'AED', 0)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Sin Ingresos
                </span>
                <span className="text-sm font-medium text-amber-500">
                  {monthsWithoutIncome} meses
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Apreciación
                </span>
                <span className="text-sm font-medium text-emerald-500">
                  +{formatCurrency(appreciationDuringConstruction, 'AED', 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Side */}
          <div className="space-y-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/30 text-xs">
              Secundaria
            </Badge>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  Capital Total
                </span>
                <span className="text-sm font-medium text-theme-text">
                  {formatCurrency(secondaryCapitalDay1, 'AED', 0)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Con Ingresos
                </span>
                <span className="text-sm font-medium text-cyan-500">
                  Desde día 1
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Renta Estimada
                </span>
                <span className="text-sm font-medium text-cyan-500">
                  +{formatCurrency(opportunityCost, 'AED', 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 rounded-lg bg-theme-bg/50 text-xs text-theme-text-muted">
          <p>
            <strong className="text-theme-text">Trade-off:</strong> Off-Plan requiere {monthsWithoutIncome} meses 
            sin cashflow, pero la apreciación durante construcción ({formatCurrency(appreciationDuringConstruction, 'AED', 0)}) 
            compensa el costo de oportunidad.
          </p>
        </div>
      </Card>
    </TooltipProvider>
  );
};
