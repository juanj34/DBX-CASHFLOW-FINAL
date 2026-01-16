import { useState } from 'react';
import { CreditCard, Home, Clock, TrendingUp, ChevronRight, Trophy, Calendar } from 'lucide-react';
import { OIInputs, OICalculations } from '../useOICalculations';
import { Currency, formatCurrency } from '../currencyUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { calculateExitScenario, monthToConstruction } from '../constructionProgress';
import { cn } from '@/lib/utils';

interface SnapshotOverviewCardsProps {
  inputs: OIInputs;
  calculations: OICalculations;
  exitScenarios: number[];
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

export const SnapshotOverviewCards = ({
  inputs,
  calculations,
  exitScenarios,
  currency,
  rate,
}: SnapshotOverviewCardsProps) => {
  const [exitPopoverOpen, setExitPopoverOpen] = useState(false);
  
  const { basePrice, downpaymentPercent, preHandoverPercent, oqoodFee, rentalYieldPercent, serviceChargePerSqft = 18, unitSizeSqf = 0 } = inputs;
  
  // Calculate Cash to Start
  const downpaymentAmount = basePrice * (downpaymentPercent / 100);
  const dldFee = basePrice * 0.04;
  const cashToStart = downpaymentAmount + dldFee + oqoodFee;
  
  // Calculate Rental Income
  const grossAnnualRent = basePrice * (rentalYieldPercent / 100);
  const annualServiceCharges = unitSizeSqf * serviceChargePerSqft;
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const monthlyRent = netAnnualRent / 12;
  const netYieldPercent = basePrice > 0 ? (netAnnualRent / basePrice) * 100 : 0;
  
  // Calculate Breakeven
  const yearsToBreakeven = calculations.holdAnalysis?.yearsToPayOff || 0;
  
  // Calculate exit scenarios
  const scenarios = exitScenarios.map(exitMonths => {
    const result = calculateExitScenario(exitMonths, basePrice, calculations.totalMonths, inputs, calculations.totalEntryCosts);
    const constructionPercent = monthToConstruction(exitMonths, calculations.totalMonths);
    const isHandover = exitMonths >= calculations.totalMonths;
    const dateStr = getDateFromMonths(exitMonths, inputs.bookingMonth, inputs.bookingYear);
    
    return {
      exitMonths,
      ...result,
      constructionPercent,
      isHandover,
      dateStr,
    };
  });
  
  // Find best exit ROE
  const bestScenario = scenarios.reduce((best, current) => 
    current.annualizedROE > best.annualizedROE ? current : best
  , scenarios[0]);
  
  const handoverPercent = 100 - preHandoverPercent;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Card 1: Cash to Start */}
      <div className="bg-theme-card border border-theme-border rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <CreditCard className="w-3.5 h-3.5 text-theme-accent" />
          <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">Cash to Start</span>
        </div>
        <div className="text-lg font-bold text-theme-text font-mono tabular-nums">
          {formatCurrency(cashToStart, currency, rate)}
        </div>
        <div className="text-[10px] text-theme-text-muted mt-1">
          Downpayment + DLD + Fees
        </div>
        <div className="inline-flex items-center mt-2 px-1.5 py-0.5 rounded bg-theme-accent/10 border border-theme-accent/30">
          <span className="text-[9px] font-medium text-theme-accent">Plan: {preHandoverPercent}/{handoverPercent}</span>
        </div>
      </div>

      {/* Card 2: Rental Income */}
      <div className="bg-theme-card border border-theme-border rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Home className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">Rental Income</span>
        </div>
        <div className="text-lg font-bold text-theme-text font-mono tabular-nums">
          {formatCurrency(monthlyRent, currency, rate)}<span className="text-xs text-theme-text-muted">/mo</span>
        </div>
        <div className="text-[10px] text-theme-text-muted mt-1">
          {formatCurrency(netAnnualRent, currency, rate)}/year net
        </div>
        <div className="inline-flex items-center mt-2 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
          <span className="text-[9px] font-medium text-cyan-400">Yield: {netYieldPercent.toFixed(1)}%</span>
        </div>
      </div>

      {/* Card 3: Breakeven */}
      <div className="bg-theme-card border border-theme-border rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">Breakeven</span>
        </div>
        <div className="text-lg font-bold text-theme-text font-mono tabular-nums">
          {yearsToBreakeven < 999 ? `${yearsToBreakeven.toFixed(1)} years` : 'N/A'}
        </div>
        <div className="text-[10px] text-theme-text-muted mt-1">
          From rental income
        </div>
        <div className="inline-flex items-center mt-2 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">
          <span className="text-[9px] font-medium text-purple-400">Net Yield: {netYieldPercent.toFixed(1)}%</span>
        </div>
      </div>

      {/* Card 4: Best Exit - Clickable */}
      <Popover open={exitPopoverOpen} onOpenChange={setExitPopoverOpen}>
        <PopoverTrigger asChild>
          <div className="bg-theme-card border border-theme-border rounded-xl p-3 cursor-pointer hover:border-green-500/50 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">Best Exit</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-theme-text-muted group-hover:text-green-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-green-400 font-mono tabular-nums">
              {bestScenario?.annualizedROE.toFixed(1)}%<span className="text-xs text-theme-text-muted">/yr</span>
            </div>
            <div className="text-[10px] text-theme-text-muted mt-1">
              @ {bestScenario?.isHandover ? 'Handover' : bestScenario?.dateStr}
            </div>
            <div className="inline-flex items-center mt-2 px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/30">
              <span className="text-[9px] font-medium text-green-400">Click for all exits</span>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 bg-theme-card border-theme-border p-3" 
          side="bottom" 
          align="end"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-theme-border">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-theme-text">Exit Scenarios</span>
            </div>
            
            <div className="space-y-2">
              {scenarios.map((scenario) => {
                const isBest = scenario.annualizedROE === bestScenario?.annualizedROE && scenarios.length > 1;
                const badge = getRoeBadge(scenario.annualizedROE);
                
                return (
                  <div
                    key={scenario.exitMonths}
                    className={cn(
                      "p-2 rounded-lg border flex items-center justify-between",
                      isBest 
                        ? "bg-green-500/10 border-green-500/30" 
                        : "bg-theme-card-alt border-theme-border"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isBest && <Trophy className="w-3.5 h-3.5 text-yellow-500" />}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-theme-text-muted" />
                          <span className="text-xs font-medium text-theme-text">
                            {scenario.isHandover ? 'Handover' : scenario.dateStr}
                          </span>
                        </div>
                        <div className="text-[10px] text-theme-text-muted">
                          {formatMonths(scenario.exitMonths)} · {Math.round(scenario.constructionPercent)}% built
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-theme-text-muted">
                        {formatCurrency(scenario.exitPrice, currency, rate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "text-sm font-bold font-mono",
                          scenario.annualizedROE >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {scenario.annualizedROE.toFixed(1)}%
                        </span>
                        <span className={cn(
                          "text-[8px] px-1 py-0.5 rounded border",
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
        </PopoverContent>
      </Popover>
    </div>
  );
};
