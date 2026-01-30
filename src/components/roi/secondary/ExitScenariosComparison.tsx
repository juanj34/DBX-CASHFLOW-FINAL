import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Wallet, Target, Info } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Currency, formatCurrency, formatDualCurrencyCompact } from '@/components/roi/currencyUtils';
import { OIYearlyProjection } from '@/components/roi/useOICalculations';
import { SecondaryYearlyProjection, ExitComparisonPoint } from './types';

interface ExitScenariosComparisonProps {
  exitMonths: number[];
  offPlanProjections: OIYearlyProjection[];
  secondaryProjections: SecondaryYearlyProjection[];
  offPlanCapitalInvested: number;
  secondaryCapitalInvested: number;
  handoverYearIndex: number;
  rentalMode: 'long-term' | 'airbnb';
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

export const ExitScenariosComparison = ({
  exitMonths,
  offPlanProjections,
  secondaryProjections,
  offPlanCapitalInvested,
  secondaryCapitalInvested,
  handoverYearIndex,
  rentalMode,
  currency,
  rate,
  language,
}: ExitScenariosComparisonProps) => {
  const isAirbnb = rentalMode === 'airbnb';
  const t = language === 'es' ? {
    title: 'Comparación de Salidas',
    subtitle: '¿Qué pasa si vendes ambas propiedades al mismo tiempo?',
    exit: 'Salida',
    value: 'Valor',
    profit: 'Ganancia',
    roe: 'ROE',
    roePY: '/año',
    winner: 'Ganador',
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
    insight: 'La apreciación off-plan durante construcción crea una ventaja significativa que se amplifica con el tiempo.',
  } : {
    title: 'Exit Scenarios Comparison',
    subtitle: 'What if you sell both properties at the same time?',
    exit: 'Exit',
    value: 'Value',
    profit: 'Profit',
    roe: 'ROE',
    roePY: '/yr',
    winner: 'Winner',
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
    insight: 'Off-plan appreciation during construction creates a significant advantage that compounds over time.',
  };

  const exitData = useMemo((): ExitComparisonPoint[] => {
    return exitMonths.map((months) => {
      const yearIndex = Math.ceil(months / 12) - 1;
      const years = months / 12;
      
      // Off-Plan calculations
      const opProj = offPlanProjections[yearIndex];
      const opPropertyValue = opProj?.propertyValue || 0;
      
      // Calculate cumulative rent up to this point
      let opCumulativeRent = 0;
      for (let i = 0; i <= yearIndex && i < offPlanProjections.length; i++) {
        if (i >= handoverYearIndex - 1) {
          opCumulativeRent += offPlanProjections[i]?.netIncome || 0;
        }
      }
      
      const opExitCosts = opPropertyValue * 0.02; // 2% exit costs
      const opProfit = opPropertyValue + opCumulativeRent - offPlanCapitalInvested - opExitCosts;
      const opTotalROE = offPlanCapitalInvested > 0 ? (opProfit / offPlanCapitalInvested) * 100 : 0;
      const opAnnualizedROE = years > 0 ? opTotalROE / years : 0;

      // Secondary calculations
      const secProj = secondaryProjections[yearIndex];
      const secPropertyValue = secProj?.propertyValue || 0;
      const secCumulativeRent = isAirbnb ? (secProj?.cumulativeRentST || 0) : (secProj?.cumulativeRentLT || 0);
      const secExitCosts = secPropertyValue * 0.02;
      const secProfit = secPropertyValue + secCumulativeRent - secondaryCapitalInvested - secExitCosts;
      const secTotalROE = secondaryCapitalInvested > 0 ? (secProfit / secondaryCapitalInvested) * 100 : 0;
      const secAnnualizedROE = years > 0 ? secTotalROE / years : 0;

      return {
        months,
        offPlan: {
          propertyValue: opPropertyValue,
          capitalInvested: offPlanCapitalInvested,
          profit: opProfit,
          totalROE: opTotalROE,
          annualizedROE: opAnnualizedROE,
        },
        secondary: {
          propertyValue: secPropertyValue,
          capitalInvested: secondaryCapitalInvested,
          profit: secProfit,
          totalROE: secTotalROE,
          annualizedROE: secAnnualizedROE,
        },
      };
    });
  }, [exitMonths, offPlanProjections, secondaryProjections, offPlanCapitalInvested, secondaryCapitalInvested, handoverYearIndex, isAirbnb]);

  const formatValue = (value: number) => {
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  const formatExitLabel = (months: number) => {
    const years = months / 12;
    if (Number.isInteger(years)) {
      return language === 'es' ? `Año ${years}` : `Year ${years}`;
    }
    return `${months}m`;
  };

  if (exitMonths.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Card className="p-4 bg-theme-card border-theme-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-theme-accent/10">
              <Target className="w-5 h-5 text-theme-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-theme-text">{t.title}</h3>
              <p className="text-xs text-theme-text-muted">{t.subtitle}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {exitMonths.length} {language === 'es' ? 'escenarios' : 'scenarios'}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-theme-border hover:bg-transparent">
                <TableHead className="text-theme-text-muted text-xs w-20">{t.exit}</TableHead>
                <TableHead className="text-theme-text-muted text-xs text-center" colSpan={3}>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                    🏗️ {t.offPlan}
                  </Badge>
                </TableHead>
                <TableHead className="text-theme-text-muted text-xs text-center" colSpan={3}>
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/30">
                    🏠 {t.secondary}
                  </Badge>
                </TableHead>
                <TableHead className="text-theme-text-muted text-xs text-center w-24">{t.winner}</TableHead>
              </TableRow>
              <TableRow className="border-theme-border hover:bg-transparent">
                <TableHead className="text-theme-text-muted text-[10px]"></TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.value}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.profit}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.roe}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.value}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.profit}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.roe}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exitData.map((exit) => {
                const winner = exit.offPlan.profit > exit.secondary.profit ? 'offplan' : 'secondary';
                const profitDiff = Math.abs(exit.offPlan.profit - exit.secondary.profit);
                
                return (
                  <TableRow key={exit.months} className="border-theme-border">
                    <TableCell className="font-medium text-theme-text text-sm">
                      {formatExitLabel(exit.months)}
                    </TableCell>
                    
                    {/* Off-Plan */}
                    <TableCell className="text-center">
                      <span className={`text-xs ${winner === 'offplan' ? 'text-emerald-500 font-medium' : 'text-theme-text'}`}>
                        {formatValue(exit.offPlan.propertyValue)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-xs ${winner === 'offplan' ? 'text-emerald-500 font-semibold' : 'text-theme-text'}`}>
                        +{formatValue(exit.offPlan.profit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-xs font-medium ${winner === 'offplan' ? 'text-emerald-500' : 'text-theme-text'}`}>
                          {exit.offPlan.totalROE.toFixed(0)}%
                        </span>
                        <span className="text-[10px] text-theme-text-muted">
                          ({exit.offPlan.annualizedROE.toFixed(1)}%{t.roePY})
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Secondary */}
                    <TableCell className="text-center">
                      <span className={`text-xs ${winner === 'secondary' ? 'text-cyan-500 font-medium' : 'text-theme-text'}`}>
                        {formatValue(exit.secondary.propertyValue)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-xs ${winner === 'secondary' ? 'text-cyan-500 font-semibold' : 'text-theme-text'}`}>
                        +{formatValue(exit.secondary.profit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-xs font-medium ${winner === 'secondary' ? 'text-cyan-500' : 'text-theme-text'}`}>
                          {exit.secondary.totalROE.toFixed(0)}%
                        </span>
                        <span className="text-[10px] text-theme-text-muted">
                          ({exit.secondary.annualizedROE.toFixed(1)}%{t.roePY})
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Winner */}
                    <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge className={`text-[10px] ${
                            winner === 'offplan' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                              : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
                          }`}>
                            <Trophy className="w-3 h-3 mr-1" />
                            {winner === 'offplan' ? 'OP' : 'SEC'}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            +{formatCurrency(profitDiff, 'AED', 1)} {language === 'es' ? 'más ganancia' : 'more profit'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Insight */}
        <div className="mt-4 p-3 rounded-lg bg-theme-accent/5 border border-theme-accent/20 flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-theme-accent mt-0.5 flex-shrink-0" />
          <p className="text-xs text-theme-text-muted">
            <strong className="text-theme-text">💡</strong> {t.insight}
          </p>
        </div>
      </Card>
    </TooltipProvider>
  );
};
