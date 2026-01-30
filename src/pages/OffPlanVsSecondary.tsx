import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Building2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCashflowQuote } from '@/hooks/useCashflowQuote';
import { useOICalculations, OIInputs } from '@/components/roi/useOICalculations';
import { useMortgageCalculations, DEFAULT_MORTGAGE_INPUTS, MortgageInputs } from '@/components/roi/useMortgageCalculations';
import {
  SecondaryInputs,
  DEFAULT_SECONDARY_INPUTS,
  ComparisonMetrics,
  useSecondaryCalculations,
  SecondarySimulatorForm,
  ComparisonSummaryCards,
  WealthTrajectoryDualChart,
  MortgageCoverageMatrix,
  OutOfPocketTimeline,
  HeadToHeadTable,
  ComparisonVerdict,
} from '@/components/roi/secondary';
import { Skeleton } from '@/components/ui/skeleton';

const OffPlanVsSecondary = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { quote, loading: quoteLoading } = useCashflowQuote(quoteId);
  
  // Secondary inputs state
  const [secondaryInputs, setSecondaryInputs] = useState<SecondaryInputs>(DEFAULT_SECONDARY_INPUTS);
  
  // Initialize secondary inputs based on off-plan quote
  useEffect(() => {
    if (quote?.inputs) {
      const inputs = quote.inputs as OIInputs;
      setSecondaryInputs(prev => ({
        ...prev,
        // Match purchase price to off-plan
        purchasePrice: inputs.basePrice || prev.purchasePrice,
        unitSizeSqf: inputs.unitSizeSqf || prev.unitSizeSqf,
        // Airbnb settings from off-plan if available
        showAirbnbComparison: inputs.showAirbnbComparison ?? true,
        averageDailyRate: inputs.shortTermRental?.averageDailyRate || prev.averageDailyRate,
        occupancyPercent: inputs.shortTermRental?.occupancyPercent || prev.occupancyPercent,
        operatingExpensePercent: inputs.shortTermRental?.operatingExpensePercent || prev.operatingExpensePercent,
        managementFeePercent: inputs.shortTermRental?.managementFeePercent || prev.managementFeePercent,
      }));
    }
  }, [quote?.inputs]);

  // Off-Plan calculations
  const offPlanInputs = quote?.inputs as OIInputs | undefined;
  const offPlanCalcs = useOICalculations(offPlanInputs || {} as OIInputs);
  
  // Off-Plan mortgage
  const offPlanMortgageInputs: MortgageInputs = useMemo(() => {
    const stored = (offPlanInputs as any)?._mortgageInputs;
    return stored || DEFAULT_MORTGAGE_INPUTS;
  }, [offPlanInputs]);
  
  const offPlanMortgage = useMortgageCalculations({
    mortgageInputs: offPlanMortgageInputs,
    basePrice: offPlanInputs?.basePrice || 0,
    preHandoverPercent: offPlanInputs?.preHandoverPercent || 0,
    monthlyRent: offPlanCalcs.holdAnalysis?.netAnnualRent / 12 || 0,
  });

  // Secondary calculations
  const secondaryCalcs = useSecondaryCalculations(secondaryInputs);

  // Calculate handover year index
  const handoverYearIndex = useMemo(() => {
    if (!offPlanInputs) return 2;
    return offPlanInputs.handoverYear - offPlanInputs.bookingYear + 1;
  }, [offPlanInputs]);

  // Calculate total capital at handover for off-plan
  const offPlanTotalCapitalAtHandover = useMemo(() => {
    if (!offPlanInputs) return 0;
    const downpayment = offPlanInputs.basePrice * (offPlanInputs.downpaymentPercent / 100);
    const preHandover = offPlanInputs.basePrice * (offPlanInputs.preHandoverPercent / 100);
    const onHandover = offPlanInputs.basePrice * ((100 - offPlanInputs.preHandoverPercent - (offPlanInputs.postHandoverPercent || 0)) / 100);
    const entryCosts = offPlanCalcs.totalEntryCosts;
    return downpayment + preHandover + onHandover + entryCosts - (offPlanInputs.basePrice * offPlanInputs.downpaymentPercent / 100); // Avoid double counting
  }, [offPlanInputs, offPlanCalcs]);

  // Comparison metrics
  const comparisonMetrics: ComparisonMetrics = useMemo(() => {
    if (!offPlanInputs || !offPlanCalcs.yearlyProjections.length) {
      return {} as ComparisonMetrics;
    }

    // Off-Plan capital at day 1 (downpayment + entry costs)
    const offPlanCapitalDay1 = (offPlanInputs.basePrice * offPlanInputs.downpaymentPercent / 100) + offPlanCalcs.totalEntryCosts;
    
    // Off-Plan total out of pocket before handover
    const offPlanOutOfPocket = offPlanTotalCapitalAtHandover;
    
    // Off-Plan months without income
    const offPlanMonthsNoIncome = handoverYearIndex * 12;
    
    // Off-Plan wealth calculations
    const offPlanYear5 = offPlanCalcs.yearlyProjections[4];
    const offPlanYear10 = offPlanCalcs.yearlyProjections[9];
    
    let offPlanCumulativeRent = 0;
    for (let i = 0; i < 10; i++) {
      const proj = offPlanCalcs.yearlyProjections[i];
      if (proj && i >= handoverYearIndex - 1 && proj.netIncome) {
        offPlanCumulativeRent += proj.netIncome;
      }
    }
    
    const offPlanWealth5 = (offPlanYear5?.propertyValue || 0) + 
      offPlanCalcs.yearlyProjections.slice(0, 5).reduce((sum, p) => sum + (p.netIncome || 0), 0) - 
      offPlanCapitalDay1;
    
    const offPlanWealth10 = (offPlanYear10?.propertyValue || 0) + offPlanCumulativeRent - offPlanCapitalDay1;
    
    // Off-Plan ROE
    const offPlanProfit10 = offPlanWealth10;
    const offPlanROE10 = offPlanCapitalDay1 > 0 ? (offPlanProfit10 / offPlanCapitalDay1 * 100) / 10 : 0;
    
    // Off-Plan DSCR (post-handover)
    const offPlanMonthlyRentLT = offPlanCalcs.holdAnalysis?.netAnnualRent / 12 || 0;
    const offPlanMonthlyRentST = (offPlanCalcs.holdAnalysis?.airbnbAnnualRent || 0) / 12;
    const offPlanDSCRLT = offPlanMortgage.monthlyPayment > 0 
      ? offPlanMonthlyRentLT / offPlanMortgage.monthlyPayment 
      : Infinity;
    const offPlanDSCRST = offPlanMortgage.monthlyPayment > 0 
      ? offPlanMonthlyRentST / offPlanMortgage.monthlyPayment 
      : Infinity;
    
    // Secondary ROE
    const secondaryProfit10 = secondaryCalcs.wealthYear10LT;
    const secondaryROE10 = secondaryCalcs.totalCapitalDay1 > 0 
      ? (secondaryProfit10 / secondaryCalcs.totalCapitalDay1 * 100) / 10 
      : 0;

    // Find crossover year (when off-plan wealth > secondary)
    let crossoverYearLT: number | null = null;
    let crossoverYearST: number | null = null;
    
    for (let year = 1; year <= 10; year++) {
      const opProj = offPlanCalcs.yearlyProjections[year - 1];
      const secProj = secondaryCalcs.yearlyProjections[year - 1];
      
      if (!opProj || !secProj) continue;
      
      let opCumulativeRent = 0;
      for (let i = 0; i < year; i++) {
        if (i >= handoverYearIndex - 1) {
          opCumulativeRent += offPlanCalcs.yearlyProjections[i]?.netIncome || 0;
        }
      }
      const opWealth = opProj.propertyValue + opCumulativeRent - offPlanCapitalDay1;
      
      if (!crossoverYearLT && opWealth > secProj.totalWealthLT) {
        crossoverYearLT = year;
      }
      if (!crossoverYearST && opWealth > secProj.totalWealthST) {
        crossoverYearST = year;
      }
    }

    return {
      offPlanCapitalDay1,
      secondaryCapitalDay1: secondaryCalcs.totalCapitalDay1,
      offPlanTotalCapitalAtHandover,
      offPlanOutOfPocket,
      offPlanMonthsNoIncome,
      offPlanWealthYear5: offPlanWealth5,
      secondaryWealthYear5LT: secondaryCalcs.wealthYear5LT,
      secondaryWealthYear5ST: secondaryCalcs.wealthYear5ST,
      offPlanWealthYear10: offPlanWealth10,
      secondaryWealthYear10LT: secondaryCalcs.wealthYear10LT,
      secondaryWealthYear10ST: secondaryCalcs.wealthYear10ST,
      offPlanCashflowYear1: 0, // In construction
      secondaryCashflowYear1LT: secondaryCalcs.monthlyCashflowLT * 12,
      secondaryCashflowYear1ST: secondaryCalcs.monthlyCashflowST * 12,
      offPlanDSCRLT,
      offPlanDSCRST,
      secondaryDSCRLT: secondaryCalcs.dscrLongTerm,
      secondaryDSCRST: secondaryCalcs.dscrAirbnb,
      offPlanROEYear10: offPlanROE10,
      secondaryROEYear10LT: secondaryROE10,
      secondaryROEYear10ST: secondaryCalcs.totalCapitalDay1 > 0 
        ? (secondaryCalcs.wealthYear10ST / secondaryCalcs.totalCapitalDay1 * 100) / 10 
        : 0,
      crossoverYearLT,
      crossoverYearST,
    };
  }, [offPlanInputs, offPlanCalcs, offPlanMortgage, secondaryCalcs, handoverYearIndex, offPlanTotalCapitalAtHandover]);

  if (quoteLoading) {
    return (
      <div className="min-h-screen bg-theme-bg">
        <PageHeader
          title="Cargando..."
          backLink="/my-quotes"
        />
        <div className="container mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!quote || !offPlanInputs) {
    return (
      <div className="min-h-screen bg-theme-bg">
        <PageHeader
          title="Quote no encontrado"
          backLink="/my-quotes"
        />
        <div className="container mx-auto px-4 py-6">
          <p className="text-theme-text-muted">No se pudo cargar el quote. Por favor selecciona uno válido.</p>
          <Button 
            onClick={() => navigate('/my-quotes')} 
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Mis Quotes
          </Button>
        </div>
      </div>
    );
  }

  const projectName = quote.project_name || quote.developer || 'Off-Plan';

  return (
    <div className="min-h-screen bg-theme-bg">
      <PageHeader
        title="Off-Plan vs Secundaria"
        subtitle={`Comparando ${projectName} contra inversión en secundaria`}
        icon={<Building2 className="w-5 h-5" />}
        backLink={`/cashflow/${quoteId}`}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Secondary Simulator */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-theme-text">Configurar Secundaria</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSecondaryInputs({
                    ...DEFAULT_SECONDARY_INPUTS,
                    purchasePrice: offPlanInputs.basePrice,
                    unitSizeSqf: offPlanInputs.unitSizeSqf || 650,
                  })}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-180px)]">
                <SecondarySimulatorForm 
                  inputs={secondaryInputs}
                  onChange={setSecondaryInputs}
                />
              </ScrollArea>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-6">
            {/* Header Cards */}
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500">
                {projectName}
              </Badge>
              <span className="text-theme-text-muted">vs</span>
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500">
                Secundaria AED {(secondaryInputs.purchasePrice / 1000).toFixed(0)}K
              </Badge>
            </div>

            {/* Summary Cards */}
            <ComparisonSummaryCards 
              metrics={comparisonMetrics}
              showAirbnb={secondaryInputs.showAirbnbComparison}
            />

            {/* Verdict */}
            <ComparisonVerdict 
              metrics={comparisonMetrics}
              offPlanProjectName={projectName}
            />

            {/* Wealth Trajectory Chart */}
            <WealthTrajectoryDualChart
              offPlanProjections={offPlanCalcs.yearlyProjections}
              secondaryProjections={secondaryCalcs.yearlyProjections}
              offPlanCapitalInvested={comparisonMetrics.offPlanCapitalDay1}
              secondaryCapitalInvested={secondaryCalcs.totalCapitalDay1}
              handoverYearIndex={handoverYearIndex}
              showAirbnb={secondaryInputs.showAirbnbComparison}
            />

            {/* Out of Pocket Timeline */}
            <OutOfPocketTimeline
              basePrice={offPlanInputs.basePrice}
              downpaymentPercent={offPlanInputs.downpaymentPercent}
              additionalPayments={offPlanInputs.additionalPayments || []}
              handoverPercent={100 - offPlanInputs.preHandoverPercent - (offPlanInputs.postHandoverPercent || 0)}
              totalMonths={offPlanCalcs.totalMonths}
              propertyValueAtHandover={offPlanCalcs.yearlyProjections[handoverYearIndex - 1]?.propertyValue || offPlanInputs.basePrice}
              entryCosts={offPlanCalcs.totalEntryCosts}
              secondaryCapitalDay1={secondaryCalcs.totalCapitalDay1}
            />

            {/* Mortgage Coverage Matrix */}
            {(offPlanMortgageInputs.enabled || secondaryInputs.useMortgage) && (
              <MortgageCoverageMatrix
                offPlanMonthlyRentLT={offPlanCalcs.holdAnalysis?.netAnnualRent / 12 || 0}
                offPlanMonthlyRentST={(offPlanCalcs.holdAnalysis?.airbnbAnnualRent || 0) / 12}
                offPlanMonthlyMortgage={offPlanMortgageInputs.enabled ? offPlanMortgage.monthlyPayment : 0}
                offPlanLoanAmount={offPlanMortgageInputs.enabled ? offPlanMortgage.loanAmount : 0}
                secondaryMonthlyRentLT={secondaryCalcs.monthlyRentLT}
                secondaryMonthlyRentST={secondaryCalcs.monthlyRentST}
                secondaryMonthlyMortgage={secondaryInputs.useMortgage ? secondaryCalcs.monthlyMortgagePayment : 0}
                secondaryLoanAmount={secondaryInputs.useMortgage ? secondaryCalcs.loanAmount : 0}
                showAirbnb={secondaryInputs.showAirbnbComparison}
              />
            )}

            {/* Head to Head Table */}
            <HeadToHeadTable 
              metrics={comparisonMetrics}
              offPlanLabel={projectName}
              showAirbnb={secondaryInputs.showAirbnbComparison}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default OffPlanVsSecondary;
