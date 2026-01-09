import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Sparkles, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OIInputModal } from "@/components/roi/OIInputModal";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { ClientUnitModal } from "@/components/roi/ClientUnitModal";
import { ViewVisibility } from "@/components/roi/ViewVisibilityControls";
import { LoadQuoteModal } from "@/components/roi/LoadQuoteModal";
import { VersionHistoryModal } from "@/components/roi/VersionHistoryModal";
import { CashflowSkeleton } from "@/components/roi/CashflowSkeleton";
import { CashflowErrorBoundary } from "@/components/roi/ErrorBoundary";
import { MortgageModal } from "@/components/roi/MortgageModal";
import { useMortgageCalculations, MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from "@/components/roi/useMortgageCalculations";
import { AlertTriangle } from "lucide-react";
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
import { toast } from "sonner";
import { exportCashflowPDF } from "@/lib/pdfExport";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DashboardLayout } from "@/components/roi/dashboard";
import { OverviewTabContent, PropertyTabContent, PaymentsTabContent, HoldTabContent, ExitTabContent, MortgageTabContent, SummaryTabContent } from "@/components/roi/tabs";

import { NEW_QUOTE_OI_INPUTS } from "@/components/roi/configurator/types";

const DEFAULT_CLIENT_INFO: ClientUnitData = { developer: '', projectName: '', clients: [], brokerName: '', unit: '', unitSizeSqf: 0, unitSizeM2: 0, unitType: '' };

const CashflowDashboardContent = () => {
  useDocumentTitle("Cashflow Dashboard");
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [loadQuoteModalOpen, setLoadQuoteModalOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [mortgageModalOpen, setMortgageModalOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>('AED');
  const [inputs, setInputs] = useState<OIInputs>(NEW_QUOTE_OI_INPUTS);
  const [clientInfo, setClientInfo] = useState<ClientUnitData>(DEFAULT_CLIENT_INFO);
  const [mortgageInputs, setMortgageInputs] = useState<MortgageInputs>(DEFAULT_MORTGAGE_INPUTS);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');

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

  // Validation checks
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

  const isQuoteConfigured = useMemo(() => {
    return (
      !!quoteId ||
      !!clientInfo.developer ||
      !!clientInfo.projectName ||
      inputs.basePrice > 0
    );
  }, [quoteId, clientInfo.developer, clientInfo.projectName, inputs.basePrice]);

  // Create draft immediately on mount if no quoteId
  const [creatingDraft, setCreatingDraft] = useState(false);
  
  useEffect(() => {
    const initDraft = async () => {
      if (!quoteId && !creatingDraft && !quoteLoading) {
        setCreatingDraft(true);
        const newId = await createDraft();
        if (newId) {
          // Set flag to open configurator after navigation
          localStorage.setItem('cashflow_open_configurator', 'true');
          navigate(`/cashflow-dashboard/${newId}`, { replace: true });
        }
        setCreatingDraft(false);
      }
    };
    initDraft();
  }, [quoteId, creatingDraft, createDraft, navigate, quoteLoading]);

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
        setMortgageInputs(savedMortgageInputs);
      }
      setDataLoaded(true);
    }
  }, [quote, quoteId, dataLoaded]);

  useEffect(() => { setDataLoaded(false); }, [quoteId]);

  // Redirect to preferred view if set to vertical
  useEffect(() => {
    const preference = localStorage.getItem('cashflow_view_preference');
    if (preference === 'vertical' && dataLoaded) {
      navigate(quoteId ? `/cashflow/${quoteId}` : '/cashflow-generator', { replace: true });
    }
  }, [dataLoaded, navigate, quoteId]);

  useEffect(() => { if (profile?.full_name && !clientInfo.brokerName) setClientInfo(prev => ({ ...prev, brokerName: profile.full_name || '' })); }, [profile?.full_name]);
  useEffect(() => { if (clientInfo.unitSizeSqf && clientInfo.unitSizeSqf !== inputs.unitSizeSqf) setInputs(prev => ({ ...prev, unitSizeSqf: clientInfo.unitSizeSqf })); }, [clientInfo.unitSizeSqf]);

  // Open configurator after navigation (for new drafts or restored state)
  useEffect(() => {
    if (dataLoaded) {
      const shouldOpen = localStorage.getItem('cashflow_open_configurator') === 'true' ||
                         localStorage.getItem('cashflow_configurator_open') === 'true';
      if (shouldOpen) {
        setModalOpen(true);
        localStorage.removeItem('cashflow_open_configurator');
        localStorage.removeItem('cashflow_configurator_open');
      }
    }
  }, [dataLoaded]);

  // Handler for when a new quote is auto-created - preserve configurator state across navigation
  const handleNewQuoteCreated = useCallback((newId: string) => {
    // Store configurator state before navigation
    if (modalOpen) {
      localStorage.setItem('cashflow_configurator_open', 'true');
    }
    navigate(`/cashflow-dashboard/${newId}`, { replace: true });
  }, [navigate, modalOpen]);

  // Autosave
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
      modalOpen // suppress toast when configurator is open
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

  // Handlers
  const quoteImagesPayload = { floorPlanUrl: quoteImages.floorPlanUrl, buildingRenderUrl: quoteImages.buildingRenderUrl, heroImageUrl: quoteImages.heroImageUrl };
  const handleSave = useCallback(async () => saveQuote(inputs, clientInfo, quote?.id, exitScenarios, mortgageInputs, saveVersion, quoteImagesPayload), [inputs, clientInfo, quote?.id, exitScenarios, mortgageInputs, saveQuote, saveVersion, quoteImages]);
  const handleSaveAs = useCallback(async () => { const newQuote = await saveAsNew(inputs, clientInfo, exitScenarios, mortgageInputs, quoteImagesPayload); if (newQuote) navigate(`/cashflow-dashboard/${newQuote.id}`); return newQuote; }, [inputs, clientInfo, exitScenarios, mortgageInputs, saveAsNew, navigate, quoteImages]);
  const handleShare = useCallback(async () => {
    const savedQuote = await saveQuote(inputs, clientInfo, quote?.id, exitScenarios, mortgageInputs, undefined, quoteImagesPayload);
    if (!savedQuote) return null;
    
    const token = await generateShareToken(savedQuote.id);
    if (token) {
      return `${window.location.origin}/view/${token}`;
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

  // Navigate to vertical view and save preference
  const handleSwitchToVertical = useCallback(() => {
    localStorage.setItem('cashflow_view_preference', 'vertical');
    if (quoteId) {
      navigate(`/cashflow/${quoteId}`);
    } else {
      navigate('/cashflow-generator');
    }
  }, [quoteId, navigate]);

  if (quoteLoading && quoteId) {
    return <CashflowSkeleton />;
  }

  return (
    <CashflowErrorBoundary>
      <div className="min-h-screen bg-theme-bg">
        {/* Save status is now shown in the sidebar */}

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

        {/* Always render DashboardLayout to keep sidebar visible */}
        <DashboardLayout
          inputs={inputs}
          mortgageInputs={mortgageInputs}
          profile={profile}
          isAdmin={isAdmin}
          onConfigure={() => setModalOpen(true)}
          onLoadQuote={() => setLoadQuoteModalOpen(true)}
          onViewHistory={() => setVersionHistoryOpen(true)}
          onShare={async () => {
            const url = await handleShare();
            if (url) {
              await navigator.clipboard.writeText(url);
              setShareUrl(url);
              toast.success("Share link copied to clipboard!");
            }
          }}
          onPresent={handlePresent}
          viewCount={quote?.view_count ?? undefined}
          quoteId={quoteId}
          language={language}
          setLanguage={setLanguage}
          currency={currency}
          setCurrency={setCurrency}
          hasUnsavedChanges={isQuoteConfigured && !quoteId && !lastSaved}
          saving={saving}
          onSave={handleSave}
        >
          {!isFullyConfigured ? (
            /* Unconfigured State - Simple welcome with Configure CTA */
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
                    onClick={() => setModalOpen(true)}
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
          ) : (
            /* Configured State - Tab content */
            <>
              {activeSection === 'overview' && (
                <OverviewTabContent
                  inputs={inputs}
                  calculations={calculations}
                  mortgageInputs={mortgageInputs}
                  mortgageAnalysis={mortgageAnalysis}
                  exitScenarios={exitScenarios}
                  currency={currency}
                  rate={rate}
                  clientInfo={clientInfo}
                  heroImageUrl={quoteImages.heroImageUrl}
                  buildingRenderUrl={quoteImages.buildingRenderUrl}
                  customDifferentiators={customDifferentiators}
                />
              )}

              {activeSection === 'property' && (
                <PropertyTabContent
                  inputs={inputs}
                  calculations={calculations}
                  currency={currency}
                  rate={rate}
                  clientInfo={clientInfo}
                  customDifferentiators={customDifferentiators}
                  onEditConfig={() => setModalOpen(true)}
                  onEditClient={() => setClientModalOpen(true)}
                  variant="dashboard"
                  floorPlanUrl={quoteImages.floorPlanUrl}
                  buildingRenderUrl={quoteImages.buildingRenderUrl}
                  showLogoOverlay={quoteImages.showLogoOverlay}
                />
              )}

              {activeSection === 'payments' && (
                <PaymentsTabContent
                  inputs={inputs}
                  currency={currency}
                  totalMonths={calculations.totalMonths}
                  rate={rate}
                  clientInfo={clientInfo}
                />
              )}

              {activeSection === 'hold' && (
                <HoldTabContent
                  inputs={inputs}
                  calculations={calculations}
                  currency={currency}
                  rate={rate}
                  totalCapitalInvested={calculations.basePrice + calculations.totalEntryCosts}
                  unitSizeSqf={clientInfo.unitSizeSqf}
                  variant="dashboard"
                />
              )}

              {activeSection === 'exit' && (
                <ExitTabContent
                  inputs={inputs}
                  calculations={calculations}
                  currency={currency}
                  rate={rate}
                  exitScenarios={exitScenarios}
                  setExitScenarios={setExitScenarios}
                  unitSizeSqf={clientInfo.unitSizeSqf}
                  variant="dashboard"
                />
              )}

              {activeSection === 'mortgage' && (
                <MortgageTabContent
                  inputs={inputs}
                  calculations={calculations}
                  mortgageInputs={mortgageInputs}
                  mortgageAnalysis={mortgageAnalysis}
                  currency={currency}
                  rate={rate}
                />
              )}

              {activeSection === 'summary' && (
                <SummaryTabContent
                  inputs={inputs}
                  clientInfo={clientInfo}
                  calculations={calculations}
                  mortgageInputs={mortgageInputs}
                  mortgageAnalysis={mortgageAnalysis}
                  exitScenarios={exitScenarios}
                  currency={currency}
                  rate={rate}
                />
              )}
            </>
          )}
        </DashboardLayout>
      </div>
    </CashflowErrorBoundary>
  );
};

export default CashflowDashboardContent;
