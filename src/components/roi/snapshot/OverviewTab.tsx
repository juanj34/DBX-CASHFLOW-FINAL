import { useMemo } from 'react';
import { Percent, CreditCard, Clock, BarChart3, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { OIInputs, OICalculations } from '../useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '../useMortgageCalculations';
import { Currency, formatDualCurrency, formatCurrency } from '../currencyUtils';
import { ClientUnitData } from '../ClientUnitInfo';
import { InvestmentRoadmap } from './InvestmentRoadmap';
import { CompactExitGraphCard } from './CompactExitGraphCard';
import { useLanguage } from '@/contexts/LanguageContext';

interface OverviewTabProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientUnitData;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
  onViewWealthProjection?: () => void;
  onTabChange?: (tab: string) => void;
}

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const }
  })
};

export const OverviewTab = ({
  inputs,
  calculations,
  clientInfo,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  currency,
  rate,
  onViewWealthProjection,
  onTabChange,
}: OverviewTabProps) => {
  const { language, t } = useLanguage();
  const { basePrice, downpaymentPercent, preHandoverPercent, oqoodFee, rentalYieldPercent, serviceChargePerSqft = 18, rentGrowthRate = 4 } = inputs;
  const unitSizeSqf = clientInfo.unitSizeSqf || inputs.unitSizeSqf || 0;

  // === KPI Calculations ===
  const downpaymentAmount = basePrice * (downpaymentPercent / 100);
  const dldFee = basePrice * 0.04;
  const cashToStart = downpaymentAmount + dldFee + oqoodFee;

  const grossAnnualRent = basePrice * (rentalYieldPercent / 100);
  const annualServiceCharges = unitSizeSqf * serviceChargePerSqft;
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const monthlyRent = netAnnualRent / 12;
  const netYieldPercent = basePrice > 0 ? (netAnnualRent / basePrice) * 100 : 0;

  const handoverPercent = inputs.hasPostHandoverPlan ? (inputs.onHandoverPercent || 0) : (100 - preHandoverPercent);

  // Breakeven
  const yearsToBreakeven = calculations.holdAnalysis?.yearsToBreakEven || 0;

  // Payment plan split label
  const planSplitLabel = useMemo(() => {
    if (inputs.hasPostHandoverPlan) {
      const postPercent = (inputs.postHandoverPayments || []).reduce((s, p) => s + p.paymentPercent, 0);
      const prePercent = 100 - handoverPercent - postPercent;
      return `${prePercent}/${handoverPercent}/${postPercent}`;
    }
    return `${preHandoverPercent}/${handoverPercent}`;
  }, [inputs, preHandoverPercent, handoverPercent]);

  // Show exit graph?
  const showExitGraph = inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0 && calculations.basePrice > 0;

  // Dual currency helpers
  const cashDual = formatDualCurrency(cashToStart, currency, rate);
  const rentDual = formatDualCurrency(netAnnualRent, currency, rate);
  const monthlyRentDual = formatDualCurrency(monthlyRent, currency, rate);
  return (
    <div className="space-y-4">
      {/* === Section A: 3 KPI Cards — Net Yield first === */}
      <div className="grid grid-cols-3 gap-3">
        {/* Net Yield (PROMINENT) */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-theme-card border border-theme-accent/30 rounded-xl p-3 h-[88px] flex flex-col"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Percent className="w-3.5 h-3.5 text-theme-accent" />
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">{t('netLabel')} {t('yieldShort')}</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-xl font-bold text-theme-accent font-mono tabular-nums leading-tight">
              {netYieldPercent.toFixed(1)}%
            </div>
            <span className="text-[10px] text-theme-text-muted">
              {monthlyRentDual.primary}/{t('moShort')} · {rentDual.primary}/{t('yearShort')}
            </span>
          </div>
        </motion.div>

        {/* Cash to Start */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-theme-card border border-theme-border rounded-xl p-3 h-[88px] flex flex-col"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <CreditCard className="w-3.5 h-3.5 text-theme-accent" />
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">{t('cashToStartLabel')}</span>
            <span className="ml-auto text-[9px] text-theme-accent bg-theme-accent/10 px-1.5 py-0.5 rounded">{planSplitLabel}</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-base font-bold text-theme-text font-mono tabular-nums leading-tight">
              {cashDual.primary}
            </div>
            {cashDual.secondary && (
              <span className="text-[10px] text-theme-text-muted">{cashDual.secondary}</span>
            )}
          </div>
        </motion.div>

        {/* Breakeven */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-theme-card border border-theme-border rounded-xl p-3 h-[88px] flex flex-col"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-theme-accent" />
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">{t('breakevenLabel')}</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-base font-bold text-theme-text font-mono tabular-nums leading-tight">
              {yearsToBreakeven < 999 ? `${yearsToBreakeven.toFixed(1)} ${language === 'es' ? 'anos' : 'yrs'}` : 'N/A'}
            </div>
            <span className="text-[10px] text-theme-text-muted">{t('fromRentalIncomeLabel')}</span>
          </div>
        </motion.div>
      </div>

      {/* === Section B & C: Roadmap + Exit Graph side-by-side === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Investment Roadmap */}
        <InvestmentRoadmap
          inputs={inputs}
          currency={currency}
          rate={rate}
          totalMonths={calculations.totalMonths}
          onViewPayments={onTabChange ? () => onTabChange('payments') : undefined}
        />

        {/* Asset Value Growth (reuse existing component) */}
        {showExitGraph ? (
          <CompactExitGraphCard
            inputs={inputs}
            calculations={calculations}
            exitScenarios={exitScenarios}
            currency={currency}
            rate={rate}
          />
        ) : (
          /* Placeholder when no exit graph */
          <div className="bg-theme-card border border-theme-border rounded-xl p-4 flex items-center justify-center">
            <p className="text-sm text-theme-text-muted">
              {language === 'es' ? 'Habilita la estrategia de salida para ver la proyeccion' : 'Enable exit strategy to view value projection'}
            </p>
          </div>
        )}
      </div>

      {/* === Section D: Key Metrics Grid === */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Service Charges */}
        <div className="bg-theme-card border border-theme-border rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <DollarSign className="w-3.5 h-3.5 text-theme-text-muted" />
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">
              {language === 'es' ? 'Cargos Servicio' : 'Service Charges'}
            </span>
          </div>
          <div className="text-base font-bold text-theme-text font-mono">
            {formatDualCurrency(annualServiceCharges, currency, rate).primary}<span className="text-[10px] text-theme-text-muted">/{t('yearShort')}</span>
          </div>
          <span className="text-[10px] text-theme-text-muted">
            {serviceChargePerSqft} AED/sqft
          </span>
        </div>

        {/* DLD + Oqood */}
        <div className="bg-theme-card border border-theme-border rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-theme-accent" />
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wide">
              {language === 'es' ? 'Costos de Registro' : 'Registration Costs'}
            </span>
          </div>
          <div className="text-base font-bold text-theme-text font-mono">
            {formatDualCurrency(dldFee + oqoodFee, currency, rate).primary}
          </div>
          <span className="text-[10px] text-theme-text-muted">
            DLD 4% + Oqood
          </span>
        </div>
      </div>

    </div>
  );
};
