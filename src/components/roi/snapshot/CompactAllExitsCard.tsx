import { TrendingUp, Clock, ChevronRight, Hammer } from 'lucide-react';
import { OIInputs, OICalculations } from '../useOICalculations';
import { Currency, formatCurrency, formatDualCurrency } from '../currencyUtils';
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
  
  // Dual currency helper
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };
  
  // Format compact (K/M) for property values
  const formatCompact = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    return `${(value / 1000).toFixed(0)}K`;
  };
  
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
      initialValue: basePrice,
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
      <div className="p-3 space-y-2.5 flex-1 overflow-auto">
        {scenarios.map((scenario) => {
          return (
            <Tooltip key={scenario.exitMonths}>
              <TooltipTrigger asChild>
                <div 
                  className="p-2.5 rounded-lg transition-colors bg-theme-bg/50 hover:bg-theme-border/30 border border-theme-border/30"
                >
                  {/* Top Row: Exit Number, Months, Date, Construction % */}
                  <div className="flex items-center justify-between mb-2">
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
                  
                  {/* Clear labeled metrics */}
                  <div className="space-y-1 text-xs">
                    {/* Row 1: Capital Invested */}
                    <div className="flex items-center justify-between">
                      <span className="text-theme-text-muted">{t('cashInvestedLabel')}:</span>
                      <span className="text-theme-text font-mono">
                        {getDualValue(scenario.totalCapitalDeployed).primary}
                        {currency !== 'AED' && getDualValue(scenario.totalCapitalDeployed).secondary && (
                          <span className="text-theme-text-muted ml-1">({getDualValue(scenario.totalCapitalDeployed).secondary})</span>
                        )}
                      </span>
                    </div>
                    
                    {/* Row 2: Property Value (Initial → Current) */}
                    <div className="flex items-center justify-between">
                      <span className="text-theme-text-muted">{t('propertyValueLabel')}:</span>
                      <span className="text-theme-text font-mono">
                        <span className="text-theme-text-muted">{formatCompact(scenario.initialValue)}</span>
                        <span className="text-theme-text-muted mx-1">→</span>
                        <span className="text-theme-text">{formatCompact(scenario.exitPrice)}</span>
                        {currency !== 'AED' && (
                          <span className="text-theme-text-muted ml-1">({formatCurrency(scenario.exitPrice, currency, rate)})</span>
                        )}
                      </span>
                    </div>
                    
                    {/* Row 3: Profit + ROE */}
                    <div className="flex items-center justify-between">
                      <span className="text-theme-text-muted">{t('profit')}:</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-mono font-medium",
                          scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {scenario.trueProfit >= 0 ? '+' : ''}{getDualValue(scenario.trueProfit).primary}
                          {currency !== 'AED' && getDualValue(scenario.trueProfit).secondary && (
                            <span className="opacity-70 ml-1">({getDualValue(scenario.trueProfit).secondary})</span>
                          )}
                        </span>
                        <span className={cn(
                          "font-bold font-mono px-1.5 py-0.5 rounded text-[10px]",
                          scenario.trueROE >= 0 ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                        )}>
                          {scenario.trueROE?.toFixed(0) ?? 0}% ROE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs bg-theme-card border-theme-border">
                <div className="space-y-2 text-xs">
                  <p className="font-semibold text-theme-text">
                    {t('exitAtLabel')} {scenario.exitMonths}m ({scenario.dateStr})
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <span className="text-theme-text-muted">{t('constructionTime')}:</span>
                    <span className="text-theme-text">{scenario.constructionPct.toFixed(0)}% {t('completeLabel')}</span>
                    
                    <span className="text-theme-text-muted">{t('cashInvestedLabel')}:</span>
                    <span className="text-theme-text">
                      {getDualValue(scenario.totalCapitalDeployed).primary}
                      {currency !== 'AED' && getDualValue(scenario.totalCapitalDeployed).secondary && (
                        <span className="opacity-70 ml-1">({getDualValue(scenario.totalCapitalDeployed).secondary})</span>
                      )}
                    </span>
                    
                    <span className="text-theme-text-muted">{t('initialValueLabel')}:</span>
                    <span className="text-theme-text">
                      {getDualValue(scenario.initialValue).primary}
                      {currency !== 'AED' && getDualValue(scenario.initialValue).secondary && (
                        <span className="opacity-70 ml-1">({getDualValue(scenario.initialValue).secondary})</span>
                      )}
                    </span>
                    
                    <span className="text-theme-text-muted">{t('currentValueLabel')}:</span>
                    <span className="text-theme-text">
                      {getDualValue(scenario.exitPrice).primary}
                      {currency !== 'AED' && getDualValue(scenario.exitPrice).secondary && (
                        <span className="opacity-70 ml-1">({getDualValue(scenario.exitPrice).secondary})</span>
                      )}
                    </span>
                    
                    <span className="text-theme-text-muted">{t('profit')}:</span>
                    <span className={scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400"}>
                      {getDualValue(scenario.trueProfit).primary}
                      {currency !== 'AED' && getDualValue(scenario.trueProfit).secondary && (
                        <span className="opacity-70 ml-1">({getDualValue(scenario.trueProfit).secondary})</span>
                      )}
                    </span>
                    
                    <span className="text-theme-text-muted">{t('totalROELabel')}:</span>
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
