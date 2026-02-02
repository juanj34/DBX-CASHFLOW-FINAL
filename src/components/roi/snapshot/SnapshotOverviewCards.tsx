import { CreditCard, Home, Clock, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { OIInputs, OICalculations } from '../useOICalculations';
import { Currency, formatDualCurrency } from '../currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';

interface SnapshotOverviewCardsProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
}

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
  currency,
  rate,
}: SnapshotOverviewCardsProps) => {
  const { t } = useLanguage();
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
  
  // Calculate Monthly Burn Rate
  // = (Downpayment + DLD + Oqood + Pre-Handover Installments) / Construction Months
  const preHandoverInstallments = (inputs.additionalPayments || []).reduce(
    (sum, m) => sum + (basePrice * m.paymentPercent / 100), 0
  );
  const totalPreHandoverCash = cashToStart + preHandoverInstallments;
  const monthlyBurnRate = calculations.totalMonths > 0 
    ? totalPreHandoverCash / calculations.totalMonths 
    : 0;
  
  const handoverPercent = 100 - preHandoverPercent;

  // Dual currency values
  const cashToStartDual = formatDualCurrency(cashToStart, currency, rate);
  const monthlyRentDual = formatDualCurrency(monthlyRent, currency, rate);
  const netAnnualRentDual = formatDualCurrency(netAnnualRent, currency, rate);
  const monthlyBurnDual = formatDualCurrency(monthlyBurnRate, currency, rate);

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
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">{t('cashToStartLabel')}</span>
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

        {/* Card 2: Rental Income - Year 1 */}
        <motion.div 
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-theme-card border border-theme-border rounded-xl p-3 h-[88px] flex flex-col"
        >
        <div className="flex items-center gap-1.5 mb-1">
            <Home className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">{t('rentalIncome')}</span>
            <span className="ml-auto text-[8px] text-cyan-400/70 bg-cyan-500/10 px-1.5 py-0.5 rounded">{netYieldPercent.toFixed(1)}% {t('netLabel')} {t('yieldShort')}</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-base font-bold text-theme-text font-mono tabular-nums leading-tight">
              {netAnnualRentDual.primary}<span className="text-[10px] text-theme-text-muted">/{t('yearShort')}</span>
            </div>
            <span className="text-[10px] text-theme-text-muted">{monthlyRentDual.primary}/{t('moShort')} • {t('year1Label')}</span>
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
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">{t('breakevenLabel')}</span>
            <span className="ml-auto text-[9px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{netYieldPercent.toFixed(1)}%</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-base font-bold text-theme-text font-mono tabular-nums leading-tight">
              {yearsToBreakeven < 999 ? `${yearsToBreakeven.toFixed(1)} ${t('yearsLabelLowercase')}` : 'N/A'}
            </div>
            <span className="text-[10px] text-theme-text-muted">{t('fromRentalIncomeLabel')}</span>
          </div>
        </motion.div>

        {/* Card 4: Monthly Burn Rate */}
        <motion.div 
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-theme-card border border-theme-border rounded-xl p-3 h-[88px] flex flex-col"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">{t('monthlyBurnLabel')}</span>
            <span className="ml-auto text-[9px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">{calculations.totalMonths}{t('moShort')}</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-base font-bold text-theme-text font-mono tabular-nums leading-tight">
              ~{monthlyBurnDual.primary}<span className="text-[10px] text-theme-text-muted">/{t('moShort')}</span>
            </div>
            {monthlyBurnDual.secondary && (
              <span className="text-[10px] text-theme-text-muted">{monthlyBurnDual.secondary}</span>
            )}
            <span className="text-[10px] text-theme-text-muted">{t('untilHandoverLabel')}</span>
          </div>
        </motion.div>
      </div>
    </>
  );
};
