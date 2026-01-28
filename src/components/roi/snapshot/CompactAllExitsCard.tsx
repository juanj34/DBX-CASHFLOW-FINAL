import { TrendingUp, Clock, ChevronRight, Hammer, DollarSign } from 'lucide-react';
import { OIInputs, OICalculations, OIExitScenario } from '../useOICalculations';
import { Currency, formatCurrency } from '../currencyUtils';
import { monthToConstruction, calculateExitScenario } from '../constructionProgress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompactAllExitsCardProps {
  inputs: OIInputs;
  calculations: OICalculations;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
  onClick?: () => void;
}

const getDateFromMonths = (months: number, bookingMonth: number, bookingYear: number): string => {
  const totalMonthsFromJan = bookingMonth + months;
  const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
  const month = ((totalMonthsFromJan - 1) % 12) + 1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]}'${(bookingYear + yearOffset).toString().slice(-2)}`;
};

export const CompactAllExitsCard = ({
  inputs,
  calculations,
  exitScenarios,
  currency,
  rate,
  onClick,
}: CompactAllExitsCardProps) => {
  const { t } = useLanguage();
  
  // Get basePrice from inputs with fallback to calculations
  const basePrice = inputs.basePrice || calculations.basePrice || 0;
  
  // If no basePrice, don't render anything
  if (basePrice <= 0) {
    return null;
  }
  
  // Calculate scenarios dynamically instead of looking up from pre-calculated list
  const scenarios = exitScenarios.map((exitMonths, index) => {
    // Calculate scenario dynamically using the canonical function
    const scenarioResult = calculateExitScenario(
      exitMonths,
      basePrice,
      calculations.totalMonths,
      inputs,
      calculations.totalEntryCosts
    );
    
    const isHandover = exitMonths >= calculations.totalMonths;
    const dateStr = getDateFromMonths(exitMonths, inputs.bookingMonth, inputs.bookingYear);
    const constructionPct = Math.min(100, monthToConstruction(exitMonths, calculations.totalMonths));
    
    return {
      exitMonths,
      exitPrice: scenarioResult.exitPrice,
      totalCapitalDeployed: scenarioResult.totalCapital,
      trueProfit: scenarioResult.trueProfit,
      trueROE: scenarioResult.trueROE,
      annualizedROE: scenarioResult.annualizedROE,
      isHandover,
      dateStr,
      constructionPct,
      exitNumber: index + 1,
    };
  });
  
  // If all scenarios show 0 profit/capital, don't render the card
  const hasValidScenarios = scenarios.some(s => s.totalCapitalDeployed > 0 && s.exitPrice > 0);
  if (!hasValidScenarios) {
    return null;
  }

  return (
    <div 
      className={cn(
        "bg-theme-card border border-theme-border rounded-xl overflow-hidden flex flex-col",
        onClick && "cursor-pointer hover:border-primary/50 transition-colors"
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">{t('exitScenariosHeader')}</span>
        </div>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-theme-text-muted" />
        )}
      </div>
      
      {/* Scenarios List */}
      <div className="p-3 space-y-2 flex-1 overflow-auto">
        {scenarios.map((scenario) => {
          return (
            <Tooltip key={scenario.exitMonths}>
              <TooltipTrigger asChild>
                <div 
                  className="p-2.5 rounded-lg transition-colors bg-theme-bg/50 hover:bg-theme-border/30 border border-theme-border/30"
                >
                  {/* Top Row: Exit Number, Months, Date, Construction % */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-theme-accent bg-theme-accent/10 px-1.5 py-0.5 rounded">
                        #{scenario.exitNumber}
                      </span>
                      <Clock className="w-3 h-3 text-theme-text-muted" />
                      <span className="text-sm font-medium text-theme-text">
                        {scenario.exitMonths}m
                      </span>
                      <span className="text-xs text-theme-text-muted">
                        {scenario.dateStr}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Hammer className="w-3 h-3 text-orange-400" />
                      <span className="text-xs text-orange-400 font-medium">
                        {scenario.constructionPct.toFixed(0)}% {t('builtLabel')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Bottom Row: Capital Invested, Profit, Total ROE */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-theme-text flex items-center gap-0.5">
                        <DollarSign className="w-3 h-3 text-theme-text-muted" />
                        {formatCurrency(scenario.totalCapitalDeployed, 'AED', 1)}
                      </span>
                      <span className={cn(
                        "font-medium",
                        scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrency(scenario.trueProfit, 'AED', 1)}
                      </span>
                    </div>
                    <span className={cn(
                      "text-sm font-bold font-mono tabular-nums",
                      scenario.trueROE >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {scenario.trueROE?.toFixed(0) ?? 0}%
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs bg-theme-card border-theme-border">
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-theme-text">
                    {t('exitAtLabel')} {scenario.exitMonths}m ({scenario.dateStr})
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-theme-text-muted">{t('constructionTime')}:</span>
                    <span className="text-theme-text">{scenario.constructionPct.toFixed(0)}% {t('completeLabel')}</span>
                    <span className="text-theme-text-muted">{t('cashInvestedLabel')}:</span>
                    <span className="text-theme-text">{formatCurrency(scenario.totalCapitalDeployed, 'AED', 1)}</span>
                    <span className="text-theme-text-muted">{t('propertyValueLabel')}:</span>
                    <span className="text-theme-text">{formatCurrency(scenario.exitPrice, 'AED', 1)}</span>
                    <span className="text-theme-text-muted">{t('profit')}:</span>
                    <span className={scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400"}>
                      {formatCurrency(scenario.trueProfit, 'AED', 1)}
                    </span>
                    <span className="text-theme-text-muted">{t('totalROELabel') || 'Total ROE'}:</span>
                    <span className="font-bold text-theme-text">{scenario.trueROE?.toFixed(2) ?? 0}%</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Footer hint */}
      {onClick && (
        <div className="px-3 py-2 border-t border-theme-border/50 bg-theme-bg/30 flex-shrink-0">
          <span className="text-[10px] text-theme-text-muted">{t('clickForDetailsLong')}</span>
        </div>
      )}
    </div>
  );
};
