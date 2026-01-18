import { CreditCard, Home, Clock, TrendingUp } from 'lucide-react';
import { OIInputs, OICalculations } from '../useOICalculations';
import { Currency, formatCurrency, formatDualCurrency } from '../currencyUtils';
import { calculateExitScenario, monthToConstruction } from '../constructionProgress';

interface SnapshotOverviewCardsProps {
  inputs: OIInputs;
  calculations: OICalculations;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
}

const getDateFromMonths = (months: number, bookingMonth: number, bookingYear: number): string => {
  const totalMonthsFromJan = bookingMonth + months;
  const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
  const month = ((totalMonthsFromJan - 1) % 12) + 1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]} ${bookingYear + yearOffset}`;
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
      <div className="bg-theme-card border border-theme-border rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <CreditCard className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">Cash to Start</span>
        </div>
        <div className="text-lg font-bold text-theme-text font-mono tabular-nums">
          {cashToStartDual.primary}
          {cashToStartDual.secondary && (
            <span className="text-theme-text-muted text-xs ml-1">({cashToStartDual.secondary})</span>
          )}
        </div>
        <div className="text-[10px] text-theme-text-muted mt-1">
          Downpayment + DLD + Fees
        </div>
        <div className="inline-flex items-center mt-2 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30">
          <span className="text-[9px] font-medium text-primary">Plan: {preHandoverPercent}/{handoverPercent}</span>
        </div>
      </div>

      {/* Card 2: Rental Income */}
      <div className="bg-theme-card border border-theme-border rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Home className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">Rental Income</span>
        </div>
        <div className="text-lg font-bold text-theme-text font-mono tabular-nums">
          {monthlyRentDual.primary}<span className="text-xs text-theme-text-muted">/mo</span>
          {monthlyRentDual.secondary && (
            <span className="text-theme-text-muted text-xs ml-1">({monthlyRentDual.secondary})</span>
          )}
        </div>
        <div className="text-[10px] text-theme-text-muted mt-1">
          {netAnnualRentDual.primary}/year net
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

      {/* Card 4: Exit Scenarios - Larger, More Imposing */}
      <div className="bg-theme-card border border-theme-border rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-xs text-theme-text-muted uppercase tracking-wide font-semibold">
            Exit Scenarios
          </span>
        </div>
        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <div
              key={scenario.exitMonths}
              className="bg-theme-bg/50 rounded-lg p-2.5 border border-theme-border/50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-theme-text-muted font-medium">
                  {scenario.isHandover ? 'Handover' : `Month ${scenario.exitMonths}`}
                </span>
                <span className="text-[10px] text-theme-text-muted">{scenario.dateStr}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tabular-nums text-theme-text">
                  {formatCurrency(scenario.exitPrice, currency, rate)}
                </span>
                <span className="text-lg font-bold font-mono tabular-nums text-green-400">
                  {scenario.trueROE.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
