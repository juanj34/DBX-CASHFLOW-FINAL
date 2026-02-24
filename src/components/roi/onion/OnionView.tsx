import { useMemo } from "react";
import {
  CreditCard, Home, TrendingUp, Building2, Clock, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { MortgageInputs, MortgageAnalysis } from "@/components/roi/useMortgageCalculations";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";
import { calculateExitScenario } from "@/components/roi/constructionProgress";

// Reused display components
import { CompactPaymentTable } from "@/components/roi/snapshot/CompactPaymentTable";
import { RentSnapshot } from "@/components/roi/RentSnapshot";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { CompactExitGraphCard } from "@/components/roi/snapshot/CompactExitGraphCard";
import { ExitScenariosCards } from "@/components/roi/ExitScenariosCards";
import { MortgageBreakdown } from "@/components/roi/MortgageBreakdown";
import { CompactPostHandoverCard } from "@/components/roi/snapshot/CompactPostHandoverCard";

import { OnionSection } from "./OnionSection";
import { OnionHeader } from "./OnionHeader";

interface OnionViewProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientUnitData;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  quoteImages?: {
    heroImageUrl?: string | null;
    floorPlanUrl?: string | null;
    buildingRenderUrl?: string | null;
  };
  currency: Currency;
  rate: number;
  language?: string;
  onEditClick?: () => void;
}

export const OnionView = ({
  inputs,
  calculations,
  clientInfo,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  currency,
  rate,
  onEditClick,
}: OnionViewProps) => {
  const { t } = useLanguage();

  // Conditional section visibility (same logic as SnapshotContent)
  const showExits = inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0 && calculations.basePrice > 0;
  const showMortgage = mortgageInputs.enabled;
  const showPostHandover = inputs.hasPostHandoverPlan;

  // Compute payment phase summaries
  const paymentSummary = useMemo(() => {
    const bp = calculations.basePrice;
    const pre = bp * (inputs.preHandoverPercent || 0) / 100;
    const handover = bp * ((inputs.handoverPercent || 0) / 100);
    const post = bp * ((inputs.postHandoverPercent || 0) / 100);
    return { pre, handover, post };
  }, [calculations.basePrice, inputs.preHandoverPercent, inputs.handoverPercent, inputs.postHandoverPercent]);

  // Compute rental summary
  const rentalSummary = useMemo(() => {
    const annualRent = (inputs.expectedAnnualRent || 0);
    const serviceCharges = (inputs.serviceChargePerSqft || 18) * (inputs.unitSizeSqf || 0);
    const netAnnual = annualRent - serviceCharges;
    const yieldPct = calculations.basePrice > 0 ? (netAnnual / calculations.basePrice) * 100 : 0;
    return { netAnnual, yieldPct };
  }, [inputs, calculations.basePrice]);

  // Compute exit summaries
  const exitSummaries = useMemo(() => {
    if (!showExits) return [];
    return exitScenarios.map(months =>
      calculateExitScenario(months, calculations.basePrice, calculations.totalMonths, inputs, calculations.totalEntryCosts)
    );
  }, [showExits, exitScenarios, calculations.basePrice, calculations.totalMonths, calculations.totalEntryCosts, inputs]);

  // Compute mortgage summary
  const mortgageSummary = useMemo(() => {
    if (!showMortgage) return null;
    const monthly = mortgageAnalysis.monthlyPayment || 0;
    const monthlyRent = (rentalSummary.netAnnual) / 12;
    const coverage = monthly > 0 ? monthlyRent / monthly : 0;
    return { monthly, coverage };
  }, [showMortgage, mortgageAnalysis, rentalSummary]);

  // Post-handover summary
  const postHandoverSummary = useMemo(() => {
    if (!showPostHandover || !inputs.postHandoverPayments?.length) return null;
    const total = inputs.postHandoverPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return { total, count: inputs.postHandoverPayments.length };
  }, [showPostHandover, inputs.postHandoverPayments]);

  // Monthly rent for post-handover card
  const monthlyRent = (rentalSummary.netAnnual) / 12;
  const rentGrowthRate = inputs.annualRentIncrease || 5;

  return (
    <div className="min-h-full bg-theme-bg">
      <div className="max-w-[640px] mx-auto px-4 py-6">

        {/* 1. Unit Header — always visible */}
        <OnionHeader
          clientInfo={clientInfo}
          basePrice={calculations.basePrice}
          currency={currency}
          rate={rate}
          unitSizeSqf={inputs.unitSizeSqf}
        />

        {/* 2. Payment Breakdown */}
        <OnionSection
          icon={CreditCard}
          title={t('paymentBreakdownHeader') || 'Payment Breakdown'}
          summary={
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span>{t('preHandoverLabel') || 'Pre-HO'}: <span className="font-mono text-theme-text">{formatCurrency(paymentSummary.pre, currency, rate)}</span></span>
              <span>{t('handoverLabel') || 'Handover'}: <span className="font-mono text-theme-text">{formatCurrency(paymentSummary.handover, currency, rate)}</span></span>
              {paymentSummary.post > 0 && (
                <span>{t('postHandoverLabel') || 'Post-HO'}: <span className="font-mono text-theme-text">{formatCurrency(paymentSummary.post, currency, rate)}</span></span>
              )}
            </div>
          }
        >
          <CompactPaymentTable
            inputs={inputs}
            clientInfo={clientInfo}
            currency={currency}
            rate={rate}
            totalMonths={calculations.totalMonths}
            collapsiblePhases={true}
          />
        </OnionSection>

        {/* 3. Rental Income */}
        <OnionSection
          icon={Home}
          title={t('rentalIncome') || 'Rental Income'}
          summary={
            <span>
              <span className="font-mono text-theme-text">{formatCurrency(rentalSummary.netAnnual, currency, rate)}</span>
              {' '}{t('perYear') || '/yr'} net
              {' · '}
              <span className="font-mono text-theme-positive">{rentalSummary.yieldPct.toFixed(1)}%</span>
              {' '}{t('yield') || 'yield'}
              {inputs.showAirbnbComparison && (
                <span className="ml-1 text-theme-text-highlight">+ Airbnb</span>
              )}
            </span>
          }
        >
          <div className="space-y-4">
            <RentSnapshot
              inputs={inputs}
              currency={currency}
              rate={rate}
              holdAnalysis={calculations.holdAnalysis}
            />
            {calculations.yearlyProjections && calculations.yearlyProjections.length > 0 && (
              <OIYearlyProjectionTable
                projections={calculations.yearlyProjections.slice(0, 7)}
                currency={currency}
                rate={rate}
                showAirbnbComparison={inputs.showAirbnbComparison || false}
                unitSizeSqf={inputs.unitSizeSqf}
                embedded={true}
              />
            )}
          </div>
        </OnionSection>

        {/* 4. Exit Strategy (conditional) */}
        {showExits && (
          <OnionSection
            icon={TrendingUp}
            title={t('exitStrategyTitle') || 'Exit Strategy'}
            summary={
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {exitSummaries.map((s, i) => (
                  <span key={i}>
                    {exitScenarios[i]}mo:{' '}
                    <span className={`font-mono ${s.trueROE >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                      {s.trueROE.toFixed(0)}% ROE
                    </span>
                  </span>
                ))}
              </div>
            }
          >
            <div className="space-y-4">
              <CompactExitGraphCard
                inputs={inputs}
                calculations={calculations}
                exitScenarios={exitScenarios}
                currency={currency}
                rate={rate}
              />
              <ExitScenariosCards
                inputs={inputs}
                currency={currency}
                totalMonths={calculations.totalMonths}
                basePrice={calculations.basePrice}
                totalEntryCosts={calculations.totalEntryCosts}
                exitScenarios={exitScenarios}
                rate={rate}
                readOnly={true}
              />
            </div>
          </OnionSection>
        )}

        {/* 5. Mortgage (conditional) */}
        {showMortgage && mortgageSummary && (
          <OnionSection
            icon={Building2}
            title={t('mortgage') || 'Mortgage'}
            summary={
              <span>
                <span className="font-mono text-theme-text">{formatCurrency(mortgageSummary.monthly, currency, rate)}</span>
                {' '}/mo
                {' · '}
                <span className={`font-mono ${mortgageSummary.coverage >= 1.0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                  {mortgageSummary.coverage.toFixed(1)}x
                </span>
                {' '}{t('coverageLabel') || 'coverage'}
              </span>
            }
          >
            <MortgageBreakdown
              mortgageInputs={mortgageInputs}
              mortgageAnalysis={mortgageAnalysis}
              basePrice={calculations.basePrice}
              currency={currency}
              rate={rate}
              preHandoverPercent={inputs.preHandoverPercent}
              monthlyLongTermRent={monthlyRent}
              monthlyServiceCharges={(inputs.serviceChargePerSqft || 18) * (inputs.unitSizeSqf || 0) / 12}
            />
          </OnionSection>
        )}

        {/* 6. Post-Handover Coverage (conditional) */}
        {showPostHandover && postHandoverSummary && (
          <OnionSection
            icon={Clock}
            title={t('postHoTabLabel') || 'Post-Handover'}
            summary={
              <span>
                {postHandoverSummary.count} {t('installments') || 'installments'}
                {' · '}
                {t('total') || 'Total'}: <span className="font-mono text-theme-text">{formatCurrency(postHandoverSummary.total, currency, rate)}</span>
              </span>
            }
          >
            <CompactPostHandoverCard
              inputs={inputs}
              monthlyRent={monthlyRent}
              rentGrowthRate={rentGrowthRate}
              currency={currency}
              rate={rate}
            />
          </OnionSection>
        )}

        {/* Bottom border to close the last section */}
        <div className="border-t border-theme-border" />
      </div>

      {/* Floating edit button */}
      {onEditClick && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="icon"
            onClick={onEditClick}
            className="h-12 w-12 rounded-full bg-theme-accent text-theme-bg shadow-lg hover:bg-theme-accent/90"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
};
