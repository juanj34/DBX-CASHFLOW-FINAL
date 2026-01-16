import { TrendingUp, Calendar, Trophy } from 'lucide-react';
import { Currency, formatCurrency } from '../currencyUtils';
import { OIInputs } from '../useOICalculations';
import { calculateExitScenario, monthToConstruction } from '../constructionProgress';
import { cn } from '@/lib/utils';

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

export const SnapshotExitCards = ({
  inputs,
  exitScenarios,
  basePrice,
  totalMonths,
  totalEntryCosts,
  currency,
  rate,
}: SnapshotExitCardsProps) => {
  // Calculate exit scenarios
  const scenarios = exitScenarios.map(exitMonths => {
    const result = calculateExitScenario(exitMonths, basePrice, totalMonths, inputs, totalEntryCosts);
    const constructionPercent = monthToConstruction(exitMonths, totalMonths);
    const isHandover = exitMonths >= totalMonths;
    const dateStr = getDateFromMonths(exitMonths, inputs.bookingMonth, inputs.bookingYear);
    
    return {
      exitMonths,
      ...result,
      constructionPercent,
      isHandover,
      dateStr,
    };
  });

  // Find best ROE
  const bestROE = Math.max(...scenarios.map(s => s.annualizedROE));

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

      {/* Exit Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {scenarios.map((scenario) => {
          const isBest = scenario.annualizedROE === bestROE && scenarios.length > 1;
          const badge = getRoeBadge(scenario.annualizedROE);
          
          return (
            <div
              key={scenario.exitMonths}
              className={cn(
                "relative p-3 rounded-xl border transition-all",
                isBest 
                  ? "bg-green-500/10 border-green-500/40" 
                  : "bg-theme-card-alt border-theme-border"
              )}
            >
              {/* Best Badge */}
              {isBest && (
                <div className="absolute -top-2 -right-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                </div>
              )}

              {/* Header: Date & Timeline */}
              <div className="flex items-center gap-1.5 mb-2">
                <Calendar className="w-3 h-3 text-theme-text-muted" />
                <span className="text-xs font-medium text-theme-text">
                  {scenario.isHandover ? 'Handover' : scenario.dateStr}
                </span>
              </div>
              
              {/* Timeline Info */}
              <div className="text-[10px] text-theme-text-muted mb-3">
                {formatMonths(scenario.exitMonths)} · {Math.round(scenario.constructionPercent)}% built
              </div>

              {/* Property Value */}
              <div className="mb-2">
                <div className="text-[10px] text-theme-text-muted uppercase tracking-wide">Property Value</div>
                <div className="text-sm font-bold text-theme-text font-mono tabular-nums">
                  {formatCurrency(scenario.exitPrice, currency, rate)}
                </div>
              </div>

              {/* ROE */}
              <div>
                <div className={cn(
                  "text-lg font-bold font-mono tabular-nums",
                  scenario.annualizedROE >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {scenario.annualizedROE.toFixed(1)}%
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-theme-text-muted">ROE/year</span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded border font-medium",
                    badge.className
                  )}>
                    {badge.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
