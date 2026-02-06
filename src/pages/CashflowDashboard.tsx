import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OIInputModal } from "@/components/roi/OIInputModal";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { ClientUnitModal } from "@/components/roi/ClientUnitModal";
import { LoadQuoteModal } from "@/components/roi/LoadQuoteModal";
import { VersionHistoryModal } from "@/components/roi/VersionHistoryModal";
import { CashflowSkeleton } from "@/components/roi/CashflowSkeleton";
import { CashflowErrorBoundary } from "@/components/roi/ErrorBoundary";
import { MortgageModal } from "@/components/roi/MortgageModal";
import { useMortgageCalculations, MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from "@/components/roi/useMortgageCalculations";
import { useOICalculations, OIInputs } from "@/components/roi/useOICalculations";
import { migrateInputs } from "@/components/roi/inputMigration";
import { Currency } from "@/components/roi/currencyUtils";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useCashflowQuote, hasWorkingDraftContent } from "@/hooks/useCashflowQuote";
import { useQuoteVersions } from "@/hooks/useQuoteVersions";
import { useProfile } from "@/hooks/useProfile";
import { useAdminRole } from "@/hooks/useAuth";
import { useCustomDifferentiators } from "@/hooks/useCustomDifferentiators";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNewQuote } from "@/hooks/useNewQuote";
import { toast } from "sonner";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DashboardLayout } from "@/components/roi/dashboard";
import { OverviewTabContent, PropertyTabContent, PaymentsTabContent, HoldTabContent, ExitTabContent, MortgageTabContent, SummaryTabContent } from "@/components/roi/tabs";
import { UnsavedDraftDialog } from "@/components/roi/UnsavedDraftDialog";
import { ResumeDraftDialog, DraftInfo } from "@/components/roi/ResumeDraftDialog";

import { NEW_QUOTE_OI_INPUTS } from "@/components/roi/configurator/types";

const DEFAULT_CLIENT_INFO: ClientUnitData = { developer: '', projectName: '', clients: [], brokerName: '', unit: '', unitSizeSqf: 0, unitSizeM2: 0, unitType: '' };

const CashflowDashboardContent = () => {
  useDocumentTitle("Cashflow Dashboard");
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
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
  const { quote, loading: quoteLoading, saving, lastSaved, quoteImages, setQuoteImages, saveQuote, saveAsNew, scheduleAutoSave, generateShareToken, createDraft, promoteWorkingDraft, clearWorkingDraft } = useCashflowQuote(quoteId);
  const { saveVersion } = useQuoteVersions(quoteId);
  const { checkExistingDraft, startNewQuote } = useNewQuote();
  
  // Unsaved draft dialog state
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'new' | 'load' | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  // Resume draft dialog state
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [existingDraft, setExistingDraft] = useState<DraftInfo | null>(null);
  const [resumeCheckDone, setResumeCheckDone] = useState(false);
  
  // Track if we just reset state (to prevent immediate auto-save)
  const justResetRef = useRef(false);
  
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

  // Stricter validation for auto-save: require MEANINGFUL content
  const hasMeaningfulContent = useMemo(() => {
    return (
      (inputs.basePrice > 0) ||
      (!!clientInfo.projectName && clientInfo.projectName.trim().length > 0) ||
      (!!clientInfo.developer && clientInfo.developer.trim().length > 0) ||
      (clientInfo.clients?.some(c => c.name?.trim()))
    );
  }, [inputs.basePrice, clientInfo.projectName, clientInfo.developer, clientInfo.clients]);

  // NO EAGER DRAFT CREATION - Check for existing working draft on mount instead
  // This prevents empty quotes from cluttering the database
  useEffect(() => {
    const checkForDraft = async () => {
      // Skip if we have a quoteId (loading existing quote) or already checked
      if (quoteId || quoteLoading || resumeCheckDone) return;
      
      // Skip if this is a "fresh start" navigation (user already chose to start new)
      if (location.state?.freshStart) {
        setResumeCheckDone(true);
        // Clear the state to prevent issues on refresh
        navigate(location.pathname, { replace: true, state: {} });
        // Check for preselected client
        const preselectedClient = localStorage.getItem('preselected_client');
        if (preselectedClient) {
          try {
            const clientData = JSON.parse(preselectedClient);
            setClientInfo({
              ...DEFAULT_CLIENT_INFO,
              clients: [{
                id: '1',
                name: clientData.clientName || '',
                country: clientData.clientCountry || '',
                email: clientData.clientEmail || ''
              }],
              dbClientId: clientData.dbClientId || undefined
            });
            localStorage.removeItem('preselected_client');
          } catch (e) {
            console.error('Failed to parse preselected client:', e);
            localStorage.removeItem('preselected_client');
          }
        }
        setDataLoaded(true);
        // Open configurator if requested
        if (location.state?.openConfigurator) {
          setModalOpen(true);
        }
        return;
      }
      
      const draft = await checkExistingDraft();
      setResumeCheckDone(true);
      
      if (draft) {
        // User has a working draft with content - ask what to do
        setExistingDraft(draft);
        setShowResumeDialog(true);
      } else {
        // No meaningful draft - proceed fresh, open configurator
        setDataLoaded(true);
        // Don't auto-open configurator here - wait for user action
      }
    };
    
    checkForDraft();
  }, [quoteId, quoteLoading, resumeCheckDone, checkExistingDraft, location.state, navigate, location.pathname]);

  // Handle resume draft
  const handleResumeDraft = useCallback(() => {
    if (existingDraft?.id) {
      navigate(`/cashflow-dashboard/${existingDraft.id}`, { replace: true });
    }
    setShowResumeDialog(false);
    setExistingDraft(null);
  }, [existingDraft, navigate]);

  // Handle start fresh
  const handleStartFresh = useCallback(async () => {
    setShowResumeDialog(false);
    setExistingDraft(null);
    
    // Clear the working draft
    await clearWorkingDraft();
    
    // Reset local state
    setInputs(NEW_QUOTE_OI_INPUTS);
    setClientInfo(DEFAULT_CLIENT_INFO);
    setMortgageInputs(DEFAULT_MORTGAGE_INPUTS);
    setQuoteImages({
      floorPlanUrl: null,
      buildingRenderUrl: null,
      heroImageUrl: null,
      showLogoOverlay: true,
    });
    
    setDataLoaded(true);
    justResetRef.current = true;
    setTimeout(() => { justResetRef.current = false; }, 500);
    
    // Open configurator for fresh start
    setModalOpen(true);
  }, [clearWorkingDraft, setQuoteImages]);

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

  // Clear any stale localStorage flags from previous behavior
  useEffect(() => {
    localStorage.removeItem('cashflow_open_configurator');
    localStorage.removeItem('cashflow_configurator_open');
  }, []);

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
    // Skip auto-save immediately after resetting state for new quote
    if (justResetRef.current) return;

    const canUpdateExisting = !!quoteId && quote?.id === quoteId;
    // Use stricter hasMeaningfulContent instead of permissive isQuoteConfigured
    const allowAutoCreate = !quoteId && hasMeaningfulContent;

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
  }, [inputs, clientInfo, quoteId, quote?.id, quoteLoading, hasMeaningfulContent, mortgageInputs, scheduleAutoSave, dataLoaded, quoteImages.floorPlanUrl, quoteImages.buildingRenderUrl, quoteImages.heroImageUrl, handleNewQuoteCreated, modalOpen, justResetRef]);

  // Exit scenarios - allow up to 5 years (60 months) post-handover
  const exitScenarios = useMemo(() => {
    const saved = inputs._exitScenarios;
    const maxExitMonth = calculations.totalMonths + 60; // 5 years post-handover
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved
        .map((m: number) => Math.min(Math.max(1, m), maxExitMonth))
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

  // Navigate to vertical view and save preference
  const handleSwitchToVertical = useCallback(() => {
    localStorage.setItem('cashflow_view_preference', 'vertical');
    if (quoteId) {
      navigate(`/cashflow/${quoteId}`);
    } else {
      navigate('/cashflow-generator');
    }
  }, [quoteId, navigate]);

  // Check if current quote is a working draft with content
  const isWorkingDraftWithContent = useMemo(() => {
    return quote?.status === 'working_draft' && hasWorkingDraftContent(quote);
  }, [quote]);

  // Handle load quote with unsaved draft check
  const handleLoadQuote = useCallback(() => {
    if (isWorkingDraftWithContent) {
      setPendingAction('load');
      setShowUnsavedDialog(true);
      return;
    }
    setLoadQuoteModalOpen(true);
  }, [isWorkingDraftWithContent]);

  // Handle save draft (promote working draft to real draft)
  const handleSaveWorkingDraft = useCallback(async () => {
    if (!quote?.id) return;
    
    setIsSavingDraft(true);
    
    const exitScenarios = inputs._exitScenarios || [];
    await saveQuote(inputs, clientInfo, quote.id, exitScenarios, mortgageInputs, undefined, quoteImagesPayload);
    const success = await promoteWorkingDraft(quote.id);
    
    setIsSavingDraft(false);
    setShowUnsavedDialog(false);
    
    if (success) {
      toast.success("Draft saved successfully!");
      if (pendingAction === 'load') {
        setLoadQuoteModalOpen(true);
      }
    }
    setPendingAction(null);
  }, [quote, inputs, clientInfo, mortgageInputs, quoteImagesPayload, saveQuote, promoteWorkingDraft, pendingAction]);

  // Handle discard working draft
  const handleDiscardWorkingDraft = useCallback(async () => {
    await clearWorkingDraft();
    setShowUnsavedDialog(false);
    
    if (pendingAction === 'load') {
      setLoadQuoteModalOpen(true);
    }
    setPendingAction(null);
  }, [clearWorkingDraft, pendingAction]);

  // Handle cancel dialog
  const handleCancelDialog = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingAction(null);
  }, []);

  if (quoteLoading && quoteId) {
    return <CashflowSkeleton />;
  }

  return (
    <CashflowErrorBoundary>
      {/* Resume Draft Dialog - shown on initial load when user has existing draft */}
      <ResumeDraftDialog
        open={showResumeDialog}
        draftInfo={existingDraft}
        onResume={handleResumeDraft}
        onStartFresh={handleStartFresh}
      />

      {/* Unsaved Draft Dialog - shown when navigating away with unsaved changes */}
      <UnsavedDraftDialog
        open={showUnsavedDialog}
        onSave={handleSaveWorkingDraft}
        onDiscard={handleDiscardWorkingDraft}
        onCancel={handleCancelDialog}
        isSaving={isSavingDraft}
      />

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
          onLoadQuote={handleLoadQuote}
          onViewHistory={() => setVersionHistoryOpen(true)}
          onShare={async () => {
            const url = await handleShare();
            if (url) {
              await navigator.clipboard.writeText(url);
              setShareUrl(url);
              toast.success("Share link copied to clipboard!");
            }
          }}
          viewCount={quote?.view_count ?? undefined}
          quoteId={quoteId}
          language={language}
          setLanguage={setLanguage}
          currency={currency}
          setCurrency={setCurrency}
          hasUnsavedChanges={hasMeaningfulContent && !quoteId && !lastSaved}
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
            <div className="animate-fade-in" key="cashflow-view">
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
            </div>
          )}
        </DashboardLayout>
      </div>
    </CashflowErrorBoundary>
  );
};

export default CashflowDashboardContent;
