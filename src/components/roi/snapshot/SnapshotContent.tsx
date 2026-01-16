import { useState, useMemo } from 'react';
import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '@/components/roi/useMortgageCalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { calculateExitScenario } from '@/components/roi/constructionProgress';
import {
  SnapshotHeader,
  ClientUnitTable,
  EquitySummaryCard,
  CompactExitCards,
  InitialCostTable,
  MilestoneTable,
  IncomeProjectionTable,
  AnnualCashflowRow,
  MortgageSection,
  ValueDifferentiatorsBadges,
  ExitChartModal,
  RentalComparisonModal,
} from '@/components/roi/snapshot';

interface SnapshotContentProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientUnitData;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  quoteImages: {
    heroImageUrl: string | null;
    floorPlanUrl: string | null;
  };
  currency: Currency;
  rate: number;
  brokerInfo: {
    name?: string | null;
    avatarUrl?: string | null;
  };
  onCurrencyChange?: (currency: Currency) => void;
}

export const SnapshotContent = ({
  inputs,
  calculations,
  clientInfo,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  quoteImages,
  currency,
  rate,
  brokerInfo,
  onCurrencyChange,
}: SnapshotContentProps) => {
  // Modals
  const [showExitModal, setShowExitModal] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);

  // Calculate exit scenarios data
  const exitScenariosData = useMemo(() => {
    return exitScenarios.map(months => ({
      exitMonths: months,
      ...calculateExitScenario(months, calculations.basePrice, calculations.totalMonths, inputs, calculations.totalEntryCosts)
    }));
  }, [exitScenarios, inputs, calculations]);

  const basePrice = calculations.basePrice;
  const downpayment = basePrice * inputs.downpaymentPercent / 100;
  const handoverPercent = 100 - inputs.preHandoverPercent;
  const handoverPayment = basePrice * handoverPercent / 100;
  const installmentsTotal = inputs.additionalPayments.reduce((sum, p) => sum + (basePrice * p.paymentPercent / 100), 0);
  const dldFee = basePrice * 0.04;
  const appreciationBonus = inputs.valueDifferentiators?.length ? Math.min(inputs.valueDifferentiators.length * 0.3, 2) : 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <SnapshotHeader
          projectName={clientInfo.projectName}
          developer={clientInfo.developer}
          heroImageUrl={quoteImages.heroImageUrl}
          floorPlanUrl={quoteImages.floorPlanUrl}
          brokerName={brokerInfo.name || undefined}
          brokerAvatarUrl={brokerInfo.avatarUrl}
        />
        
        {/* Top Section: 3 columns */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <ClientUnitTable
            clientInfo={clientInfo}
            basePrice={basePrice}
            currency={currency}
            rate={rate}
            onCurrencyChange={onCurrencyChange}
          />
          <EquitySummaryCard
            downpayment={downpayment}
            installmentsTotal={installmentsTotal}
            handoverPayment={handoverPayment}
            entryCosts={calculations.totalEntryCosts}
            currency={currency}
            rate={rate}
          />
          <CompactExitCards
            exitScenarios={exitScenariosData}
            totalMonths={calculations.totalMonths}
            currency={currency}
            rate={rate}
            onClick={() => setShowExitModal(true)}
          />
        </div>
        
        {/* Section A: Initial Costs */}
        <div className="mb-6">
          <InitialCostTable
            eoiFee={inputs.eoiFee}
            downpaymentPercent={inputs.downpaymentPercent}
            basePrice={basePrice}
            dldFee={dldFee}
            oqoodFee={inputs.oqoodFee}
            currency={currency}
            rate={rate}
          />
        </div>
        
        {/* Section B: Milestones */}
        <div className="mb-6">
          <MilestoneTable
            inputs={inputs}
            basePrice={basePrice}
            totalMonths={calculations.totalMonths}
            exitScenarios={exitScenarios}
            currency={currency}
            rate={rate}
          />
        </div>
        
        {/* Section C: Income Projection */}
        <div className="mb-6">
          <IncomeProjectionTable
            holdAnalysis={calculations.holdAnalysis}
            inputs={inputs}
            basePrice={basePrice}
            currency={currency}
            rate={rate}
            onCompareClick={inputs.showAirbnbComparison ? () => setShowRentalModal(true) : undefined}
          />
        </div>
        
        {/* Annual Cashflow */}
        <div className="mb-6">
          <AnnualCashflowRow
            yearlyProjections={calculations.yearlyProjections}
            currency={currency}
            rate={rate}
          />
        </div>
        
        {/* Mortgage Section (if enabled) */}
        {mortgageInputs.enabled && (
          <div className="mb-6">
            <MortgageSection
              mortgageAnalysis={mortgageAnalysis}
              currency={currency}
              rate={rate}
            />
          </div>
        )}
        
        {/* Value Differentiators */}
        {inputs.valueDifferentiators && inputs.valueDifferentiators.length > 0 && (
          <div className="mb-6">
            <ValueDifferentiatorsBadges
              differentiators={inputs.valueDifferentiators}
              appreciationBonus={appreciationBonus}
            />
          </div>
        )}
      </div>
      
      {/* Modals */}
      <ExitChartModal
        open={showExitModal}
        onOpenChange={setShowExitModal}
        inputs={inputs}
        exitScenarios={exitScenarios}
        totalMonths={calculations.totalMonths}
        basePrice={basePrice}
        totalEntryCosts={calculations.totalEntryCosts}
        currency={currency}
        rate={rate}
      />
      
      <RentalComparisonModal
        open={showRentalModal}
        onOpenChange={setShowRentalModal}
        holdAnalysis={calculations.holdAnalysis}
        inputs={inputs}
        basePrice={basePrice}
        currency={currency}
        rate={rate}
      />
    </div>
  );
};
