import { CreditCard, Home, Clock, TrendingUp, Trophy, Calendar } from 'lucide-react';
import { OIInputs, OICalculations } from '../useOICalculations';
import { Currency, formatCurrency, formatDualCurrency } from '../currencyUtils';
import { calculateExitScenario, monthToConstruction } from '../constructionProgress';
import { cn } from '@/lib/utils';
import { DottedRow } from './DottedRow';

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

  // Dual currency values
  const cashToStartDual = formatDualCurrency(cashToStart, currency, rate);
  const monthlyRentDual = formatDualCurrency(monthlyRent, currency, rate);
  const netAnnualRentDual = formatDualCurrency(netAnnualRent, currency, rate);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Card 1: Cash to Start */}
      <div className="bg-card border border-border rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <CreditCard className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Cash to Start</span>
        </div>
        <div className="text-lg font-bold text-foreground font-mono tabular-nums">
          {cashToStartDual.primary}
          {cashToStartDual.secondary && (
            <span className="text-muted-foreground text-xs ml-1">({cashToStartDual.secondary})</span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Downpayment + DLD + Fees
        </div>
        <div className="inline-flex items-center mt-2 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30">
          <span className="text-[9px] font-medium text-primary">Plan: {preHandoverPercent}/{handoverPercent}</span>
        </div>
      </div>

      {/* Card 2: Rental Income */}
      <div className="bg-card border border-border rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Home className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Rental Income</span>
        </div>
        <div className="text-lg font-bold text-foreground font-mono tabular-nums">
          {monthlyRentDual.primary}<span className="text-xs text-muted-foreground">/mo</span>
          {monthlyRentDual.secondary && (
            <span className="text-muted-foreground text-xs ml-1">({monthlyRentDual.secondary})</span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          {netAnnualRentDual.primary}/year net
        </div>
        <div className="inline-flex items-center mt-2 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
          <span className="text-[9px] font-medium text-cyan-400">Yield: {netYieldPercent.toFixed(1)}%</span>
        </div>
      </div>

      {/* Card 3: Breakeven */}
      <div className="bg-card border border-border rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Breakeven</span>
        </div>
        <div className="text-lg font-bold text-foreground font-mono tabular-nums">
          {yearsToBreakeven < 999 ? `${yearsToBreakeven.toFixed(1)} years` : 'N/A'}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          From rental income
        </div>
        <div className="inline-flex items-center mt-2 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">
          <span className="text-[9px] font-medium text-purple-400">Net Yield: {netYieldPercent.toFixed(1)}%</span>
        </div>
      </div>

      {/* Card 4: All Exit Scenarios (Inline) */}
      <div className="bg-card border border-border rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-green-400" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Exit Scenarios</span>
        </div>
        <div className="space-y-1.5">
          {scenarios.map((scenario, index) => {
            const isBest = scenario.annualizedROE === bestScenario?.annualizedROE && scenarios.length > 1;
            const exitPriceDual = formatDualCurrency(scenario.exitPrice, currency, rate);
            
            return (
              <div
                key={scenario.exitMonths}
                className={cn(
                  "flex items-center justify-between text-[10px]",
                  isBest && "text-green-400"
                )}
              >
                <div className="flex items-center gap-1">
                  {isBest && <Trophy className="w-2.5 h-2.5 text-yellow-500" />}
                  <Calendar className="w-2.5 h-2.5 text-muted-foreground" />
                  <span className={cn("text-muted-foreground", isBest && "text-green-400")}>
                    {scenario.isHandover ? 'Handover' : scenario.dateStr}
                  </span>
                </div>
                <span className={cn(
                  "font-mono tabular-nums font-semibold",
                  scenario.annualizedROE >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {scenario.annualizedROE.toFixed(0)}%/yr
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 pt-1.5 border-t border-border">
          <DottedRow 
            label="Best Value" 
            value={formatCurrency(bestScenario?.exitPrice || 0, currency, rate)}
            className="text-[10px]"
            labelClassName="text-[10px]"
            valueClassName="text-[10px] text-green-400"
          />
        </div>
      </div>
    </div>
  );
};
