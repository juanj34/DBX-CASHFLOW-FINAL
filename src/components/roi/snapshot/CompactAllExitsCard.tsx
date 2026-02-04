import { TrendingUp, Clock, ChevronRight, Hammer, Rocket, Shield, Key, ArrowRight } from 'lucide-react';
import { OIInputs, OICalculations } from '../useOICalculations';
import { Currency, formatCurrency, formatDualCurrency } from '../currencyUtils';
import { monthToConstruction, calculateExitScenario, isHandoverExit } from '../constructionProgress';
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

// Get phase label for post-handover exits
const getPostHandoverPhase = (monthsAfterHandover: number, growthPeriodYears: number): { 
  icon: React.ReactNode; 
  label: string; 
  color: string;
  bgColor: string;
} => {
  const yearsAfter = monthsAfterHandover / 12;
  if (yearsAfter <= growthPeriodYears) {
    return { 
      icon: <Rocket className="w-3 h-3" />, 
      label: 'Growth', 
      color: 'text-green-400',
      bgColor: 'bg-green-400/10'
    };
  }
  return { 
    icon: <Shield className="w-3 h-3" />, 
    label: 'Mature', 
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10'
  };
};

// Format post-handover offset nicely
const formatPostHandoverOffset = (monthsAfterHandover: number): string => {
  if (monthsAfterHandover >= 12 && monthsAfterHandover % 12 === 0) {
    return `+${monthsAfterHandover / 12}yr`;
  }
  return `+${monthsAfterHandover}mo`;
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
    
    const isPostHandover = exitMonths > calculations.totalMonths;
    const isHandover = isHandoverExit(exitMonths, calculations.totalMonths);
    const monthsAfterHandover = isPostHandover ? exitMonths - calculations.totalMonths : 0;
    const dateStr = getDateFromMonths(exitMonths, inputs.bookingMonth, inputs.bookingYear);
    const constructionPct = Math.min(100, monthToConstruction(exitMonths, calculations.totalMonths));
    
    // Get phase info for post-handover
    const phaseInfo = isPostHandover 
      ? getPostHandoverPhase(monthsAfterHandover, inputs.growthPeriodYears || 5)
      : null;
    
    return {
      exitMonths,
      exitPrice: scenarioResult.exitPrice,
      totalCapitalDeployed: scenarioResult.totalCapital,
      trueProfit: scenarioResult.trueProfit,
      trueROE: scenarioResult.trueROE,
      annualizedROE: scenarioResult.annualizedROE,
      isPostHandover,
      isHandover,
      monthsAfterHandover,
      phaseInfo,
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
      
      {/* Scenarios List - REDESIGNED with bigger numbers */}
      <div className="p-2 space-y-2 flex-1 overflow-auto">
        {scenarios.map((scenario) => {
          return (
            <Tooltip key={scenario.exitMonths}>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "p-3 rounded-xl transition-colors border",
                    scenario.isHandover 
                      ? "bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/15"
                      : scenario.isPostHandover 
                        ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10" 
                        : "bg-theme-bg/50 border-theme-border/30 hover:bg-theme-border/30"
                  )}
                >
                  {/* TOP: Timing & Status - Compact row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {scenario.isHandover ? (
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          🔑 Handover
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded-full">
                          #{scenario.exitNumber}
                        </span>
                      )}
                      <span className="text-sm font-medium text-theme-text">{scenario.exitMonths}m</span>
                      <span className="text-xs text-theme-text-muted">{scenario.dateStr}</span>
                    </div>
                    
                    {/* Status Badge */}
                    {scenario.isHandover ? (
                      <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">100% built</span>
                    ) : scenario.isPostHandover && scenario.phaseInfo ? (
                      <span className={cn("text-[10px] px-2 py-0.5 rounded flex items-center gap-1", scenario.phaseInfo.color, scenario.phaseInfo.bgColor)}>
                        {scenario.phaseInfo.icon}
                        {scenario.phaseInfo.label} {formatPostHandoverOffset(scenario.monthsAfterHandover)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded flex items-center gap-1">
                        <Hammer className="w-3 h-3" />
                        {scenario.constructionPct.toFixed(0)}% built
                      </span>
                    )}
                  </div>
                  
                  {/* HERO NUMBERS - Big and prominent */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {/* Profit */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-theme-text-muted uppercase tracking-wide block">Profit</span>
                      <span className={cn(
                        "text-lg font-bold font-mono block",
                        scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrency(scenario.trueProfit, 'AED' as Currency)}
                      </span>
                      {currency !== 'AED' && getDualValue(scenario.trueProfit).secondary && (
                        <span className="text-[10px] text-theme-text-muted">({getDualValue(scenario.trueProfit).secondary})</span>
                      )}
                    </div>
                    
                    {/* ROE */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-theme-text-muted uppercase tracking-wide block">ROE</span>
                      <span className={cn(
                        "text-2xl font-bold font-mono block",
                        scenario.trueROE >= 20 ? "text-green-400" : 
                        scenario.trueROE >= 10 ? "text-theme-accent" : 
                        scenario.trueROE >= 0 ? "text-amber-400" : "text-red-400"
                      )}>
                        {scenario.trueROE?.toFixed(0) ?? 0}%
                      </span>
                      <span className="text-[10px] text-theme-text-muted">{scenario.annualizedROE?.toFixed(1)}%/yr</span>
                    </div>
                    
                    {/* Time */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-theme-text-muted uppercase tracking-wide block">Hold</span>
                      <span className="text-lg font-bold font-mono text-theme-text block">
                        {scenario.exitMonths < 12 
                          ? `${scenario.exitMonths}m` 
                          : `${(scenario.exitMonths / 12).toFixed(1)}y`}
                      </span>
                      <span className="text-[10px] text-theme-text-muted">{scenario.dateStr}</span>
                    </div>
                  </div>
                  
                  {/* Bottom: Capital info - smaller text */}
                  <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-theme-border/20 text-[10px] text-theme-text-muted">
                    <span>Capital: {formatCurrency(scenario.totalCapitalDeployed, 'AED' as Currency)}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>Value: {formatCurrency(scenario.exitPrice, 'AED' as Currency)}</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs bg-theme-card border-theme-border">
                <div className="space-y-2 text-xs">
                  <p className="font-semibold text-theme-text">
                    Exit at {scenario.exitMonths}m ({scenario.dateStr})
                    {scenario.isPostHandover && scenario.phaseInfo && (
                      <span className={cn("ml-2", scenario.phaseInfo.color)}>
                        [{scenario.phaseInfo.label} Phase]
                      </span>
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <span className="text-theme-text-muted">Cash Invested:</span>
                    <span className="text-theme-text font-mono">
                      {getDualValue(scenario.totalCapitalDeployed).primary}
                      {currency !== 'AED' && getDualValue(scenario.totalCapitalDeployed).secondary && (
                        <span className="opacity-70 ml-1">({getDualValue(scenario.totalCapitalDeployed).secondary})</span>
                      )}
                    </span>
                    
                    <span className="text-theme-text-muted">Initial Value:</span>
                    <span className="text-theme-text font-mono">
                      {getDualValue(scenario.initialValue).primary}
                    </span>
                    
                    <span className="text-theme-text-muted">Exit Value:</span>
                    <span className="text-theme-text font-mono">
                      {getDualValue(scenario.exitPrice).primary}
                    </span>
                    
                    <span className="text-theme-text-muted">Profit:</span>
                    <span className={cn("font-mono", scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400")}>
                      {scenario.trueProfit >= 0 ? '+' : ''}{getDualValue(scenario.trueProfit).primary}
                    </span>
                    
                    <span className="text-theme-text-muted">Total ROE:</span>
                    <span className="font-bold text-theme-text">{scenario.trueROE?.toFixed(1)}%</span>
                    
                    <span className="text-theme-text-muted">Annualized:</span>
                    <span className="text-theme-accent font-bold">{scenario.annualizedROE?.toFixed(1)}%/yr</span>
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
