import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Target, Wallet, Info } from 'lucide-react';
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
import { OIInputs } from '@/components/roi/useOICalculations';
import { ExitComparisonPoint } from './types';
import { 
  calculateEquityAtExitWithDetails, 
  calculateExitPrice 
} from '@/components/roi/constructionProgress';

interface ExitScenariosComparisonProps {
  exitMonths: number[];
  // Off-Plan data (using canonical calculations)
  offPlanInputs: OIInputs;
  offPlanBasePrice: number;
  offPlanTotalMonths: number;
  offPlanEntryCosts: number;
  // Secondary data
  secondaryPurchasePrice: number;
  secondaryCapitalInvested: number;
  secondaryAppreciationRate: number;
  // Display
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

export const ExitScenariosComparison = ({
  exitMonths,
  offPlanInputs,
  offPlanBasePrice,
  offPlanTotalMonths,
  offPlanEntryCosts,
  secondaryPurchasePrice,
  secondaryCapitalInvested,
  secondaryAppreciationRate,
  currency,
  rate,
  language,
}: ExitScenariosComparisonProps) => {
  const t = language === 'es' ? {
    title: 'Escenarios de Salida',
    subtitle: 'ROE basado en apreciación pura (sin renta) y capital invertido real',
    exit: 'Salida',
    value: 'Valor',
    capital: 'Capital',
    profit: 'Ganancia',
    roe: 'ROE',
    roePY: '/año',
    winner: 'Ganador',
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
    insight: 'Las salidas muestran solo apreciación pura. Off-Plan usa capital del plan de pagos; Secundaria usa capital día 1.',
    pureAppreciation: 'Apreciación pura',
    capitalAtExit: 'Capital en salida',
  } : {
    title: 'Exit Scenarios',
    subtitle: 'ROE based on pure appreciation (no rent) and actual capital invested',
    exit: 'Exit',
    value: 'Value',
    capital: 'Capital',
    profit: 'Profit',
    roe: 'ROE',
    roePY: '/yr',
    winner: 'Winner',
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
    insight: 'Exits show pure appreciation only. Off-Plan uses payment plan capital; Secondary uses day 1 capital.',
    pureAppreciation: 'Pure appreciation',
    capitalAtExit: 'Capital at exit',
  };

  const exitData = useMemo((): ExitComparisonPoint[] => {
    return exitMonths.map((months) => {
      const years = months / 12;
      
      // === OFF-PLAN: Use canonical functions ===
      // Capital from payment plan at exit month (NOT day 1)
      const equityResult = calculateEquityAtExitWithDetails(
        months, 
        offPlanInputs, 
        offPlanTotalMonths, 
        offPlanBasePrice
      );
      const opCapitalAtExit = equityResult.finalEquity + offPlanEntryCosts;
      
      // Exit price using phased appreciation
      const opExitPrice = calculateExitPrice(
        months, 
        offPlanBasePrice, 
        offPlanTotalMonths, 
        offPlanInputs
      );
      const opAppreciation = opExitPrice - offPlanBasePrice;
      
      // Pure ROE = Appreciation / Capital at exit
      const opROE = opCapitalAtExit > 0 ? (opAppreciation / opCapitalAtExit) * 100 : 0;
      const opAnnualizedROE = years > 0 ? opROE / years : 0;
      
      // === SECONDARY: All capital paid day 1 ===
      const secExitPrice = secondaryPurchasePrice * Math.pow(1 + secondaryAppreciationRate / 100, years);
      const secAppreciation = secExitPrice - secondaryPurchasePrice;
      
      const secROE = secondaryCapitalInvested > 0 ? (secAppreciation / secondaryCapitalInvested) * 100 : 0;
      const secAnnualizedROE = years > 0 ? secROE / years : 0;
      
      return {
        months,
        offPlan: {
          propertyValue: opExitPrice,
          capitalInvested: opCapitalAtExit,  // Actual capital at exit!
          profit: opAppreciation,            // Pure appreciation
          totalROE: opROE,
          annualizedROE: opAnnualizedROE,
        },
        secondary: {
          propertyValue: secExitPrice,
          capitalInvested: secondaryCapitalInvested,
          profit: secAppreciation,           // Pure appreciation
          totalROE: secROE,
          annualizedROE: secAnnualizedROE,
        },
      };
    });
  }, [
    exitMonths, 
    offPlanInputs, 
    offPlanBasePrice, 
    offPlanTotalMonths, 
    offPlanEntryCosts, 
    secondaryPurchasePrice, 
    secondaryCapitalInvested, 
    secondaryAppreciationRate
  ]);

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
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs gap-1">
                <Info className="w-3 h-3" />
                {t.pureAppreciation}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                {language === 'es' 
                  ? 'Ganancia = Precio Salida - Precio Base (sin incluir renta). Capital = Lo que has pagado según el plan de pagos.'
                  : 'Profit = Exit Price - Base Price (no rent included). Capital = What you\'ve paid according to payment plan.'
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-theme-border hover:bg-transparent">
                <TableHead className="text-theme-text-muted text-xs w-20">{t.exit}</TableHead>
                <TableHead className="text-theme-text-muted text-xs text-center" colSpan={4}>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                    🏗️ {t.offPlan}
                  </Badge>
                </TableHead>
                <TableHead className="text-theme-text-muted text-xs text-center" colSpan={4}>
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/30">
                    🏠 {t.secondary}
                  </Badge>
                </TableHead>
                <TableHead className="text-theme-text-muted text-xs text-center w-20">{t.winner}</TableHead>
              </TableRow>
              <TableRow className="border-theme-border hover:bg-transparent">
                <TableHead className="text-theme-text-muted text-[10px]"></TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.value}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.capital}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.profit}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.roe}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.value}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.capital}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.profit}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-center">{t.roe}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exitData.map((exit) => {
                const winner = exit.offPlan.annualizedROE > exit.secondary.annualizedROE ? 'offplan' : 'secondary';
                const roeDiff = Math.abs(exit.offPlan.annualizedROE - exit.secondary.annualizedROE);
                
                return (
                  <TableRow key={exit.months} className="border-theme-border">
                    <TableCell className="font-medium text-theme-text text-sm">
                      {formatExitLabel(exit.months)}
                    </TableCell>
                    
                    {/* Off-Plan */}
                    <TableCell className="text-center">
                      <span className="text-xs text-theme-text">
                        {formatValue(exit.offPlan.propertyValue)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-xs text-theme-text-muted">
                            {formatValue(exit.offPlan.capitalInvested)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{t.capitalAtExit}</p>
                        </TooltipContent>
                      </Tooltip>
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
                      <span className="text-xs text-theme-text">
                        {formatValue(exit.secondary.propertyValue)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-xs text-theme-text-muted">
                            {formatValue(exit.secondary.capitalInvested)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{language === 'es' ? 'Capital día 1' : 'Day 1 capital'}</p>
                        </TooltipContent>
                      </Tooltip>
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
                            +{roeDiff.toFixed(1)}%{t.roePY} {language === 'es' ? 'mejor' : 'better'}
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
