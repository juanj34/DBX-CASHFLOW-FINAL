import { useState, useMemo } from 'react';
import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '@/components/roi/useMortgageCalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { calculateExitScenario } from '@/components/roi/constructionProgress';
import {
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
    <div className="flex-1 overflow-auto p-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{clientInfo.projectName || 'Investment Snapshot'}</h1>
            <p className="text-sm text-muted-foreground">{clientInfo.developer} • {clientInfo.unit} • {clientInfo.unitType}</p>
          </div>
        </div>
        {brokerInfo.name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {brokerInfo.avatarUrl && (
              <img src={brokerInfo.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
            )}
            <span>{brokerInfo.name}</span>
          </div>
        )}
      </div>

      {/* Main Grid - 2 rows layout to fit on screen */}
      <div className="grid grid-cols-12 gap-3">
        {/* Row 1: Key Info Cards */}
        <div className="col-span-3">
          <ClientUnitTable
            clientInfo={clientInfo}
            basePrice={basePrice}
            currency={currency}
            rate={rate}
            onCurrencyChange={onCurrencyChange}
          />
        </div>
        <div className="col-span-3">
          <EquitySummaryCard
            downpayment={downpayment}
            installmentsTotal={installmentsTotal}
            handoverPayment={handoverPayment}
            entryCosts={calculations.totalEntryCosts}
            currency={currency}
            rate={rate}
          />
        </div>
        <div className="col-span-3">
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
        <div className="col-span-3">
          <CompactExitCards
            exitScenarios={exitScenariosData}
            totalMonths={calculations.totalMonths}
            currency={currency}
            rate={rate}
            onClick={() => setShowExitModal(true)}
          />
        </div>

        {/* Row 2: Detailed Tables */}
        <div className="col-span-6">
          <MilestoneTable
            inputs={inputs}
            basePrice={basePrice}
            totalMonths={calculations.totalMonths}
            exitScenarios={exitScenarios}
            currency={currency}
            rate={rate}
          />
        </div>
        <div className="col-span-6">
          <div className="space-y-3">
            <IncomeProjectionTable
              holdAnalysis={calculations.holdAnalysis}
              inputs={inputs}
              basePrice={basePrice}
              currency={currency}
              rate={rate}
              onCompareClick={inputs.showAirbnbComparison ? () => setShowRentalModal(true) : undefined}
            />
            {mortgageInputs.enabled && (
              <MortgageSection
                mortgageAnalysis={mortgageAnalysis}
                currency={currency}
                rate={rate}
              />
            )}
          </div>
        </div>

        {/* Row 3: Cashflow + Extras */}
        <div className="col-span-12">
          <AnnualCashflowRow
            yearlyProjections={calculations.yearlyProjections}
            currency={currency}
            rate={rate}
          />
        </div>
        
        {/* Value Differentiators - if present */}
        {inputs.valueDifferentiators && inputs.valueDifferentiators.length > 0 && (
          <div className="col-span-12">
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
