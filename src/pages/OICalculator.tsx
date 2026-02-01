import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Rocket, X } from "lucide-react";
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
import { DeveloperInfoModal } from "@/components/roi/DeveloperInfoModal";
import { ProjectInfoModal } from "@/components/roi/ProjectInfoModal";
import { FloorPlanLightbox } from "@/components/roi/FloorPlanLightbox";
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
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/roi/dashboard";
import { SnapshotContent } from "@/components/roi/snapshot";
import { ExportModal } from "@/components/roi/ExportModal";
import { UnsavedDraftDialog } from "@/components/roi/UnsavedDraftDialog";

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
  
  // Ref for client-side export capture
  const mainContentRef = useRef<HTMLDivElement>(null);
  
  // Track if we just reset state (to prevent immediate auto-save after navigation to new quote)
  const justResetRef = useRef(false);

  const { profile } = useProfile();
  const { isAdmin } = useAdminRole();
  const { customDifferentiators } = useCustomDifferentiators();
  const { quote, loading: quoteLoading, saving, lastSaved, quoteImages, setQuoteImages, saveQuote, saveAsNew, scheduleAutoSave, generateShareToken, createDraft, promoteWorkingDraft, clearWorkingDraft } = useCashflowQuote(quoteId);
  const { saveVersion } = useQuoteVersions(quoteId);
  
  // Unsaved draft dialog state
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'new' | 'load' | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
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
  // But if we have a quoteId and data is loaded, show content even with partial data
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

  // When loading an existing quote with data, show content even if some fields are empty
  // Check if we have a loaded quote (dataLoaded=true means data has been populated from the database)
  const isFullyConfigured = (hasClientDetails && hasPropertyConfigured) || (!!quoteId && dataLoaded && !!quote);

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
        dbClientId: savedClientInfo.dbClientId || (quote as any).client_id || undefined,
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

  // Reset ALL state when navigating to new quote (no quoteId)
  // This prevents duplicating the previous quote's data
  // MERGED: Preselected client logic is handled HERE to prevent race condition
  useEffect(() => {
    if (!quoteId) {
      // First, reset all state for a fresh start
      setInputs(NEW_QUOTE_OI_INPUTS);
      setMortgageInputs(DEFAULT_MORTGAGE_INPUTS);
      setQuoteImages({
        floorPlanUrl: null,
        buildingRenderUrl: null,
        heroImageUrl: null,
        showLogoOverlay: true,
      });
      setShareUrl(null);
      
      // Then check for preselected client (AFTER reset, so it's not overwritten)
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
          // Clear the localStorage after use
          localStorage.removeItem('preselected_client');
          // Open configurator so user can continue setting up
          setModalOpen(true);
        } catch (e) {
          console.error('Failed to parse preselected client:', e);
          setClientInfo(DEFAULT_CLIENT_INFO);
          localStorage.removeItem('preselected_client');
        }
      } else {
        setClientInfo(DEFAULT_CLIENT_INFO);
      }
      
      setDataLoaded(true); // Ready immediately for new quotes
      justResetRef.current = true;
      // Clear the flag after a tick to allow normal auto-save operation
      setTimeout(() => { justResetRef.current = false; }, 150);
    } else {
      // Will load from DB
      setDataLoaded(false);
    }
  }, [quoteId, setQuoteImages]);
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

  // Check if current quote is a working draft with content
  const isWorkingDraftWithContent = useMemo(() => {
    return quote?.status === 'working_draft' && hasWorkingDraftContent(quote);
  }, [quote]);

  // Handle new quote creation with unsaved draft check
  const handleNewQuote = useCallback(() => {
    // If current quote is a working draft with content, show dialog
    if (isWorkingDraftWithContent) {
      setPendingAction('new');
      setShowUnsavedDialog(true);
      return;
    }
    
    // Clear configurator localStorage state for fresh start
    localStorage.removeItem('cashflow-configurator-state');
    localStorage.removeItem('cashflow_configurator_open');
    
    // Navigate to generator without a quoteId, opening configurator immediately
    navigate('/cashflow-generator', { replace: true, state: { openConfigurator: true } });
  }, [navigate, isWorkingDraftWithContent]);

  // Handle load quote with unsaved draft check
  const handleLoadQuote = useCallback(() => {
    // If current quote is a working draft with content, show dialog
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
    
    // First save current state
    const exitScenarios = inputs._exitScenarios || [];
    await saveQuote(inputs, clientInfo, quote.id, exitScenarios, mortgageInputs, undefined, {
      floorPlanUrl: quoteImages.floorPlanUrl,
      buildingRenderUrl: quoteImages.buildingRenderUrl,
      heroImageUrl: quoteImages.heroImageUrl,
    });
    
    // Then promote the working draft to a real draft
    const success = await promoteWorkingDraft(quote.id);
    
    setIsSavingDraft(false);
    setShowUnsavedDialog(false);
    
    if (success) {
      toast.success("Draft saved successfully!");
      
      // Proceed with pending action
      if (pendingAction === 'new') {
        localStorage.removeItem('cashflow-configurator-state');
        localStorage.removeItem('cashflow_configurator_open');
        navigate('/cashflow-generator', { replace: true, state: { openConfigurator: true } });
      } else if (pendingAction === 'load') {
        setLoadQuoteModalOpen(true);
      }
    }
    
    setPendingAction(null);
  }, [quote, inputs, clientInfo, mortgageInputs, quoteImages, saveQuote, promoteWorkingDraft, navigate, pendingAction]);

  // Handle discard working draft
  const handleDiscardWorkingDraft = useCallback(async () => {
    await clearWorkingDraft();
    setShowUnsavedDialog(false);
    
    // Proceed with pending action
    if (pendingAction === 'new') {
      localStorage.removeItem('cashflow-configurator-state');
      localStorage.removeItem('cashflow_configurator_open');
      navigate('/cashflow-generator', { replace: true, state: { openConfigurator: true } });
    } else if (pendingAction === 'load') {
      setLoadQuoteModalOpen(true);
    }
    
    setPendingAction(null);
  }, [clearWorkingDraft, navigate, pendingAction]);

  // Handle cancel dialog
  const handleCancelDialog = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingAction(null);
  }, []);

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
    // Skip auto-save immediately after resetting state for new quote
    if (justResetRef.current) return;

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
        {/* Unsaved Draft Dialog */}
        <UnsavedDraftDialog
          open={showUnsavedDialog}
          onSave={handleSaveWorkingDraft}
          onDiscard={handleDiscardWorkingDraft}
          onCancel={handleCancelDialog}
          isSaving={isSavingDraft}
        />

        <DashboardLayout
        inputs={inputs}
        mortgageInputs={mortgageInputs}
        mainContentRef={mainContentRef}
        profile={profile}
        isAdmin={isAdmin}
        onConfigure={() => setModalOpen(true)}
        onLoadQuote={handleLoadQuote}
        onViewHistory={() => setVersionHistoryOpen(true)}
        onShare={handleShare}
        onNewQuote={handleNewQuote}
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
        ) : (
          /* Configured State - Show Cashflow View (formerly Snapshot) */
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
            snapshotTitle={(inputs as any).snapshotTitle || null}
            onSnapshotTitleChange={(title) => setInputs(prev => ({ ...prev, snapshotTitle: title } as OIInputs))}
          />
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
          projectName={clientInfo.projectName}
          activeView="snapshot"
          inputs={inputs}
          calculations={calculations}
          clientInfo={clientInfo}
          mortgageInputs={mortgageInputs}
          mortgageAnalysis={mortgageAnalysis}
          exitScenarios={exitScenarios}
          currency={currency}
          rate={rate}
          language={language as 'en' | 'es'}
          quoteImages={quoteImages}
        />
      </DashboardLayout>
    </CashflowErrorBoundary>
  );
};

export default OICalculatorContent;
