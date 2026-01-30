import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { TrendingUp, Settings2, Home, Palmtree, Coins, Save, FolderOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCashflowQuote } from '@/hooks/useCashflowQuote';
import { useOICalculations, OIInputs } from '@/components/roi/useOICalculations';
import { useMortgageCalculations, DEFAULT_MORTGAGE_INPUTS, MortgageInputs } from '@/components/roi/useMortgageCalculations';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { Currency, CURRENCY_CONFIG, formatCurrency } from '@/components/roi/currencyUtils';
import {
  SecondaryInputs,
  DEFAULT_SECONDARY_INPUTS,
  ComparisonMetrics,
  useSecondaryCalculations,
  ComparisonConfiguratorModal,
  ComparisonKeyInsights,
  YearByYearWealthTable,
  WealthTrajectoryDualChart,
  OutOfPocketCard,
  ComparisonVerdict,
  ExitScenariosComparison,
  SaveSecondaryComparisonModal,
  LoadSecondaryComparisonModal,
  MortgageCoverageCard,
  RentalComparisonAtHandover,
} from '@/components/roi/secondary';
import { useSecondaryComparisons, SecondaryComparison } from '@/hooks/useSecondaryComparisons';
import { Skeleton } from '@/components/ui/skeleton';

const OffPlanVsSecondary = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  
  // Modal state
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [hasConfigured, setHasConfigured] = useState(false);
  const [currentComparisonId, setCurrentComparisonId] = useState<string | null>(null);
  const [currentComparisonTitle, setCurrentComparisonTitle] = useState<string>('');
  
  // Selected quote and secondary inputs
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | undefined>(quoteId);
  const [secondaryInputs, setSecondaryInputs] = useState<SecondaryInputs>(DEFAULT_SECONDARY_INPUTS);
  const [rentalMode, setRentalMode] = useState<'long-term' | 'airbnb'>('long-term');
  
  // Language from context, Currency is per-view
  const { language } = useLanguage();
  const [currency, setCurrency] = useState<Currency>('AED');
  const { rate } = useExchangeRate(currency);
  
  // Exit scenarios
  const [exitMonths, setExitMonths] = useState<number[]>([36, 60, 120]);

  // Persistence hook
  const { 
    comparisons, 
    loading: comparisonsLoading, 
    saveComparison, 
    updateComparison,
    deleteComparison,
    loadComparison 
  } = useSecondaryComparisons();

  // Load quote data
  const { quote, loading: quoteLoading } = useCashflowQuote(selectedQuoteId);

  // Don't auto-open configurator - let user choose to create new or load existing

  // Handle compare from modal - this REPLACES secondary inputs with modal values
  const handleCompare = (newQuoteId: string, newSecondaryInputs: SecondaryInputs, newExitMonths?: number[]) => {
    setSelectedQuoteId(newQuoteId);
    setSecondaryInputs(newSecondaryInputs);
    if (newExitMonths && newExitMonths.length > 0) {
      setExitMonths(newExitMonths);
    }
    setHasConfigured(true);
    setCurrentComparisonId(null); // Reset since this is a new comparison
    setCurrentComparisonTitle('');
    // Update URL
    navigate(`/offplan-vs-secondary/${newQuoteId}`, { replace: true });
  };

  // Handle loading a saved comparison - REPLACES all state with saved values
  const handleLoadComparison = (comparison: SecondaryComparison) => {
    setSelectedQuoteId(comparison.quote_id || undefined);
    setSecondaryInputs(comparison.secondary_inputs);
    setExitMonths(comparison.exit_months);
    setRentalMode(comparison.rental_mode);
    setCurrentComparisonId(comparison.id);
    setCurrentComparisonTitle(comparison.title);
    setHasConfigured(true);
    if (comparison.quote_id) {
      navigate(`/offplan-vs-secondary/${comparison.quote_id}`, { replace: true });
    }
  };

  // Handle saving comparison
  const handleSaveComparison = async (title: string) => {
    if (currentComparisonId) {
      // Update existing
      await updateComparison(currentComparisonId, {
        title,
        secondary_inputs: secondaryInputs,
        exit_months: exitMonths,
        rental_mode: rentalMode,
      });
      setCurrentComparisonTitle(title);
    } else {
      // Create new
      const newComparison = await saveComparison(
        title,
        selectedQuoteId || null,
        secondaryInputs,
        exitMonths,
        rentalMode
      );
      if (newComparison) {
        setCurrentComparisonId(newComparison.id);
        setCurrentComparisonTitle(newComparison.title);
      }
    }
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

  // NEW: Total income earned by Secondary during construction
  const secondaryTotalIncomeAtHandover = useMemo(() => {
    const monthlyRent = rentalMode === 'long-term' 
      ? secondaryCalcs.monthlyRentLT 
      : secondaryCalcs.monthlyRentST;
    const months = handoverYearIndex * 12;
    return monthlyRent * months;
  }, [secondaryCalcs, handoverYearIndex, rentalMode]);

  // NEW: Principal paid at Year 10 (from secondary projections)
  const secondaryPrincipalPaid10Y = useMemo(() => {
    return secondaryCalcs.yearlyProjections[9]?.principalPaid || 0;
  }, [secondaryCalcs]);

  // NEW: Off-Plan rental at handover
  const offPlanMonthlyRentAtHandover = useMemo(() => {
    return offPlanCalcs.holdAnalysis?.netAnnualRent / 12 || 0;
  }, [offPlanCalcs]);

  // NEW: Secondary rental at handover (with growth applied)
  const secondaryMonthlyRentAtHandover = useMemo(() => {
    const baseRent = rentalMode === 'long-term' 
      ? secondaryCalcs.monthlyRentLT 
      : secondaryCalcs.monthlyRentST;
    const growthFactor = Math.pow(1 + secondaryInputs.rentGrowthRate / 100, handoverYearIndex);
    return baseRent * growthFactor;
  }, [secondaryCalcs, secondaryInputs, handoverYearIndex, rentalMode]);

  // NEW: Year 10 property values
  const offPlanPropertyValue10Y = useMemo(() => {
    return offPlanCalcs.yearlyProjections[9]?.propertyValue || 0;
  }, [offPlanCalcs]);

  const secondaryPropertyValue10Y = useMemo(() => {
    return secondaryCalcs.yearlyProjections[9]?.propertyValue || 0;
  }, [secondaryCalcs]);

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

    // Calculate off-plan cumulative rent up to year 5
    let offPlanCumulativeRent5 = 0;
    for (let i = 0; i < 5; i++) {
      const proj = offPlanCalcs.yearlyProjections[i];
      if (proj && i >= handoverYearIndex - 1 && proj.netIncome) {
        offPlanCumulativeRent5 += proj.netIncome;
      }
    }
    const offPlanYear5 = offPlanCalcs.yearlyProjections[4];
    const offPlanWealth5 = (offPlanYear5?.propertyValue || 0) + offPlanCumulativeRent5 - offPlanCapitalDay1;

    return {
      offPlanCapitalDay1,
      // For fair comparison, use total property cost (not mortgage-adjusted)
      // Secondary buyer commits to full price + fees, just like off-plan buyer
      secondaryCapitalDay1: secondaryInputs.purchasePrice + secondaryCalcs.closingCosts,
      // Actual cash invested (for multiplier calculation)
      secondaryCashCapital: secondaryCalcs.totalCapitalDay1,
      offPlanTotalCapitalAtHandover,
      offPlanOutOfPocket,
      offPlanMonthsNoIncome,
      offPlanWealthYear5: offPlanWealth5,
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
    save: 'Guardar',
    update: 'Actualizar',
    load: 'Cargar',
    loadRecent: 'Cargar Reciente',
    recentComparisons: 'Comparaciones Recientes',
  } : {
    title: 'Off-Plan vs Secondary',
    subtitle: 'Compare your off-plan investment against a ready secondary property to see which strategy builds more wealth over 10 years.',
    appreciationConstruction: 'Construction appreciation',
    immediateCashflow: 'Immediate cashflow',
    startComparison: 'Start Comparison',
    reconfigure: 'Reconfigure',
    vs: 'vs',
    secondaryLabel: 'Secondary',
    save: 'Save',
    update: 'Update',
    load: 'Load',
    loadRecent: 'Load Recent',
    recentComparisons: 'Recent Comparisons',
  };

  // Initial state - show CTA to open configurator or load saved
  if (!hasConfigured && !quoteLoading) {
    return (
      <div className="min-h-screen bg-theme-bg">
        <TopNavbar />
        
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
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => setConfiguratorOpen(true)}
                className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90"
              >
                <Settings2 className="w-5 h-5 mr-2" />
                {t.startComparison}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLoadModalOpen(true)}
                className="border-theme-border text-theme-text hover:bg-theme-card"
                disabled={comparisonsLoading}
              >
                <FolderOpen className="w-5 h-5 mr-2" />
                {t.loadRecent} {comparisons.length > 0 && `(${comparisons.length})`}
              </Button>
            </div>
          </Card>

          {/* Recent Comparisons Preview */}
          {comparisons.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-theme-accent" />
                {t.recentComparisons}
              </h2>
              <div className="grid gap-3">
                {comparisons.slice(0, 5).map((comparison) => (
                  <Card
                    key={comparison.id}
                    className="p-4 bg-theme-card border-theme-border hover:border-theme-accent/50 cursor-pointer transition-colors group"
                    onClick={() => handleLoadComparison(comparison)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-theme-text truncate group-hover:text-theme-accent transition-colors">
                          {comparison.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-theme-text-muted">
                          <Badge variant="outline" className="text-[10px]">
                            {formatCurrency(comparison.secondary_inputs.purchasePrice, 'AED', 1)}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${
                              comparison.rental_mode === 'airbnb' 
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                                : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                            }`}
                          >
                            {comparison.rental_mode === 'airbnb' ? '🏖️ Airbnb' : '🏠 Long-Term'}
                          </Badge>
                          <span className="text-theme-text-muted">
                            {new Date(comparison.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <TrendingUp className="w-5 h-5 text-theme-text-muted group-hover:text-theme-accent transition-colors" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <ComparisonConfiguratorModal
          open={configuratorOpen}
          onOpenChange={setConfiguratorOpen}
          onCompare={handleCompare}
          initialExitMonths={exitMonths}
          handoverMonths={handoverMonths}
          currency={currency}
          rate={rate}
        />
        
        <LoadSecondaryComparisonModal
          open={loadModalOpen}
          onOpenChange={setLoadModalOpen}
          comparisons={comparisons}
          loading={comparisonsLoading}
          onLoad={handleLoadComparison}
          onDelete={deleteComparison}
          language={language}
        />
      </div>
    );
  }

  // Loading state - also show loading when quote is not ready yet
  if (quoteLoading || !quote) {
    return (
      <div className="min-h-screen bg-theme-bg">
        <TopNavbar />
        <div className="container mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-32 w-full bg-theme-border" />
          <Skeleton className="h-64 w-full bg-theme-border" />
          <Skeleton className="h-48 w-full bg-theme-border" />
        </div>
      </div>
    );
  }

  // Results view
  return (
    <div className="min-h-screen bg-theme-bg">
      <TopNavbar />

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header with In-Page Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              {projectName}
            </Badge>
            <span className="text-theme-text-muted">{t.vs}</span>
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/30">
              {t.secondaryLabel} {formatCurrency(secondaryInputs.purchasePrice, 'AED', 1)}
              {currency !== 'AED' && (
                <span className="ml-1 opacity-70">
                  ({formatCurrency(secondaryInputs.purchasePrice, currency, rate)})
                </span>
              )}
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Rental Mode Toggle */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-theme-card border border-theme-border">
              <Home className={`w-4 h-4 ${rentalMode === 'long-term' ? 'text-theme-accent' : 'text-theme-text-muted'}`} />
              <Switch
                checked={rentalMode === 'airbnb'}
                onCheckedChange={(checked) => setRentalMode(checked ? 'airbnb' : 'long-term')}
              />
              <Palmtree className={`w-4 h-4 ${rentalMode === 'airbnb' ? 'text-theme-accent' : 'text-theme-text-muted'}`} />
            </div>

            {/* Currency Dropdown */}
            <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
              <SelectTrigger className="w-[120px] border-theme-border bg-theme-card text-theme-text h-9">
                <Coins className="w-3.5 h-3.5 mr-1 text-theme-accent" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border">
                {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key} className="text-theme-text">
                    {config.flag} {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLoadModalOpen(true)}
              className="border-theme-border text-theme-text"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {t.load}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveModalOpen(true)}
              className="border-theme-accent/50 text-theme-accent hover:bg-theme-accent/10"
            >
              <Save className="w-4 h-4 mr-2" />
              {currentComparisonId ? t.update : t.save}
            </Button>
            
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
            appreciationDuringConstruction={appreciationDuringConstruction}
            constructionMonths={handoverYearIndex * 12}
            secondaryTotalIncomeAtHandover={secondaryTotalIncomeAtHandover}
            offPlanPropertyValue10Y={offPlanPropertyValue10Y}
            secondaryPropertyValue10Y={secondaryPropertyValue10Y}
          />

          {/* 2. Year-by-Year Wealth Table */}
          <YearByYearWealthTable
            offPlanProjections={offPlanCalcs.yearlyProjections}
            secondaryProjections={secondaryCalcs.yearlyProjections}
            offPlanCapitalInvested={comparisonMetrics.offPlanCapitalDay1}
            handoverYearIndex={handoverYearIndex}
            rentalMode={rentalMode}
            currency={currency}
            rate={rate}
            language={language}
            offPlanBasePrice={safeOffPlanInputs.basePrice}
            secondaryPurchasePrice={secondaryInputs.purchasePrice}
          />

          {/* 4. Wealth Trajectory Chart */}
          <WealthTrajectoryDualChart
            offPlanProjections={offPlanCalcs.yearlyProjections}
            secondaryProjections={secondaryCalcs.yearlyProjections}
            offPlanCapitalInvested={comparisonMetrics.offPlanCapitalDay1}
            secondaryCapitalInvested={secondaryCalcs.totalCapitalDay1}
            handoverYearIndex={handoverYearIndex}
            showAirbnb={rentalMode === 'airbnb'}
            language={language}
          />

          {/* 5. Exit Scenarios Comparison */}
          {exitMonths.length > 0 && (
            <ExitScenariosComparison
              exitMonths={exitMonths}
              offPlanInputs={safeOffPlanInputs}
              offPlanBasePrice={safeOffPlanInputs.basePrice}
              offPlanTotalMonths={offPlanCalcs.totalMonths}
              offPlanEntryCosts={offPlanCalcs.totalEntryCosts}
              secondaryPurchasePrice={secondaryInputs.purchasePrice}
              secondaryAppreciationRate={secondaryInputs.appreciationRate}
              currency={currency}
              rate={rate}
              language={language}
            />
          )}

          {/* 6. Out of Pocket Analysis */}
          <OutOfPocketCard
            offPlanCapitalDuringConstruction={offPlanTotalCapitalAtHandover}
            monthsWithoutIncome={handoverYearIndex * 12}
            appreciationDuringConstruction={appreciationDuringConstruction}
            secondaryCapitalDay1={secondaryCalcs.totalCapitalDay1}
            secondaryIncomeMonths={handoverYearIndex * 12}
            secondaryPurchasePrice={secondaryInputs.purchasePrice}
            currency={currency}
            rate={rate}
            language={language}
          />

          {/* 6b. Mortgage Coverage Card (when mortgage enabled) */}
          {secondaryInputs.useMortgage && secondaryCalcs.monthlyMortgagePayment > 0 && (
            <MortgageCoverageCard
              monthlyRent={
                rentalMode === 'long-term' 
                  ? secondaryCalcs.monthlyRentLT 
                  : secondaryCalcs.monthlyRentST
              }
              monthlyMortgage={secondaryCalcs.monthlyMortgagePayment}
              netCashflow={
                rentalMode === 'long-term'
                  ? secondaryCalcs.monthlyCashflowLT
                  : secondaryCalcs.monthlyCashflowST
              }
              coveragePercent={
                secondaryCalcs.monthlyMortgagePayment > 0
                  ? ((rentalMode === 'long-term' 
                      ? secondaryCalcs.monthlyRentLT 
                      : secondaryCalcs.monthlyRentST) / secondaryCalcs.monthlyMortgagePayment) * 100
                  : 100
              }
              currency={currency}
              rate={rate}
              language={language}
              loanAmount={secondaryCalcs.loanAmount}
              principalPaidYear10={secondaryPrincipalPaid10Y}
            />
          )}

          {/* 6c. Rental Comparison at Handover */}
          <RentalComparisonAtHandover
            offPlanMonthlyRent={offPlanMonthlyRentAtHandover}
            secondaryMonthlyRent={secondaryMonthlyRentAtHandover}
            handoverYear={handoverYearIndex}
            currency={currency}
            rate={rate}
            language={language}
          />

          {/* 7. Verdict */}
          <ComparisonVerdict
            metrics={comparisonMetrics}
            offPlanProjectName={projectName}
            language={language}
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
        currency={currency}
        rate={rate}
        language={language}
      />

      {/* Save Modal */}
      <SaveSecondaryComparisonModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        onSave={handleSaveComparison}
        isUpdating={!!currentComparisonId}
        currentTitle={currentComparisonTitle}
        language={language}
      />

      {/* Load Modal */}
      <LoadSecondaryComparisonModal
        open={loadModalOpen}
        onOpenChange={setLoadModalOpen}
        comparisons={comparisons}
        loading={comparisonsLoading}
        onLoad={handleLoadComparison}
        onDelete={deleteComparison}
        language={language}
      />
    </div>
  );
};

export default OffPlanVsSecondary;
