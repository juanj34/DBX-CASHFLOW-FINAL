import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { TrendingUp, Settings2, Home, Palmtree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useCashflowQuote } from '@/hooks/useCashflowQuote';
import { useOICalculations, OIInputs } from '@/components/roi/useOICalculations';
import { useMortgageCalculations, DEFAULT_MORTGAGE_INPUTS, MortgageInputs } from '@/components/roi/useMortgageCalculations';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { Currency } from '@/components/roi/currencyUtils';
import {
  SecondaryInputs,
  DEFAULT_SECONDARY_INPUTS,
  ComparisonMetrics,
  useSecondaryCalculations,
  ComparisonConfiguratorModal,
  ComparisonKeyInsights,
  YearByYearWealthTable,
  WealthTrajectoryDualChart,
  DSCRExplanationCard,
  OutOfPocketCard,
  HeadToHeadTable,
  ComparisonVerdict,
  ExitScenariosComparison,
} from '@/components/roi/secondary';
import { Skeleton } from '@/components/ui/skeleton';

const OffPlanVsSecondary = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  
  // Modal state
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [hasConfigured, setHasConfigured] = useState(false);
  
  // Selected quote and secondary inputs
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | undefined>(quoteId);
  const [secondaryInputs, setSecondaryInputs] = useState<SecondaryInputs>(DEFAULT_SECONDARY_INPUTS);
  const [rentalMode, setRentalMode] = useState<'long-term' | 'airbnb'>('long-term');
  
  // Language and Currency state
  const [language, setLanguage] = useState<'en' | 'es'>('es');
  const [currency, setCurrency] = useState<Currency>('AED');
  const { rate } = useExchangeRate(currency);
  
  // Exit scenarios
  const [exitMonths, setExitMonths] = useState<number[]>([36, 60, 120]);

  // Load quote data
  const { quote, loading: quoteLoading } = useCashflowQuote(selectedQuoteId);

  // Open configurator on mount if no quoteId
  useEffect(() => {
    if (!quoteId && !hasConfigured) {
      setConfiguratorOpen(true);
    }
  }, [quoteId, hasConfigured]);

  // Initialize secondary inputs from quote
  useEffect(() => {
    if (quote?.inputs) {
      const inputs = quote.inputs as OIInputs;
      setSecondaryInputs(prev => ({
        ...prev,
        purchasePrice: inputs.basePrice || prev.purchasePrice,
        unitSizeSqf: inputs.unitSizeSqf || prev.unitSizeSqf,
        showAirbnbComparison: inputs.showAirbnbComparison ?? true,
        averageDailyRate: inputs.shortTermRental?.averageDailyRate || prev.averageDailyRate,
        occupancyPercent: inputs.shortTermRental?.occupancyPercent || prev.occupancyPercent,
        operatingExpensePercent: inputs.shortTermRental?.operatingExpensePercent || prev.operatingExpensePercent,
        managementFeePercent: inputs.shortTermRental?.managementFeePercent || prev.managementFeePercent,
      }));
      setHasConfigured(true);
    }
  }, [quote?.inputs]);

  // Handle compare from modal
  const handleCompare = (newQuoteId: string, newSecondaryInputs: SecondaryInputs, newExitMonths?: number[]) => {
    setSelectedQuoteId(newQuoteId);
    setSecondaryInputs(newSecondaryInputs);
    if (newExitMonths && newExitMonths.length > 0) {
      setExitMonths(newExitMonths);
    }
    setHasConfigured(true);
    // Update URL
    navigate(`/offplan-vs-secondary/${newQuoteId}`, { replace: true });
  };

  // Off-Plan calculations - create safe default inputs
  const offPlanInputs = quote?.inputs as OIInputs | undefined;
  
  const safeOffPlanInputs = useMemo((): OIInputs => {
    if (offPlanInputs) return offPlanInputs;
    return {
      basePrice: 0,
      rentalYieldPercent: 0,
      appreciationRate: 0,
      bookingMonth: 1,
      bookingYear: new Date().getFullYear(),
      handoverQuarter: 4,
      handoverYear: new Date().getFullYear() + 2,
      downpaymentPercent: 20,
      preHandoverPercent: 30,
      additionalPayments: [],
      hasPostHandoverPlan: false,
      onHandoverPercent: 0,
      postHandoverPercent: 0,
      postHandoverPayments: [],
      postHandoverEndQuarter: 4,
      postHandoverEndYear: new Date().getFullYear() + 4,
      eoiFee: 50000,
      oqoodFee: 5250,
      minimumExitThreshold: 30,
      exitAgentCommissionEnabled: true,
      exitNocFee: 5000,
      zoneMaturityLevel: 50,
      useZoneDefaults: false,
      constructionAppreciation: 12,
      growthAppreciation: 8,
      matureAppreciation: 4,
      growthPeriodYears: 5,
      rentGrowthRate: 4,
      serviceChargePerSqft: 18,
      adrGrowthRate: 3,
    };
  }, [offPlanInputs]);
  
  const offPlanCalcs = useOICalculations(safeOffPlanInputs);
  
  // Off-Plan mortgage
  const offPlanMortgageInputs: MortgageInputs = useMemo(() => {
    const stored = (offPlanInputs as any)?._mortgageInputs;
    return stored || DEFAULT_MORTGAGE_INPUTS;
  }, [offPlanInputs]);
  
  const offPlanMortgage = useMortgageCalculations({
    mortgageInputs: offPlanMortgageInputs,
    basePrice: safeOffPlanInputs.basePrice,
    preHandoverPercent: safeOffPlanInputs.preHandoverPercent,
    monthlyRent: offPlanCalcs.holdAnalysis?.netAnnualRent / 12 || 0,
  });

  // Secondary calculations
  const secondaryCalcs = useSecondaryCalculations(secondaryInputs);

  // Handover year index
  const handoverYearIndex = useMemo(() => {
    if (!offPlanInputs) return 2;
    return offPlanInputs.handoverYear - offPlanInputs.bookingYear + 1;
  }, [offPlanInputs]);
  
  // Handover months for exit scenarios
  const handoverMonths = handoverYearIndex * 12;

  // Total capital at handover for off-plan
  const offPlanTotalCapitalAtHandover = useMemo(() => {
    if (!offPlanInputs) return 0;
    const downpayment = offPlanInputs.basePrice * (offPlanInputs.downpaymentPercent / 100);
    const preHandover = offPlanInputs.basePrice * (offPlanInputs.preHandoverPercent / 100);
    const entryCosts = offPlanCalcs.totalEntryCosts;
    return downpayment + preHandover + entryCosts;
  }, [offPlanInputs, offPlanCalcs]);

  // Appreciation during construction
  const appreciationDuringConstruction = useMemo(() => {
    if (!offPlanInputs || !offPlanCalcs.yearlyProjections.length) return 0;
    const handoverProj = offPlanCalcs.yearlyProjections[handoverYearIndex - 1];
    return (handoverProj?.propertyValue || offPlanInputs.basePrice) - offPlanInputs.basePrice;
  }, [offPlanInputs, offPlanCalcs, handoverYearIndex]);

  // Comparison metrics
  const comparisonMetrics: ComparisonMetrics = useMemo(() => {
    if (!offPlanInputs || !offPlanCalcs.yearlyProjections.length) {
      return {} as ComparisonMetrics;
    }

    const offPlanCapitalDay1 = (offPlanInputs.basePrice * offPlanInputs.downpaymentPercent / 100) + offPlanCalcs.totalEntryCosts;
    const offPlanOutOfPocket = offPlanTotalCapitalAtHandover;
    const offPlanMonthsNoIncome = handoverYearIndex * 12;
    
    const offPlanYear10 = offPlanCalcs.yearlyProjections[9];
    
    let offPlanCumulativeRent = 0;
    for (let i = 0; i < 10; i++) {
      const proj = offPlanCalcs.yearlyProjections[i];
      if (proj && i >= handoverYearIndex - 1 && proj.netIncome) {
        offPlanCumulativeRent += proj.netIncome;
      }
    }
    
    const offPlanWealth10 = (offPlanYear10?.propertyValue || 0) + offPlanCumulativeRent - offPlanCapitalDay1;
    const offPlanROE10 = offPlanCapitalDay1 > 0 ? (offPlanWealth10 / offPlanCapitalDay1 * 100) / 10 : 0;
    
    const offPlanMonthlyRentLT = offPlanCalcs.holdAnalysis?.netAnnualRent / 12 || 0;
    const offPlanMonthlyRentST = (offPlanCalcs.holdAnalysis?.airbnbAnnualRent || 0) / 12;
    const offPlanDSCRLT = offPlanMortgage.monthlyPayment > 0 
      ? offPlanMonthlyRentLT / offPlanMortgage.monthlyPayment 
      : Infinity;
    const offPlanDSCRST = offPlanMortgage.monthlyPayment > 0 
      ? offPlanMonthlyRentST / offPlanMortgage.monthlyPayment 
      : Infinity;
    
    const secondaryProfit10 = secondaryCalcs.wealthYear10LT;
    const secondaryROE10 = secondaryCalcs.totalCapitalDay1 > 0 
      ? (secondaryProfit10 / secondaryCalcs.totalCapitalDay1 * 100) / 10 
      : 0;

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
      offPlanWealthYear5: 0,
      secondaryWealthYear5LT: secondaryCalcs.wealthYear5LT,
      secondaryWealthYear5ST: secondaryCalcs.wealthYear5ST,
      offPlanWealthYear10: offPlanWealth10,
      secondaryWealthYear10LT: secondaryCalcs.wealthYear10LT,
      secondaryWealthYear10ST: secondaryCalcs.wealthYear10ST,
      offPlanCashflowYear1: 0,
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

  const projectName = quote?.project_name || quote?.developer || 'Off-Plan';

  const t = language === 'es' ? {
    title: 'Off-Plan vs Secundaria',
    subtitle: 'Compara tu inversión off-plan contra una propiedad secundaria lista para ver qué estrategia construye más riqueza en 10 años.',
    appreciationConstruction: 'Apreciación en construcción',
    immediateCashflow: 'Cashflow inmediato',
    startComparison: 'Iniciar Comparación',
    reconfigure: 'Reconfigurar',
    vs: 'vs',
    secondaryLabel: 'Secundaria',
  } : {
    title: 'Off-Plan vs Secondary',
    subtitle: 'Compare your off-plan investment against a ready secondary property to see which strategy builds more wealth over 10 years.',
    appreciationConstruction: 'Construction appreciation',
    immediateCashflow: 'Immediate cashflow',
    startComparison: 'Start Comparison',
    reconfigure: 'Reconfigure',
    vs: 'vs',
    secondaryLabel: 'Secondary',
  };

  // Initial state - show CTA to open configurator
  if (!hasConfigured && !quoteLoading) {
    return (
      <div className="min-h-screen bg-theme-bg">
        <TopNavbar 
          language={language}
          setLanguage={setLanguage}
          currency={currency}
          setCurrency={setCurrency}
        />
        
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="p-8 bg-theme-card border-theme-border text-center">
            <div className="p-4 rounded-2xl bg-theme-accent/10 w-fit mx-auto mb-6">
              <TrendingUp className="w-12 h-12 text-theme-accent" />
            </div>
            
            <h1 className="text-2xl font-bold text-theme-text mb-3">
              {t.title}
            </h1>
            
            <p className="text-theme-text-muted mb-6 max-w-md mx-auto">
              {t.subtitle}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-theme-text-muted">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                {t.appreciationConstruction}
              </div>
              <div className="flex items-center gap-2 text-sm text-theme-text-muted">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                {t.immediateCashflow}
              </div>
            </div>
            
            <Button
              size="lg"
              onClick={() => setConfiguratorOpen(true)}
              className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90"
            >
              <Settings2 className="w-5 h-5 mr-2" />
              {t.startComparison}
            </Button>
          </Card>
        </div>

        <ComparisonConfiguratorModal
          open={configuratorOpen}
          onOpenChange={setConfiguratorOpen}
          onCompare={handleCompare}
          initialExitMonths={exitMonths}
          handoverMonths={handoverMonths}
        />
      </div>
    );
  }

  // Loading state
  if (quoteLoading) {
    return (
      <div className="min-h-screen bg-theme-bg">
        <TopNavbar 
          language={language}
          setLanguage={setLanguage}
          currency={currency}
          setCurrency={setCurrency}
        />
        <div className="container mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Results view
  return (
    <div className="min-h-screen bg-theme-bg">
      <TopNavbar 
        language={language}
        setLanguage={setLanguage}
        currency={currency}
        setCurrency={setCurrency}
      />

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              {projectName}
            </Badge>
            <span className="text-theme-text-muted">{t.vs}</span>
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/30">
              {t.secondaryLabel} AED {(secondaryInputs.purchasePrice / 1000000).toFixed(2)}M
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* Rental Mode Toggle */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-theme-card border border-theme-border">
              <Home className={`w-4 h-4 ${rentalMode === 'long-term' ? 'text-theme-accent' : 'text-theme-text-muted'}`} />
              <Switch
                checked={rentalMode === 'airbnb'}
                onCheckedChange={(checked) => setRentalMode(checked ? 'airbnb' : 'long-term')}
              />
              <Palmtree className={`w-4 h-4 ${rentalMode === 'airbnb' ? 'text-theme-accent' : 'text-theme-text-muted'}`} />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfiguratorOpen(true)}
              className="border-theme-border text-theme-text"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              {t.reconfigure}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* 1. Key Insights (4 Cards) */}
          <ComparisonKeyInsights
            metrics={comparisonMetrics}
            rentalMode={rentalMode}
            offPlanLabel={projectName}
            currency={currency}
            rate={rate}
            language={language}
          />

          {/* 2. Detailed Comparison Table */}
          <HeadToHeadTable
            metrics={comparisonMetrics}
            offPlanLabel={projectName}
            showAirbnb={rentalMode === 'airbnb'}
          />

          {/* 3. Year-by-Year Wealth Table */}
          <YearByYearWealthTable
            offPlanProjections={offPlanCalcs.yearlyProjections}
            secondaryProjections={secondaryCalcs.yearlyProjections}
            offPlanCapitalInvested={comparisonMetrics.offPlanCapitalDay1}
            handoverYearIndex={handoverYearIndex}
            rentalMode={rentalMode}
            currency={currency}
            rate={rate}
            language={language}
          />

          {/* 4. Wealth Trajectory Chart */}
          <WealthTrajectoryDualChart
            offPlanProjections={offPlanCalcs.yearlyProjections}
            secondaryProjections={secondaryCalcs.yearlyProjections}
            offPlanCapitalInvested={comparisonMetrics.offPlanCapitalDay1}
            secondaryCapitalInvested={secondaryCalcs.totalCapitalDay1}
            handoverYearIndex={handoverYearIndex}
            showAirbnb={rentalMode === 'airbnb'}
          />

          {/* 5. Exit Scenarios Comparison */}
          {exitMonths.length > 0 && (
            <ExitScenariosComparison
              exitMonths={exitMonths}
              offPlanProjections={offPlanCalcs.yearlyProjections}
              secondaryProjections={secondaryCalcs.yearlyProjections}
              offPlanCapitalInvested={comparisonMetrics.offPlanCapitalDay1}
              secondaryCapitalInvested={secondaryCalcs.totalCapitalDay1}
              handoverYearIndex={handoverYearIndex}
              rentalMode={rentalMode}
              currency={currency}
              rate={rate}
              language={language}
            />
          )}

          {/* 6. Two-column: DSCR Explanation + Out of Pocket */}
          <div className="grid lg:grid-cols-2 gap-6">
            <DSCRExplanationCard
              offPlanDSCR={rentalMode === 'airbnb' ? comparisonMetrics.offPlanDSCRST : comparisonMetrics.offPlanDSCRLT}
              secondaryDSCR={rentalMode === 'airbnb' ? comparisonMetrics.secondaryDSCRST : comparisonMetrics.secondaryDSCRLT}
              rentalMode={rentalMode}
            />
            
            <OutOfPocketCard
              offPlanCapitalDuringConstruction={offPlanTotalCapitalAtHandover}
              monthsWithoutIncome={handoverYearIndex * 12}
              appreciationDuringConstruction={appreciationDuringConstruction}
              secondaryCapitalDay1={secondaryCalcs.totalCapitalDay1}
              secondaryIncomeMonths={handoverYearIndex * 12}
              currency={currency}
              rate={rate}
              language={language}
            />
          </div>

          {/* 7. Verdict */}
          <ComparisonVerdict
            metrics={comparisonMetrics}
            offPlanProjectName={projectName}
          />
        </div>
      </div>

      {/* Configurator Modal */}
      <ComparisonConfiguratorModal
        open={configuratorOpen}
        onOpenChange={setConfiguratorOpen}
        onCompare={handleCompare}
        initialQuoteId={selectedQuoteId}
        initialSecondaryInputs={secondaryInputs}
        initialExitMonths={exitMonths}
        handoverMonths={handoverMonths}
      />
    </div>
  );
};

export default OffPlanVsSecondary;
