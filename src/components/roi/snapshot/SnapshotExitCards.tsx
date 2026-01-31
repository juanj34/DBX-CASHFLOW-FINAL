import { useState } from 'react';
import { TrendingUp, Calendar, Trophy, Building2, Rocket, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Currency, formatCurrency } from '../currencyUtils';
import { OIInputs } from '../useOICalculations';
import { calculateExitScenario, monthToConstruction } from '../constructionProgress';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface SnapshotExitCardsProps {
  inputs: OIInputs;
  exitScenarios: number[];
  basePrice: number;
  totalMonths: number;
  totalEntryCosts: number;
  currency: Currency;
  rate: number;
}

const formatMonths = (months: number): string => {
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years}y`;
    return `${years}y ${remainingMonths}m`;
  }
  return `${months}m`;
};

const getDateFromMonths = (months: number, bookingMonth: number, bookingYear: number): string => {
  const totalMonthsFromJan = bookingMonth + months;
  const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
  const month = ((totalMonthsFromJan - 1) % 12) + 1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]} ${bookingYear + yearOffset}`;
};

const getRoeBadge = (annualizedROE: number): { label: string; className: string } => {
  if (annualizedROE >= 25) return { label: 'Excellent', className: 'bg-green-500/20 text-green-400 border-green-500/30' };
  if (annualizedROE >= 15) return { label: 'Good', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  if (annualizedROE >= 10) return { label: 'Fair', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  return { label: 'Low', className: 'bg-red-500/20 text-red-400 border-red-500/30' };
};

// Get phase label for post-handover exits
const getPostHandoverPhase = (monthsAfterHandover: number, growthPeriodYears: number): { 
  icon: React.ReactNode; 
  label: string; 
  color: string;
} => {
  const yearsAfter = monthsAfterHandover / 12;
  if (yearsAfter <= growthPeriodYears) {
    return { 
      icon: <Rocket className="w-3.5 h-3.5" />, 
      label: 'Growth', 
      color: 'text-green-400'
    };
  }
  return { 
    icon: <Shield className="w-3.5 h-3.5" />, 
    label: 'Mature', 
    color: 'text-blue-400'
  };
};

// Format post-handover offset
const formatPostHandoverOffset = (monthsAfterHandover: number): string => {
  if (monthsAfterHandover >= 12 && monthsAfterHandover % 12 === 0) {
    return `+${monthsAfterHandover / 12}yr`;
  }
  return `+${monthsAfterHandover}mo`;
};

export const SnapshotExitCards = ({
  inputs,
  exitScenarios,
  basePrice,
  totalMonths,
  totalEntryCosts,
  currency,
  rate,
}: SnapshotExitCardsProps) => {
  const [activeTab, setActiveTab] = useState('0');

  // Calculate exit scenarios
  const scenarios = exitScenarios.map(exitMonths => {
    const result = calculateExitScenario(exitMonths, basePrice, totalMonths, inputs, totalEntryCosts);
    const constructionPercent = monthToConstruction(exitMonths, totalMonths);
    const isPostHandover = exitMonths > totalMonths;
    const monthsAfterHandover = isPostHandover ? exitMonths - totalMonths : 0;
    const dateStr = getDateFromMonths(exitMonths, inputs.bookingMonth, inputs.bookingYear);
    const phase = isPostHandover 
      ? getPostHandoverPhase(monthsAfterHandover, inputs.growthPeriodYears || 5)
      : null;
    
    return {
      exitMonths,
      ...result,
      constructionPercent,
      isPostHandover,
      monthsAfterHandover,
      phase,
      dateStr,
    };
  });

  // Find best ROE index
  const bestROE = Math.max(...scenarios.map(s => s.annualizedROE));
  const bestIndex = scenarios.findIndex(s => s.annualizedROE === bestROE);

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-theme-accent/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-theme-accent" />
        </div>
        <h3 className="text-sm font-semibold text-theme-text uppercase tracking-wide">
          Exit Strategy
        </h3>
      </div>

      {/* Tabs for Exit Scenarios */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 gap-1 bg-theme-bg/50 p-1 rounded-lg mb-4">
          {scenarios.map((scenario, index) => {
            const isBest = index === bestIndex && scenarios.length > 1;
            return (
              <TabsTrigger
                key={index}
                value={String(index)}
                className={cn(
                  "relative text-sm font-bold py-2 rounded-md transition-all data-[state=active]:bg-theme-card data-[state=active]:shadow-sm",
                  isBest && "text-yellow-500"
                )}
              >
                {index + 1}
                {isBest && (
                  <Trophy className="w-3 h-3 absolute -top-1 -right-1 text-yellow-500" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <AnimatePresence mode="wait">
          {scenarios.map((scenario, index) => {
            const isBest = index === bestIndex && scenarios.length > 1;
            const badge = getRoeBadge(scenario.annualizedROE);

            return (
              <TabsContent key={index} value={String(index)} className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "p-4 rounded-xl border",
                    isBest 
                      ? "bg-green-500/10 border-green-500/40" 
                      : "bg-theme-card-alt border-theme-border"
                  )}
                >
                  {/* Best Badge */}
                  {isBest && (
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wide">
                        Best Exit
                      </span>
                    </div>
                  )}

                  {/* Date & Timeline Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-theme-text-muted" />
                      <span className="text-base font-semibold text-theme-text">
                        {scenario.isPostHandover 
                          ? formatPostHandoverOffset(scenario.monthsAfterHandover)
                          : scenario.dateStr
                        }
                      </span>
                    </div>
                    {/* Show phase for post-handover, construction % for pre-handover */}
                    {scenario.isPostHandover && scenario.phase ? (
                      <div className={cn("flex items-center gap-2 text-xs", scenario.phase.color)}>
                        {scenario.phase.icon}
                        <span>{scenario.phase.label} Phase</span>
                        <span className="text-theme-border">•</span>
                        <span>{formatMonths(scenario.exitMonths)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{Math.round(scenario.constructionPercent)}% built</span>
                        <span className="text-theme-border">•</span>
                        <span>{formatMonths(scenario.exitMonths)}</span>
                      </div>
                    )}
                  </div>

                  {/* Property Value */}
                  <div className="mb-4">
                    <div className="text-[10px] text-theme-text-muted uppercase tracking-wide mb-1">
                      Property Value
                    </div>
                    <div className="text-xl font-bold text-theme-text font-mono tabular-nums">
                      {formatCurrency(scenario.exitPrice, 'AED', 1)}
                    </div>
                    {currency !== 'AED' && (
                      <div className="text-sm text-theme-text-muted font-mono tabular-nums">
                        {formatCurrency(scenario.exitPrice, currency, rate)}
                      </div>
                    )}
                  </div>

                  {/* ROE & Profit Row */}
                  <div className="flex items-end justify-between">
                    <div>
                      <div className={cn(
                        "text-2xl font-bold font-mono tabular-nums",
                        scenario.annualizedROE >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {scenario.annualizedROE.toFixed(1)}%
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-theme-text-muted">ROE/year</span>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded border font-medium",
                          badge.className
                        )}>
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    {/* Profit */}
                    <div className="text-right">
                      <div className="text-[10px] text-theme-text-muted uppercase tracking-wide mb-1">
                        Profit
                      </div>
                      <div className={cn(
                        "text-lg font-bold font-mono tabular-nums",
                        scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrency(scenario.trueProfit, 'AED', 1)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            );
          })}
        </AnimatePresence>
      </Tabs>
    </div>
  );
};
