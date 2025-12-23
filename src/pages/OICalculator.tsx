import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { LayoutDashboard, Home, TrendingUp, SlidersHorizontal, Settings2, CreditCard, AlertCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OIInputModal } from "@/components/roi/OIInputModal";
import { OIGrowthCurve } from "@/components/roi/OIGrowthCurve";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { PaymentBreakdown } from "@/components/roi/PaymentBreakdown";
import { PaymentSplitBreakdown } from "@/components/roi/PaymentSplitBreakdown";
import { InvestmentSnapshot } from "@/components/roi/InvestmentSnapshot";
import { RentSnapshot } from "@/components/roi/RentSnapshot";
import { ExitScenariosCards, calculateAutoExitScenarios } from "@/components/roi/ExitScenariosCards";
import { ClientUnitInfo, ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { ClientUnitModal } from "@/components/roi/ClientUnitModal";
import { QuotesDropdown } from "@/components/roi/QuotesDropdown";
import { SettingsDropdown } from "@/components/roi/SettingsDropdown";
import { AdvisorInfo } from "@/components/roi/AdvisorInfo";
import { CumulativeIncomeChart } from "@/components/roi/CumulativeIncomeChart";
import { WealthSummaryCard } from "@/components/roi/WealthSummaryCard";
import { ViewVisibilityControls, ViewVisibility } from "@/components/roi/ViewVisibilityControls";
import { CollapsibleSection } from "@/components/roi/CollapsibleSection";
import { LoadQuoteModal } from "@/components/roi/LoadQuoteModal";
import { CashflowSkeleton } from "@/components/roi/CashflowSkeleton";
import { CashflowErrorBoundary, SectionErrorBoundary } from "@/components/roi/ErrorBoundary";
import { MortgageModal } from "@/components/roi/MortgageModal";
import { MortgageBreakdown } from "@/components/roi/MortgageBreakdown";
import { useMortgageCalculations, MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from "@/components/roi/useMortgageCalculations";
import { AlertTriangle, Save, Loader2, Check } from "lucide-react";
import { useOICalculations, OIInputs } from "@/components/roi/useOICalculations";
import { migrateInputs } from "@/components/roi/inputMigration";
import { Currency } from "@/components/roi/currencyUtils";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useCashflowQuote } from "@/hooks/useCashflowQuote";
import { useProfile } from "@/hooks/useProfile";
import { useAdminRole } from "@/hooks/useAuth";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { exportCashflowPDF } from "@/lib/pdfExport";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const DEFAULT_INPUTS: OIInputs = {
  basePrice: 800000, rentalYieldPercent: 8.5, appreciationRate: 10, bookingMonth: 1, bookingYear: 2025, handoverQuarter: 4, handoverYear: 2027, downpaymentPercent: 20, preHandoverPercent: 20, additionalPayments: [], eoiFee: 50000, oqoodFee: 5000, minimumExitThreshold: 30, showAirbnbComparison: false, shortTermRental: { averageDailyRate: 800, occupancyPercent: 70, operatingExpensePercent: 25, managementFeePercent: 15 }, zoneMaturityLevel: 60, useZoneDefaults: true, constructionAppreciation: 12, growthAppreciation: 8, matureAppreciation: 4, growthPeriodYears: 5, rentGrowthRate: 4, serviceChargePerSqft: 18, adrGrowthRate: 3,
};

const DEFAULT_CLIENT_INFO: ClientUnitData = { developer: '', projectName: '', clients: [], brokerName: '', unit: '', unitSizeSqf: 0, unitSizeM2: 0, unitType: '' };

const OICalculatorContent = () => {
  useDocumentTitle("Cashflow Generator");
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [loadQuoteModalOpen, setLoadQuoteModalOpen] = useState(false);
  const [mortgageModalOpen, setMortgageModalOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>('AED');
  const [inputs, setInputs] = useState<OIInputs>(DEFAULT_INPUTS);
  const [clientInfo, setClientInfo] = useState<ClientUnitData>(DEFAULT_CLIENT_INFO);
  const [mortgageInputs, setMortgageInputs] = useState<MortgageInputs>(DEFAULT_MORTGAGE_INPUTS);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  

  const { profile } = useProfile();
  const { isAdmin } = useAdminRole();
  const { quote, loading: quoteLoading, saving, lastSaved, saveQuote, saveAsNew, scheduleAutoSave, generateShareToken, loadDraft } = useCashflowQuote(quoteId);
  const calculations = useOICalculations(inputs);
  const mortgageAnalysis = useMortgageCalculations({
    mortgageInputs,
    basePrice: calculations.basePrice,
    preHandoverPercent: inputs.preHandoverPercent,
  });
  const { rate, isLive } = useExchangeRate(currency);

  // Stricter validation: needs both client details AND property configured
  const hasClientDetails = useMemo(() => {
    return !!(
      clientInfo.developer &&
      clientInfo.projectName &&
      clientInfo.unit &&
      clientInfo.unitSizeSqf > 0
    );
  }, [clientInfo.developer, clientInfo.projectName, clientInfo.unit, clientInfo.unitSizeSqf]);

  const hasPropertyConfigured = useMemo(() => {
    return inputs.basePrice !== 800000 || !!quoteId;
  }, [inputs.basePrice, quoteId]);

  const isFullyConfigured = hasClientDetails && hasPropertyConfigured;

  // Keep isQuoteConfigured for autosave logic (less strict)
  const isQuoteConfigured = useMemo(() => {
    return (
      !!quoteId ||
      !!clientInfo.developer ||
      !!clientInfo.projectName ||
      inputs.basePrice !== 800000
    );
  }, [quoteId, clientInfo.developer, clientInfo.projectName, inputs.basePrice]);

  useEffect(() => {
    if (dataLoaded) return;
    if (quote) {
      const savedClients = (quote.inputs as any)?._clients || [];
      const savedClientInfo = (quote.inputs as any)?._clientInfo || {};
      const savedMortgageInputs = (quote.inputs as any)?._mortgageInputs;
      const cleanInputs = { ...quote.inputs };
      delete (cleanInputs as any)._clients;
      delete (cleanInputs as any)._clientInfo;
      delete (cleanInputs as any)._mortgageInputs;
      // Migrate inputs to ensure all fields have defaults
      setInputs(migrateInputs(cleanInputs));
      const clients = savedClients.length > 0 ? savedClients : quote.client_name ? [{ id: '1', name: quote.client_name, country: quote.client_country || '' }] : [];
      setClientInfo({ 
        developer: savedClientInfo.developer || quote.developer || '', 
        projectName: savedClientInfo.projectName || quote.project_name || '', 
        clients, 
        brokerName: savedClientInfo.brokerName || '', 
        unit: savedClientInfo.unit || quote.unit || '', 
        unitSizeSqf: savedClientInfo.unitSizeSqf || quote.unit_size_sqf || 0, 
        unitSizeM2: savedClientInfo.unitSizeM2 || quote.unit_size_m2 || 0, 
        unitType: savedClientInfo.unitType || quote.unit_type || '',
        splitEnabled: savedClientInfo.splitEnabled || false,
        clientShares: savedClientInfo.clientShares || [],
        zoneId: savedClientInfo.zoneId || '',
        zoneName: savedClientInfo.zoneName || '',
      });
      if (savedMortgageInputs) {
        setMortgageInputs(savedMortgageInputs);
      }
      setDataLoaded(true);
    } else if (!quoteId) {
      const draft = loadDraft();
      // Migrate draft inputs to ensure all fields have defaults
      if (draft?.inputs) setInputs(migrateInputs(draft.inputs));
      if (draft?.clientInfo) setClientInfo(prev => ({ ...prev, ...draft.clientInfo }));
      setDataLoaded(true);
    }
  }, [quote, quoteId, dataLoaded, loadDraft]);

  useEffect(() => { setDataLoaded(false); }, [quoteId]);
  useEffect(() => { if (profile?.full_name && !clientInfo.brokerName) setClientInfo(prev => ({ ...prev, brokerName: profile.full_name || '' })); }, [profile?.full_name]);
  useEffect(() => { if (clientInfo.unitSizeSqf && clientInfo.unitSizeSqf !== inputs.unitSizeSqf) setInputs(prev => ({ ...prev, unitSizeSqf: clientInfo.unitSizeSqf })); }, [clientInfo.unitSizeSqf]);
  useEffect(() => { if (!quoteLoading) scheduleAutoSave(inputs, clientInfo, quote?.id, isQuoteConfigured, mortgageInputs); }, [inputs, clientInfo, quote?.id, quoteLoading, isQuoteConfigured, mortgageInputs, scheduleAutoSave]);

  // Exit scenarios state - load from saved quote or auto-calculate
  const [exitScenarios, setExitScenarios] = useState<number[]>(() => calculateAutoExitScenarios(calculations.totalMonths));
  const [exitScenariosInitialized, setExitScenariosInitialized] = useState(false);
  
  // Initialize exit scenarios from saved quote (once) and clamp to bounds
  useEffect(() => {
    if (!dataLoaded || exitScenariosInitialized) return;
    const savedExitScenarios = (quote?.inputs as any)?._exitScenarios;
    if (savedExitScenarios && Array.isArray(savedExitScenarios) && savedExitScenarios.length > 0) {
      // Clamp saved exit scenarios to valid bounds (1 to totalMonths)
      const clampedScenarios = savedExitScenarios
        .map((m: number) => Math.min(Math.max(1, m), calculations.totalMonths))
        .filter((m: number, i: number, arr: number[]) => arr.indexOf(m) === i); // Remove duplicates
      setExitScenarios(clampedScenarios.length > 0 ? clampedScenarios : calculateAutoExitScenarios(calculations.totalMonths));
    } else {
      setExitScenarios(calculateAutoExitScenarios(calculations.totalMonths));
    }
    setExitScenariosInitialized(true);
  }, [dataLoaded, quote, calculations.totalMonths, exitScenariosInitialized]);

  const handleSave = useCallback(async () => saveQuote(inputs, clientInfo, quote?.id, exitScenarios), [inputs, clientInfo, quote?.id, exitScenarios, saveQuote]);
  const handleSaveAs = useCallback(async () => { const newQuote = await saveAsNew(inputs, clientInfo, exitScenarios); if (newQuote) navigate(`/cashflow/${newQuote.id}`); return newQuote; }, [inputs, clientInfo, exitScenarios, saveAsNew, navigate]);
  const handleShare = useCallback(async () => {
    // Always save first to ensure the client sees the latest data (including exit scenarios)
    const savedQuote = await saveQuote(inputs, clientInfo, quote?.id, exitScenarios);
    if (!savedQuote) return null;
    
    const token = await generateShareToken(savedQuote.id);
    if (token) {
      return `${window.location.origin}/view/${token}`;
    }
    return null;
  }, [quote?.id, inputs, clientInfo, exitScenarios, mortgageInputs, saveQuote, generateShareToken]);

  const handleExportPDF = useCallback(async (visibility: ViewVisibility) => {
    await exportCashflowPDF({
      inputs,
      clientInfo,
      calculations,
      exitScenarios,
      advisorName: profile?.full_name || '',
      currency,
      rate,
      visibility,
    });
  }, [inputs, clientInfo, calculations, exitScenarios, profile?.full_name, currency, rate]);

  const lastProjection = calculations.yearlyProjections[calculations.yearlyProjections.length - 1];
  const totalCapitalInvested = calculations.basePrice + calculations.totalEntryCosts;

  if (quoteLoading && quoteId) {
    return <CashflowSkeleton />;
  }

  return (
    <CashflowErrorBoundary>
      <div className="min-h-screen bg-[#0f172a]">
      <div className="hidden print-only print:block bg-[#0f172a] text-white p-6 mb-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-[#CCFF00]">CASHFLOW GENERATOR</h1><p className="text-gray-400 text-sm mt-1">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
          {profile && <div className="text-right"><p className="text-sm text-gray-400">{t('advisor')}</p><p className="font-medium">{profile.full_name || 'Advisor'}</p></div>}
        </div>
      </div>

      <header className="border-b border-[#2a3142] bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Main header row */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Navigation + Advisor */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/home">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e] h-8 w-8 sm:h-9 sm:w-9">
                  <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/dashboard">
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e] h-8 w-8 sm:h-9 sm:w-9">
                    <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </Link>
              )}
              {profile && <AdvisorInfo profile={profile} size="lg" showSubtitle />}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Save Button with Status */}
              <div className="flex items-center gap-1.5">
                {saving ? (
                  <span className="text-xs text-gray-400 flex items-center">
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </span>
                ) : lastSaved ? (
                  <span className="text-xs text-gray-500 flex items-center">
                    <Check className="w-3 h-3 text-green-500" />
                  </span>
                ) : null}
                <Button
                  variant="outlineDark"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-8 px-2 sm:px-3"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">Save</span>
                </Button>
              </div>

              {/* Quotes Dropdown - Load/View */}
              <QuotesDropdown
                saving={saving}
                lastSaved={lastSaved}
                onSave={handleSave}
                onSaveAs={handleSaveAs}
                onLoadQuote={() => setLoadQuoteModalOpen(true)}
              />

              {/* Share Controls */}
              <ViewVisibilityControls shareUrl={shareUrl} onGenerateShareUrl={handleShare} onExportPDF={handleExportPDF} />

              {/* Separator */}
              <div className="w-px h-6 bg-[#2a3142] mx-0.5" />

              {/* Settings Dropdown - Profile/Language/Currency */}
              <SettingsDropdown
                language={language}
                setLanguage={setLanguage}
                currency={currency}
                setCurrency={setCurrency}
                exchangeRate={rate}
                isLive={isLive}
              />

              {/* Mortgage Calculator Button */}
              <MortgageModal
                mortgageInputs={mortgageInputs}
                setMortgageInputs={setMortgageInputs}
                preHandoverPercent={inputs.preHandoverPercent}
                open={mortgageModalOpen}
                onOpenChange={setMortgageModalOpen}
              />

              {/* Configure Button - Always visible */}
              <ClientUnitModal data={clientInfo} onChange={setClientInfo} open={clientModalOpen} onOpenChange={setClientModalOpen} />
              <OIInputModal inputs={inputs} setInputs={setInputs} open={modalOpen} onOpenChange={setModalOpen} currency={currency} />
              <LoadQuoteModal open={loadQuoteModalOpen} onOpenChange={setLoadQuoteModalOpen} />
              
            </div>
          </div>
        </div>
      </header>

      {/* Unsaved Draft Warning Banner */}
      {isQuoteConfigured && !quoteId && !lastSaved && (
        <div className="bg-amber-900/30 border-b border-amber-700/50 print:hidden">
          <div className="container mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-200 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Draft – Changes are only saved locally on this device. Save to prevent data loss.</span>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5 flex-shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Now'}
            </Button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <ClientUnitInfo data={clientInfo} onEditClick={() => setClientModalOpen(true)} />

        {!isFullyConfigured ? (
          /* Unconfigured State - Show what's missing */
          <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#CCFF00]/20 flex items-center justify-center mx-auto mb-6">
                {!hasClientDetails ? <AlertCircle className="w-8 h-8 text-[#CCFF00]" /> : <Settings2 className="w-8 h-8 text-[#CCFF00]" />}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {!hasClientDetails ? t('completeClientInfo') : t('configurePropertyFinancials')}
              </h3>
              <p className="text-gray-400 mb-6">
                {!hasClientDetails ? t('completeClientInfoDesc') : t('configurePropertyFinancialsDesc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {!hasClientDetails ? (
                  <Button
                    onClick={() => setClientModalOpen(true)}
                    className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 gap-2"
                  >
                    <Settings2 className="w-4 h-4" />
                    Set Client & Property
                  </Button>
                ) : (
                  <Button
                    onClick={() => setModalOpen(true)}
                    className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Configure Financials
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Configured State - Show full content */
          <>
            {/* Payment Breakdown 2/3 + Investment Snapshot 1/3 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              <div className="lg:col-span-2 space-y-4">
                <PaymentBreakdown inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} rate={rate} unitSizeSqf={clientInfo.unitSizeSqf} />
              </div>
              <div className="lg:col-span-1 space-y-4">
                <InvestmentSnapshot inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} totalEntryCosts={calculations.totalEntryCosts} rate={rate} holdAnalysis={calculations.holdAnalysis} />
                {clientInfo.splitEnabled && clientInfo.clients.length >= 2 && (
                  <PaymentSplitBreakdown inputs={inputs} clientInfo={clientInfo} currency={currency} totalMonths={calculations.totalMonths} rate={rate} />
                )}
              </div>
            </div>

            {/* Hold Strategy Analysis - Collapsible */}
            <CollapsibleSection
              title={t('holdStrategyAnalysis') || "Hold Strategy Analysis"}
              subtitle={t('holdStrategySubtitle') || "Long-term rental projections and wealth accumulation"}
              icon={<Home className="w-5 h-5 text-[#CCFF00]" />}
              defaultOpen={true}
            >
              <div className="space-y-4 sm:space-y-6">
                <RentSnapshot inputs={inputs} currency={currency} rate={rate} holdAnalysis={calculations.holdAnalysis} />
                <CumulativeIncomeChart projections={calculations.yearlyProjections} currency={currency} rate={rate} totalCapitalInvested={totalCapitalInvested} showAirbnbComparison={calculations.showAirbnbComparison} />
                <OIYearlyProjectionTable 
                  projections={calculations.yearlyProjections} 
                  currency={currency} 
                  rate={rate} 
                  showAirbnbComparison={calculations.showAirbnbComparison} 
                  unitSizeSqf={clientInfo.unitSizeSqf}
                  showMortgage={mortgageInputs.enabled}
                  mortgageMonthlyPayment={mortgageAnalysis.monthlyPayment}
                  mortgageStartYear={inputs.handoverYear}
                />
                <WealthSummaryCard propertyValueYear10={lastProjection.propertyValue} cumulativeRentIncome={lastProjection.cumulativeNetIncome} airbnbCumulativeIncome={calculations.showAirbnbComparison ? lastProjection.airbnbCumulativeNetIncome : undefined} initialInvestment={totalCapitalInvested} currency={currency} rate={rate} showAirbnbComparison={calculations.showAirbnbComparison} />
              </div>
            </CollapsibleSection>

            {/* Exit Scenarios - Collapsible */}
            <CollapsibleSection
              title={t('exitStrategyAnalysis') || "Exit Strategy Analysis"}
              subtitle={t('whenToSell') || "When to sell for maximum returns"}
              icon={<TrendingUp className="w-5 h-5 text-[#CCFF00]" />}
              defaultOpen={false}
            >
              <div className="space-y-4 sm:space-y-6">
                <ExitScenariosCards inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} basePrice={calculations.basePrice} totalEntryCosts={calculations.totalEntryCosts} exitScenarios={exitScenarios} setExitScenarios={setExitScenarios} rate={rate} unitSizeSqf={clientInfo.unitSizeSqf} />
                <OIGrowthCurve calculations={calculations} inputs={inputs} currency={currency} exitScenarios={exitScenarios} rate={rate} />
              </div>
            </CollapsibleSection>

            {/* Mortgage Analysis - Collapsible */}
            {mortgageInputs.enabled && (
              <CollapsibleSection
                title={t('mortgageAnalysis') || "Mortgage Analysis"}
                subtitle={t('mortgageAnalysisSubtitle') || "Loan structure, fees, and impact on cashflow"}
                icon={<Building2 className="w-5 h-5 text-blue-400" />}
                defaultOpen={true}
              >
                {(() => {
                  // Calculate monthly rent figures for mortgage comparison
                  const handoverProjection = calculations.yearlyProjections.find(p => p.isHandover);
                  const monthlyLongTermRent = handoverProjection?.annualRent ? handoverProjection.annualRent / 12 : undefined;
                  const monthlyServiceCharges = handoverProjection?.serviceCharges ? handoverProjection.serviceCharges / 12 : undefined;
                  const monthlyAirbnbNet = handoverProjection?.airbnbNetIncome ? handoverProjection.airbnbNetIncome / 12 : undefined;
                  
                  return (
                    <MortgageBreakdown
                      mortgageInputs={mortgageInputs}
                      mortgageAnalysis={mortgageAnalysis}
                      basePrice={calculations.basePrice}
                      currency={currency}
                      rate={rate}
                      preHandoverPercent={inputs.preHandoverPercent}
                      monthlyLongTermRent={monthlyLongTermRent}
                      monthlyServiceCharges={monthlyServiceCharges}
                      monthlyAirbnbNet={monthlyAirbnbNet}
                      showAirbnbComparison={calculations.showAirbnbComparison}
                    />
                  );
                })()}
              </CollapsibleSection>
            )}
          </>
        )}

        <div className="mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-4 print:hidden">
          <Link to="/my-quotes"><Button variant="outlineAccent" className="text-xs sm:text-sm">{t('myQuotes')}</Button></Link>
          <Link to="/roi-calculator"><Button variant="outlineDark" className="text-xs sm:text-sm">{t('fullROICalculator')}</Button></Link>
        </div>
      </main>
    </div>
    </CashflowErrorBoundary>
  );
};

export default OICalculatorContent;
