import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Home, TrendingUp, CreditCard, Building2, Sparkles, Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OIInputModal } from "@/components/roi/OIInputModal";
import { OIGrowthCurve } from "@/components/roi/OIGrowthCurve";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { PaymentBreakdown } from "@/components/roi/PaymentBreakdown";
import { InvestmentSnapshot } from "@/components/roi/InvestmentSnapshot";
import { InvestmentOverviewGrid } from "@/components/roi/InvestmentOverviewGrid";
import { RentSnapshot } from "@/components/roi/RentSnapshot";
import { ExitScenariosCards } from "@/components/roi/ExitScenariosCards";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { PropertyHeroCard } from "@/components/roi/PropertyHeroCard";
import { ClientUnitModal } from "@/components/roi/ClientUnitModal";
import { CumulativeIncomeChart } from "@/components/roi/CumulativeIncomeChart";
import { WealthSummaryCard } from "@/components/roi/WealthSummaryCard";
import { ViewVisibility } from "@/components/roi/ViewVisibilityControls";
import { CollapsibleSection } from "@/components/roi/CollapsibleSection";
import { CashflowSummaryCard } from "@/components/roi/CashflowSummaryCard";
import { LoadQuoteModal } from "@/components/roi/LoadQuoteModal";
import { VersionHistoryModal } from "@/components/roi/VersionHistoryModal";
import { CashflowSkeleton } from "@/components/roi/CashflowSkeleton";
import { CashflowErrorBoundary } from "@/components/roi/ErrorBoundary";
import { MortgageModal } from "@/components/roi/MortgageModal";
import { MortgageBreakdown } from "@/components/roi/MortgageBreakdown";
import { useMortgageCalculations, MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from "@/components/roi/useMortgageCalculations";
import { ValueDifferentiatorsDisplay } from "@/components/roi/ValueDifferentiatorsDisplay";
import { DeveloperInfoModal } from "@/components/roi/DeveloperInfoModal";
import { ProjectInfoModal } from "@/components/roi/ProjectInfoModal";
import { FloorPlanLightbox } from "@/components/roi/FloorPlanLightbox";
import { AlertTriangle, Save } from "lucide-react";
import { useOICalculations, OIInputs } from "@/components/roi/useOICalculations";
import { migrateInputs } from "@/components/roi/inputMigration";
import { Currency } from "@/components/roi/currencyUtils";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useCashflowQuote } from "@/hooks/useCashflowQuote";
import { useQuoteVersions } from "@/hooks/useQuoteVersions";
import { useProfile } from "@/hooks/useProfile";
import { useAdminRole } from "@/hooks/useAuth";
import { useCustomDifferentiators } from "@/hooks/useCustomDifferentiators";
import { useLanguage } from "@/contexts/LanguageContext";
import { exportCashflowPDF } from "@/lib/pdfExport";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/roi/dashboard";
import { OverviewTabContent } from "@/components/roi/tabs/OverviewTabContent";
import { SnapshotContent } from "@/components/roi/snapshot";
import { ExportModal } from "@/components/roi/ExportModal";

import { NEW_QUOTE_OI_INPUTS } from "@/components/roi/configurator/types";

const DEFAULT_CLIENT_INFO: ClientUnitData = { developer: '', projectName: '', clients: [], brokerName: '', unit: '', unitSizeSqf: 0, unitSizeM2: 0, unitType: '' };

const OICalculatorContent = () => {
  useDocumentTitle("Cashflow Generator");
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [loadQuoteModalOpen, setLoadQuoteModalOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [mortgageModalOpen, setMortgageModalOpen] = useState(false);
  const [developerModalOpen, setDeveloperModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [floorPlanLightboxOpen, setFloorPlanLightboxOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>('AED');
  const [inputs, setInputs] = useState<OIInputs>(NEW_QUOTE_OI_INPUTS);
  const [clientInfo, setClientInfo] = useState<ClientUnitData>(DEFAULT_CLIENT_INFO);
  const [mortgageInputs, setMortgageInputs] = useState<MortgageInputs>(DEFAULT_MORTGAGE_INPUTS);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  type ViewMode = 'cashflow' | 'snapshot';
  const [viewMode, setViewMode] = useState<ViewMode>('cashflow');
  
  // Ref for client-side export capture
  const mainContentRef = useRef<HTMLDivElement>(null);

  const { profile } = useProfile();
  const { isAdmin } = useAdminRole();
  const { customDifferentiators } = useCustomDifferentiators();
  const { quote, loading: quoteLoading, saving, lastSaved, quoteImages, setQuoteImages, saveQuote, saveAsNew, scheduleAutoSave, generateShareToken, createDraft } = useCashflowQuote(quoteId);
  const { saveVersion } = useQuoteVersions(quoteId);
  const calculations = useOICalculations(inputs);
  const mortgageAnalysis = useMortgageCalculations({
    mortgageInputs,
    basePrice: calculations.basePrice,
    preHandoverPercent: inputs.preHandoverPercent,
    monthlyRent: calculations.holdAnalysis.annualRent / 12,
    monthlyServiceCharges: calculations.holdAnalysis.annualServiceCharges / 12,
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
    return inputs.basePrice > 0 || !!quoteId;
  }, [inputs.basePrice, quoteId]);

  const isFullyConfigured = hasClientDetails && hasPropertyConfigured;

  // Keep isQuoteConfigured for autosave logic (less strict)
  const isQuoteConfigured = useMemo(() => {
    return (
      !!quoteId ||
      !!clientInfo.developer ||
      !!clientInfo.projectName ||
      inputs.basePrice > 0
    );
  }, [quoteId, clientInfo.developer, clientInfo.projectName, inputs.basePrice]);

  // LAZY CREATION: No draft created on mount - quote created on first meaningful change
  // This prevents empty quotes from cluttering the database

  // Load quote data from database
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
        // Merge saved values over defaults to ensure all fields exist
        setMortgageInputs({ ...DEFAULT_MORTGAGE_INPUTS, ...savedMortgageInputs });
      } else {
        // No mortgage data saved - keep defaults (disabled)
        setMortgageInputs(DEFAULT_MORTGAGE_INPUTS);
      }
      setDataLoaded(true);
    }
  }, [quote, quoteId, dataLoaded]);

  // Check for preselected client from ClientCard navigation
  useEffect(() => {
    if (quoteId) return; // Only for new quotes
    
    const preselectedClient = localStorage.getItem('preselected_client');
    if (preselectedClient) {
      try {
        const clientData = JSON.parse(preselectedClient);
        setClientInfo(prev => ({
          ...prev,
          clients: [{
            id: '1',
            name: clientData.clientName || '',
            country: clientData.clientCountry || '',
            email: clientData.clientEmail || ''
          }],
          dbClientId: clientData.dbClientId || undefined
        }));
        // Clear the localStorage after use
        localStorage.removeItem('preselected_client');
        // Open configurator so user can continue setting up
        setModalOpen(true);
      } catch (e) {
        console.error('Failed to parse preselected client:', e);
        localStorage.removeItem('preselected_client');
      }
    }
  }, [quoteId]);

  useEffect(() => { setDataLoaded(false); }, [quoteId]);
  useEffect(() => { if (profile?.full_name && !clientInfo.brokerName) setClientInfo(prev => ({ ...prev, brokerName: profile?.full_name || '' })); }, [profile?.full_name]);
  useEffect(() => { if (clientInfo.unitSizeSqf && clientInfo.unitSizeSqf !== inputs.unitSizeSqf) setInputs(prev => ({ ...prev, unitSizeSqf: clientInfo.unitSizeSqf })); }, [clientInfo.unitSizeSqf]);

  // Handler for when a new quote is auto-created
  const handleNewQuoteCreated = useCallback((newId: string) => {
    if (modalOpen) {
      // Use navigation state instead of localStorage
      navigate(`/cashflow/${newId}`, { replace: true, state: { openConfigurator: true } });
    } else {
      navigate(`/cashflow/${newId}`, { replace: true });
    }
  }, [navigate, modalOpen]);

  // Handle new quote creation - clears state and navigates to generator
  const handleNewQuote = useCallback(() => {
    // Clear configurator localStorage state for fresh start
    localStorage.removeItem('cashflow-configurator-state');
    localStorage.removeItem('cashflow_configurator_open');
    
    // Navigate to generator without a quoteId
    navigate('/cashflow-generator', { replace: true });
  }, [navigate]);

  // Keep configurator open when navigating to new quote (via navigation state)
  useEffect(() => {
    if (dataLoaded && location.state?.openConfigurator) {
      setModalOpen(true);
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [dataLoaded, location.state?.openConfigurator, navigate, location.pathname]);

  useEffect(() => {
    if (!dataLoaded) return;
    if (quoteLoading) return;

    const canUpdateExisting = !!quoteId && quote?.id === quoteId;
    const allowAutoCreate = !quoteId && isQuoteConfigured;

    scheduleAutoSave(
      inputs,
      clientInfo,
      canUpdateExisting ? quoteId : undefined,
      allowAutoCreate,
      mortgageInputs,
      { floorPlanUrl: quoteImages.floorPlanUrl, buildingRenderUrl: quoteImages.buildingRenderUrl, heroImageUrl: quoteImages.heroImageUrl },
      handleNewQuoteCreated,
      modalOpen
    );
  }, [inputs, clientInfo, quoteId, quote?.id, quoteLoading, isQuoteConfigured, mortgageInputs, scheduleAutoSave, dataLoaded, quoteImages.floorPlanUrl, quoteImages.buildingRenderUrl, quoteImages.heroImageUrl, handleNewQuoteCreated, modalOpen]);

  // Exit scenarios
  const exitScenarios = useMemo(() => {
    const saved = inputs._exitScenarios;
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved
        .map((m: number) => Math.min(Math.max(1, m), calculations.totalMonths))
        .filter((m: number, i: number, arr: number[]) => arr.indexOf(m) === i)
        .sort((a, b) => a - b);
    }
    return [];
  }, [inputs._exitScenarios, calculations.totalMonths]);

  const setExitScenarios = useCallback((newScenarios: number[]) => {
    setInputs(prev => ({ ...prev, _exitScenarios: newScenarios.sort((a, b) => a - b) }));
  }, []);

  const quoteImagesPayload = { floorPlanUrl: quoteImages.floorPlanUrl, buildingRenderUrl: quoteImages.buildingRenderUrl, heroImageUrl: quoteImages.heroImageUrl };
  const handleSave = useCallback(async () => saveQuote(inputs, clientInfo, quote?.id, exitScenarios, mortgageInputs, saveVersion, quoteImagesPayload), [inputs, clientInfo, quote?.id, exitScenarios, mortgageInputs, saveQuote, saveVersion, quoteImages]);
  const handleSaveAs = useCallback(async () => { const newQuote = await saveAsNew(inputs, clientInfo, exitScenarios, mortgageInputs, quoteImagesPayload); if (newQuote) navigate(`/cashflow/${newQuote.id}`); return newQuote; }, [inputs, clientInfo, exitScenarios, mortgageInputs, saveAsNew, navigate, quoteImages]);
  
  const handleShare = useCallback(async () => {
    const savedQuote = await saveQuote(inputs, clientInfo, quote?.id, exitScenarios, mortgageInputs, undefined, quoteImagesPayload);
    if (!savedQuote) return null;
    
    const token = await generateShareToken(savedQuote.id);
    if (token) {
      const url = `${window.location.origin}/view/${token}`;
      await navigator.clipboard.writeText(url);
      setShareUrl(url);
      toast.success("Share link copied to clipboard!");
      return url;
    }
    return null;
  }, [quote?.id, inputs, clientInfo, exitScenarios, mortgageInputs, saveQuote, generateShareToken, quoteImages]);

  // Present - opens the client view in a new tab
  const handlePresent = useCallback(async () => {
    const savedQuote = await saveQuote(inputs, clientInfo, quote?.id, exitScenarios, mortgageInputs, undefined, quoteImagesPayload);
    if (!savedQuote) return;
    
    let token = savedQuote.share_token;
    if (!token) {
      token = await generateShareToken(savedQuote.id);
    }
    
    if (token) {
      const url = `${window.location.origin}/view/${token}`;
      window.open(url, '_blank');
    }
  }, [quote?.id, inputs, clientInfo, exitScenarios, mortgageInputs, saveQuote, generateShareToken, quoteImages]);

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

  // View toggle handlers - switch between cashflow and snapshot views in-page
  const handleCashflowView = useCallback(() => {
    setViewMode('cashflow');
  }, []);

  const handleSnapshotView = useCallback(() => {
    setViewMode('snapshot');
  }, []);

  // Keyboard shortcut for view modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // C key = Cashflow, N key = Snapshot
      if ((e.key === 'c' || e.key === 'C') && isFullyConfigured) {
        setViewMode('cashflow');
      } else if ((e.key === 'n' || e.key === 'N') && isFullyConfigured) {
        setViewMode('snapshot');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullyConfigured]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if quote is configured but not yet saved to DB
      if (isQuoteConfigured && !quoteId && !lastSaved) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isQuoteConfigured, quoteId, lastSaved]);

  const lastProjection = calculations.yearlyProjections[calculations.yearlyProjections.length - 1];
  const totalCapitalInvested = calculations.basePrice + calculations.totalEntryCosts;

  if (quoteLoading && quoteId) {
    return <CashflowSkeleton />;
  }

  return (
    <CashflowErrorBoundary>
        <DashboardLayout
        inputs={inputs}
        mortgageInputs={mortgageInputs}
        mainContentRef={mainContentRef}
        profile={profile}
        isAdmin={isAdmin}
        onConfigure={() => setModalOpen(true)}
        onLoadQuote={() => setLoadQuoteModalOpen(true)}
        onViewHistory={() => setVersionHistoryOpen(true)}
        onShare={handleShare}
        onPresent={handleCashflowView}
        onSnapshot={handleSnapshotView}
        onNewQuote={handleNewQuote}
        activeView={viewMode}
        viewCount={quote?.view_count ?? undefined}
        quoteId={quoteId}
        shareToken={quote?.share_token ?? undefined}
        language={language}
        setLanguage={setLanguage}
        currency={currency}
        setCurrency={setCurrency}
        hasUnsavedChanges={isQuoteConfigured && !quoteId && !lastSaved}
        saving={saving}
        onSave={handleSave}
        onOpenExportModal={() => setExportModalOpen(true)}
      >

        {/* Draft banner removed - all quotes now auto-save to database */}

        {!isFullyConfigured ? (
          /* Unconfigured State */
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-theme-card border border-theme-border rounded-2xl p-8 sm:p-16 text-center max-w-lg">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-theme-accent/20 to-theme-accent/5 flex items-center justify-center mx-auto mb-8">
                <Rocket className="w-10 h-10 text-theme-accent" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-theme-text mb-4">
                Start Your Cashflow Analysis
              </h2>
              <p className="text-theme-text-muted mb-8 text-base sm:text-lg leading-relaxed">
                Configure your property details, payment plan, and investment assumptions to generate a comprehensive cashflow projection.
              </p>
              <div className="flex flex-col gap-4 items-center">
                <Button 
                  onClick={async () => {
                    // Clear configurator state for fresh start
                    localStorage.removeItem('cashflow-configurator-state');
                    
                    // Create draft immediately when starting configuration
                    if (!quoteId) {
                      const newId = await createDraft();
                      if (newId) {
                        // Use navigation state instead of localStorage
                        navigate(`/cashflow/${newId}`, { replace: true, state: { openConfigurator: true } });
                        return;
                      }
                    }
                    setModalOpen(true);
                  }}
                  size="lg"
                  className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90 font-semibold gap-2 px-8 h-12"
                >
                  <Sparkles className="w-5 h-5" />
                  Start Configuration
                </Button>
                <p className="text-sm text-theme-text-muted">
                  Set up property, client info, and financial parameters
                </p>
              </div>
            </div>
          </div>
        ) : viewMode === 'snapshot' ? (
          /* Snapshot Mode - Full-width view matching app styling */
          <SnapshotContent
            inputs={inputs}
            calculations={calculations}
            clientInfo={clientInfo}
            mortgageInputs={mortgageInputs}
            mortgageAnalysis={mortgageAnalysis}
            exitScenarios={exitScenarios}
            quoteImages={{
              heroImageUrl: quoteImages.heroImageUrl,
              floorPlanUrl: quoteImages.floorPlanUrl,
              buildingRenderUrl: quoteImages.buildingRenderUrl,
            }}
            currency={currency}
            setCurrency={setCurrency}
            language={language}
            setLanguage={setLanguage}
            rate={rate}
          />
        ) : (
          /* Configured State - All sections stacked vertically */
          <div className="space-y-6 animate-fade-in" key="cashflow-view">
            <PropertyHeroCard 
              data={clientInfo} 
              heroImageUrl={quoteImages.heroImageUrl}
              buildingRenderUrl={quoteImages.buildingRenderUrl}
              onEditClick={() => setClientModalOpen(true)} 
            />

            {/* Overview Section */}
            <div id="overview-section" className="scroll-mt-20">
              <InvestmentOverviewGrid
                inputs={inputs}
                calculations={calculations}
                mortgageAnalysis={mortgageAnalysis}
                mortgageEnabled={mortgageInputs.enabled}
                exitScenarios={exitScenarios}
                currency={currency}
                rate={rate}
                developerId={clientInfo.developerId}
                projectId={clientInfo.projectId}
                floorPlanUrl={quoteImages.floorPlanUrl}
                onViewDeveloper={() => clientInfo.developerId && setDeveloperModalOpen(true)}
                onViewProject={() => clientInfo.projectId && setProjectModalOpen(true)}
                onViewFloorPlan={() => quoteImages.floorPlanUrl && setFloorPlanLightboxOpen(true)}
              />
            </div>

            {/* Property Section */}
            <div id="property-section" className="scroll-mt-20">
              <InvestmentSnapshot inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} totalEntryCosts={calculations.totalEntryCosts} rate={rate} holdAnalysis={calculations.holdAnalysis} unitSizeSqf={clientInfo.unitSizeSqf} />
            </div>

            {/* Payments Section */}
            <div id="payments-section" className="scroll-mt-20">
              <CollapsibleSection
                title={t('paymentBreakdownTitle') || "Payment Breakdown"}
                subtitle={`${inputs.preHandoverPercent}/${100 - inputs.preHandoverPercent} ${t('paymentStructure') || 'payment structure'}`}
                icon={<CreditCard className="w-5 h-5 text-theme-accent" />}
                defaultOpen={false}
              >
                <PaymentBreakdown inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} rate={rate} unitSizeSqf={clientInfo.unitSizeSqf} clientInfo={clientInfo} />
              </CollapsibleSection>
            </div>

            {/* Value Differentiators */}
            <ValueDifferentiatorsDisplay
              selectedDifferentiators={inputs.valueDifferentiators || []}
              customDifferentiators={customDifferentiators}
              onEditClick={() => setModalOpen(true)}
            />

            {/* Hold Section */}
            {(inputs.enabledSections?.longTermHold !== false) && (
              <div id="hold-section" className="scroll-mt-20">
                <CollapsibleSection
                  title={t('holdStrategyAnalysis') || "Hold Strategy Analysis"}
                  subtitle={t('holdStrategySubtitle') || "Long-term rental projections and wealth accumulation"}
                  icon={<Home className="w-5 h-5 text-theme-accent" />}
                  defaultOpen={false}
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
                    />
                    <WealthSummaryCard propertyValueFinal={lastProjection.propertyValue} cumulativeRentIncome={lastProjection.cumulativeNetIncome} airbnbCumulativeIncome={calculations.showAirbnbComparison ? lastProjection.airbnbCumulativeNetIncome : undefined} initialInvestment={totalCapitalInvested} currency={currency} rate={rate} showAirbnbComparison={calculations.showAirbnbComparison} />
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* Exit Section */}
            {(inputs.enabledSections?.exitStrategy === true || 
              (inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0)) && (
              <div id="exit-section" className="scroll-mt-20">
                <CollapsibleSection
                  title={t('exitStrategyAnalysis') || "Exit Strategy Analysis"}
                  subtitle={t('whenToSell') || "When to sell for maximum returns"}
                  icon={<TrendingUp className="w-5 h-5 text-theme-accent" />}
                  defaultOpen={false}
                >
                  <div className="space-y-4 sm:space-y-6">
                    <ExitScenariosCards inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} basePrice={calculations.basePrice} totalEntryCosts={calculations.totalEntryCosts} exitScenarios={exitScenarios} setExitScenarios={setExitScenarios} rate={rate} unitSizeSqf={clientInfo.unitSizeSqf} />
                    <OIGrowthCurve calculations={calculations} inputs={inputs} currency={currency} exitScenarios={exitScenarios} rate={rate} />
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* Mortgage Section */}
            {mortgageInputs.enabled && (
              <div id="mortgage-section" className="scroll-mt-20">
                <CollapsibleSection
                  title={t('mortgageAnalysis') || "Mortgage Analysis"}
                  subtitle={t('mortgageAnalysisSubtitle') || "Loan structure, fees, and impact on cashflow"}
                  icon={<Building2 className="w-5 h-5 text-theme-accent" />}
                  defaultOpen={false}
                >
                  {(() => {
                    const firstFullRentalYear = calculations.yearlyProjections.find(p => 
                      !p.isConstruction && !p.isHandover && p.annualRent !== null && p.annualRent > 0
                    );
                    const fullAnnualRent = firstFullRentalYear?.annualRent || (inputs.basePrice * inputs.rentalYieldPercent / 100);
                    const monthlyLongTermRent = fullAnnualRent / 12;
                    const monthlyServiceCharges = (firstFullRentalYear?.serviceCharges || 0) / 12;
                    const fullAnnualAirbnbNet = firstFullRentalYear?.airbnbNetIncome || 0;
                    const monthlyAirbnbNet = fullAnnualAirbnbNet / 12;
                    const year5RentalYear = (firstFullRentalYear?.year || 0) + 4;
                    const year5Projection = calculations.yearlyProjections.find(p => p.year === year5RentalYear);
                    const year5LongTermRent = year5Projection?.annualRent ? (year5Projection.annualRent / 12) : undefined;
                    const year5AirbnbNet = year5Projection?.airbnbNetIncome ? (year5Projection.airbnbNetIncome / 12) : undefined;
                    
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
                        year5LongTermRent={year5LongTermRent}
                        year5AirbnbNet={year5AirbnbNet}
                        rentGrowthRate={inputs.rentGrowthRate}
                      />
                    );
                  })()}
                </CollapsibleSection>
              </div>
            )}

            {/* Summary Section */}
            <div id="summary-section" className="scroll-mt-20">
              <CashflowSummaryCard
                inputs={inputs}
                clientInfo={clientInfo}
                calculations={calculations}
                mortgageAnalysis={mortgageAnalysis}
                mortgageInputs={mortgageInputs}
                exitScenarios={exitScenarios}
                currency={currency}
                rate={rate}
                defaultOpen={false}
              />
            </div>
          </div>
        )}

        {/* Modals */}
        <MortgageModal
          mortgageInputs={mortgageInputs}
          setMortgageInputs={setMortgageInputs}
          preHandoverPercent={inputs.preHandoverPercent}
          open={mortgageModalOpen}
          onOpenChange={setMortgageModalOpen}
        />
        <ClientUnitModal data={clientInfo} onChange={setClientInfo} open={clientModalOpen} onOpenChange={setClientModalOpen} />
        <OIInputModal 
          inputs={inputs} 
          setInputs={setInputs} 
          open={modalOpen} 
          onOpenChange={setModalOpen} 
          currency={currency} 
          mortgageInputs={mortgageInputs} 
          setMortgageInputs={setMortgageInputs} 
          clientInfo={clientInfo} 
          setClientInfo={setClientInfo} 
          quoteId={quoteId}
          isNewQuote={!!(quoteId && !quote?.project_name && !quote?.developer && inputs.basePrice === 0)}
          floorPlanUrl={quoteImages.floorPlanUrl}
          buildingRenderUrl={quoteImages.buildingRenderUrl}
          heroImageUrl={quoteImages.heroImageUrl}
          showLogoOverlay={quoteImages.showLogoOverlay}
          onFloorPlanChange={(url) => setQuoteImages(prev => ({ ...prev, floorPlanUrl: url }))}
          onBuildingRenderChange={(url) => setQuoteImages(prev => ({ ...prev, buildingRenderUrl: url }))}
          onHeroImageChange={(url) => setQuoteImages(prev => ({ ...prev, heroImageUrl: url }))}
          onShowLogoOverlayChange={(show) => setQuoteImages(prev => ({ ...prev, showLogoOverlay: show }))}
        />
        <LoadQuoteModal open={loadQuoteModalOpen} onOpenChange={setLoadQuoteModalOpen} />
        <VersionHistoryModal 
          open={versionHistoryOpen} 
          onOpenChange={setVersionHistoryOpen}
          quoteId={quoteId}
          onRestore={() => {
            setDataLoaded(false);
          }}
        />
        
        {/* Developer Info Modal */}
        <DeveloperInfoModal
          developerId={clientInfo.developerId || null}
          open={developerModalOpen}
          onOpenChange={setDeveloperModalOpen}
        />
        
        {/* Project Info Modal */}
        <ProjectInfoModal
          project={clientInfo.projectId ? { id: clientInfo.projectId, name: clientInfo.projectName } : null}
          zoneName={clientInfo.zoneName}
          open={projectModalOpen}
          onOpenChange={setProjectModalOpen}
        />
        
        {/* Floor Plan Lightbox */}
        {quoteImages.floorPlanUrl && (
          <FloorPlanLightbox
            imageUrl={quoteImages.floorPlanUrl}
            open={floorPlanLightboxOpen}
            onOpenChange={setFloorPlanLightboxOpen}
          />
        )}

        {/* Export Modal */}
        <ExportModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          quoteId={quote?.id}
          projectName={clientInfo.projectName}
          shareToken={quote?.share_token}
          generateShareToken={generateShareToken}
          activeView={viewMode}
        />
      </DashboardLayout>
    </CashflowErrorBoundary>
  );
};

export default OICalculatorContent;
