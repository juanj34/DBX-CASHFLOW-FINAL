import { useState } from 'react';
import { CreditCard, Home, Clock, TrendingUp, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { OIInputs, OICalculations } from '../useOICalculations';
import { Currency, formatCurrency, formatDualCurrency } from '../currencyUtils';
import { calculateExitScenario, monthToConstruction } from '../constructionProgress';
import { ExitChartModal } from './ExitChartModal';
import { Button } from '@/components/ui/button';

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

// Animation variants for staggered entrance
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut" as const
    }
  })
};

export const SnapshotOverviewCards = ({
  inputs,
  calculations,
  exitScenarios,
  currency,
  rate,
}: SnapshotOverviewCardsProps) => {
  const [activeExitIndex, setActiveExitIndex] = useState(0);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  
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
  
  const activeScenario = scenarios[activeExitIndex];
  const handoverPercent = 100 - preHandoverPercent;

  // Navigation functions
  const goNext = () => setActiveExitIndex((i) => (i + 1) % scenarios.length);
  const goPrev = () => setActiveExitIndex((i) => (i - 1 + scenarios.length) % scenarios.length);

  // Dual currency values
  const cashToStartDual = formatDualCurrency(cashToStart, currency, rate);
  const monthlyRentDual = formatDualCurrency(monthlyRent, currency, rate);
  const netAnnualRentDual = formatDualCurrency(netAnnualRent, currency, rate);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Cash to Start */}
        <motion.div 
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-theme-card border border-theme-border rounded-xl p-3 h-[88px] flex flex-col"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <CreditCard className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">Cash to Start</span>
            <span className="ml-auto text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">{preHandoverPercent}/{handoverPercent}</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-base font-bold text-theme-text font-mono tabular-nums leading-tight">
              {cashToStartDual.primary}
            </div>
            {cashToStartDual.secondary && (
              <span className="text-[10px] text-theme-text-muted">{cashToStartDual.secondary}</span>
            )}
          </div>
        </motion.div>

        {/* Card 2: Rental Income */}
        <motion.div 
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-theme-card border border-theme-border rounded-xl p-3 h-[88px] flex flex-col"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Home className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">Rental Income</span>
            <span className="ml-auto text-[9px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">{netYieldPercent.toFixed(1)}%</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-base font-bold text-theme-text font-mono tabular-nums leading-tight">
              {monthlyRentDual.primary}<span className="text-[10px] text-theme-text-muted">/mo</span>
            </div>
            <span className="text-[10px] text-theme-text-muted">{netAnnualRentDual.primary}/year</span>
          </div>
        </motion.div>

        {/* Card 3: Breakeven */}
        <motion.div 
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-theme-card border border-theme-border rounded-xl p-3 h-[88px] flex flex-col"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">Breakeven</span>
            <span className="ml-auto text-[9px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{netYieldPercent.toFixed(1)}%</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-base font-bold text-theme-text font-mono tabular-nums leading-tight">
              {yearsToBreakeven < 999 ? `${yearsToBreakeven.toFixed(1)} years` : 'N/A'}
            </div>
            <span className="text-[10px] text-theme-text-muted">From rental income</span>
          </div>
        </motion.div>

        {/* Card 4: Exit Scenarios - Carousel */}
        <motion.div 
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-theme-card border border-theme-border rounded-xl p-3 h-[88px] flex flex-col"
        >
          {/* Header with navigation and chart button */}
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">Exit</span>
            <div className="ml-auto flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-theme-text-muted hover:text-theme-text p-0"
                onClick={() => setExitModalOpen(true)}
              >
                <BarChart3 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-theme-text-muted hover:text-theme-text p-0"
                onClick={goPrev}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-theme-text-muted hover:text-theme-text p-0"
                onClick={goNext}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Carousel Content - Compact */}
          {activeScenario && (
            <div className="flex-1 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-theme-text-muted">
                  {activeScenario.isHandover ? 'Handover' : `Month ${activeScenario.exitMonths}`} • {activeScenario.dateStr}
                </span>
                <span className="text-xs font-mono tabular-nums text-theme-text">
                  {formatCurrency(activeScenario.exitPrice, currency, rate)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono tabular-nums text-green-400 leading-none">
                  {activeScenario.trueROE.toFixed(0)}%
                </div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {scenarios.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveExitIndex(index)}
                      className={`w-1 h-1 rounded-full transition-colors ${
                        index === activeExitIndex 
                          ? 'bg-green-400' 
                          : 'bg-theme-border hover:bg-theme-text-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Exit Chart Modal */}
      <ExitChartModal
        open={exitModalOpen}
        onOpenChange={setExitModalOpen}
        inputs={inputs}
        exitScenarios={exitScenarios}
        totalMonths={calculations.totalMonths}
        basePrice={calculations.basePrice}
        totalEntryCosts={calculations.totalEntryCosts}
        currency={currency}
        rate={rate}
      />
    </>
  );
};
