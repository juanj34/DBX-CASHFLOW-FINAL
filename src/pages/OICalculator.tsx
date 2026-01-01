import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { LayoutDashboard, Home, TrendingUp, SlidersHorizontal, Settings2, CreditCard, AlertCircle, Building2, MoreVertical, Users, FolderOpen, FileText, FilePlus, History, Columns3, Sparkles, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OIInputModal } from "@/components/roi/OIInputModal";
import { OIGrowthCurve } from "@/components/roi/OIGrowthCurve";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { PaymentBreakdown } from "@/components/roi/PaymentBreakdown";
import { PaymentSplitBreakdown } from "@/components/roi/PaymentSplitBreakdown";
import { InvestmentSnapshot } from "@/components/roi/InvestmentSnapshot";
import { InvestmentOverviewGrid } from "@/components/roi/InvestmentOverviewGrid";
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
import { CashflowSummaryCard } from "@/components/roi/CashflowSummaryCard";
import { LoadQuoteModal } from "@/components/roi/LoadQuoteModal";
import { VersionHistoryModal } from "@/components/roi/VersionHistoryModal";
import { CashflowSkeleton } from "@/components/roi/CashflowSkeleton";
import { CashflowErrorBoundary, SectionErrorBoundary } from "@/components/roi/ErrorBoundary";
import { MortgageModal } from "@/components/roi/MortgageModal";
import { MortgageBreakdown } from "@/components/roi/MortgageBreakdown";
import { useMortgageCalculations, MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from "@/components/roi/useMortgageCalculations";
import { ValueDifferentiatorsDisplay } from "@/components/roi/ValueDifferentiatorsDisplay";
import { FloatingNav, useFloatingNavSections } from "@/components/roi/FloatingNav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, Save, Loader2, Check } from "lucide-react";
import { useOICalculations, OIInputs } from "@/components/roi/useOICalculations";
import { migrateInputs } from "@/components/roi/inputMigration";
import { Currency } from "@/components/roi/currencyUtils";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useCashflowQuote } from "@/hooks/useCashflowQuote";
import { useQuoteVersions } from "@/hooks/useQuoteVersions";
import { useProfile } from "@/hooks/useProfile";
import { useAdminRole } from "@/hooks/useAuth";
import { useCustomDifferentiators } from "@/hooks/useCustomDifferentiators";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { exportCashflowPDF } from "@/lib/pdfExport";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

import { NEW_QUOTE_OI_INPUTS } from "@/components/roi/configurator/types";

const DEFAULT_CLIENT_INFO: ClientUnitData = { developer: '', projectName: '', clients: [], brokerName: '', unit: '', unitSizeSqf: 0, unitSizeM2: 0, unitType: '' };

const OICalculatorContent = () => {
  useDocumentTitle("Cashflow Generator");
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
  

  const { profile } = useProfile();
  const { isAdmin } = useAdminRole();
  const { customDifferentiators } = useCustomDifferentiators();
  const { quote, loading: quoteLoading, saving, lastSaved, saveQuote, saveAsNew, scheduleAutoSave, generateShareToken, loadDraft } = useCashflowQuote(quoteId);
  const { saveVersion } = useQuoteVersions(quoteId);
  const calculations = useOICalculations(inputs);
  const mortgageAnalysis = useMortgageCalculations({
    mortgageInputs,
    basePrice: calculations.basePrice,
    preHandoverPercent: inputs.preHandoverPercent,
  });
  const { rate, isLive } = useExchangeRate(currency);
  const floatingNavSections = useFloatingNavSections(inputs.enabledSections, mortgageInputs.enabled);

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

  // Redirect to preferred view if set to dashboard
  useEffect(() => {
    const preference = localStorage.getItem('cashflow_view_preference');
    if (preference === 'dashboard' && dataLoaded) {
      navigate(quoteId ? `/cashflow-dashboard/${quoteId}` : '/cashflow-dashboard', { replace: true });
    }
  }, [dataLoaded, navigate, quoteId]);

  // Handler for when a new quote is auto-created - navigate to prevent duplicates
  const handleNewQuoteCreated = useCallback((newId: string) => {
    navigate(`/cashflow/${newId}`, { replace: true });
  }, [navigate]);

  useEffect(() => {
    // Prevent autosave from writing into the wrong quote during route transitions
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
      undefined, // images
      handleNewQuoteCreated
    );
  }, [inputs, clientInfo, quoteId, quote?.id, quoteLoading, isQuoteConfigured, mortgageInputs, scheduleAutoSave, dataLoaded, handleNewQuoteCreated]);

  // Exit scenarios - derived from inputs._exitScenarios as single source of truth
  // Only use auto-generated fallback if no custom exits exist
  const exitScenarios = useMemo(() => {
    const saved = inputs._exitScenarios;
    if (saved && Array.isArray(saved) && saved.length > 0) {
      // Clamp to valid bounds and remove duplicates
      return saved
        .map((m: number) => Math.min(Math.max(1, m), calculations.totalMonths))
        .filter((m: number, i: number, arr: number[]) => arr.indexOf(m) === i)
        .sort((a, b) => a - b);
    }
    // Only return auto-calculated exits if user hasn't configured any (empty array means user cleared them)
    return [];
  }, [inputs._exitScenarios, calculations.totalMonths]);

  const setExitScenarios = useCallback((newScenarios: number[]) => {
    setInputs(prev => ({ ...prev, _exitScenarios: newScenarios.sort((a, b) => a - b) }));
  }, []);

  const handleSave = useCallback(async () => saveQuote(inputs, clientInfo, quote?.id, exitScenarios, mortgageInputs, saveVersion), [inputs, clientInfo, quote?.id, exitScenarios, mortgageInputs, saveQuote, saveVersion]);
  const handleSaveAs = useCallback(async () => { const newQuote = await saveAsNew(inputs, clientInfo, exitScenarios, mortgageInputs); if (newQuote) navigate(`/cashflow/${newQuote.id}`); return newQuote; }, [inputs, clientInfo, exitScenarios, mortgageInputs, saveAsNew, navigate]);
  const handleShare = useCallback(async () => {
    // Always save first to ensure the client sees the latest data (including exit scenarios and mortgage)
    const savedQuote = await saveQuote(inputs, clientInfo, quote?.id, exitScenarios, mortgageInputs);
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

  // Navigate to dashboard view and save preference
  const handleSwitchToDashboard = useCallback(() => {
    localStorage.setItem('cashflow_view_preference', 'dashboard');
    navigate(quoteId ? `/cashflow-dashboard/${quoteId}` : '/cashflow-dashboard');
  }, [quoteId, navigate]);

  const lastProjection = calculations.yearlyProjections[calculations.yearlyProjections.length - 1];
  const totalCapitalInvested = calculations.basePrice + calculations.totalEntryCosts;

  if (quoteLoading && quoteId) {
    return <CashflowSkeleton />;
  }

  return (
    <CashflowErrorBoundary>
      <div className="min-h-screen bg-theme-bg">
      <div className="hidden print-only print:block bg-theme-bg text-theme-text p-6 mb-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-theme-accent">Cashflow Generator</h1><p className="text-theme-text-muted text-sm mt-1">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
          {profile && <div className="text-right"><p className="text-sm text-theme-text-muted">{t('advisor')}</p><p className="font-medium">{profile.full_name || 'Advisor'}</p></div>}
        </div>
      </div>

      <header className="border-b border-theme-border bg-theme-bg/80 backdrop-blur-xl sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Main header row */}
          <div className="flex items-center justify-between gap-2 w-full min-w-0">
            {/* Left: Navigation + Advisor */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Link to="/home" className="flex-shrink-0">
                <Button variant="ghost" size="icon" className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card h-8 w-8 sm:h-9 sm:w-9">
                  <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/dashboard" className="flex-shrink-0">
                  <Button variant="ghost" size="icon" className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card h-8 w-8 sm:h-9 sm:w-9">
                    <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </Link>
              )}
              {profile && <AdvisorInfo profile={profile} size="lg" showSubtitle />}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Autosave Status Indicator */}
              <div className="flex items-center gap-1.5 mr-1">
                {saving ? (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 animate-fade-in">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </span>
                ) : lastSaved ? (
                  <span className="text-[10px] text-gray-500 flex items-center gap-1 animate-fade-in">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="hidden sm:inline">Autosaved</span>
                  </span>
                ) : null}
              </div>

              {/* Desktop: Show all buttons */}
              <div className="hidden sm:flex items-center gap-2">
                {/* Quotes Dropdown */}
                <QuotesDropdown
                  saving={saving}
                  lastSaved={lastSaved}
                  onSave={handleSave}
                  onSaveAs={handleSaveAs}
                  onLoadQuote={() => setLoadQuoteModalOpen(true)}
                  onViewHistory={() => setVersionHistoryOpen(true)}
                  hasQuoteId={!!quoteId}
                />

                {/* Share Controls */}
                <ViewVisibilityControls 
                  shareUrl={shareUrl} 
                  onGenerateShareUrl={handleShare} 
                  onExportPDF={handleExportPDF}
                  enabledSections={inputs.enabledSections || { exitStrategy: true, longTermHold: true }}
                  clientInfo={{
                    clientName: clientInfo.clients?.[0]?.name || '',
                    clientEmail: clientInfo.clients?.[0]?.email || '',
                    projectName: clientInfo.projectName || '',
                    unitType: clientInfo.unitType || '',
                    advisorName: profile?.full_name || '',
                    advisorEmail: profile?.business_email || profile?.email || '',
                  }}
                />

                {/* Separator */}
                <div className="w-px h-6 bg-theme-border mx-0.5" />

                {/* Settings Dropdown */}
                <SettingsDropdown
                  language={language}
                  setLanguage={setLanguage}
                  currency={currency}
                  setCurrency={setCurrency}
                  exchangeRate={rate}
                  isLive={isLive}
                />

                {/* Switch to Dashboard View */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSwitchToDashboard}
                      className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card h-8 gap-1.5"
                    >
                      <Columns3 className="w-4 h-4" />
                      <span className="text-xs">Dashboard</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Switch to sidebar dashboard layout</p>
                  </TooltipContent>
                </Tooltip>

                {/* Configure Button */}
                <Button 
                  onClick={() => setModalOpen(true)}
                  className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90 font-semibold relative"
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Configure
                  {mortgageInputs.enabled && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-theme-bg" />
                  )}
                </Button>
              </div>

              {/* Mobile: Show condensed actions + More menu */}
              <div className="flex sm:hidden items-center gap-1.5">
                {/* Share (icon only) */}
                <ViewVisibilityControls shareUrl={shareUrl} onGenerateShareUrl={handleShare} onExportPDF={handleExportPDF} />

                {/* Configure (icon only) */}
                <Button 
                  size="sm"
                  onClick={() => setModalOpen(true)}
                  className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90 font-semibold h-8 px-2 relative"
                >
                  <Settings2 className="w-4 h-4" />
                  {mortgageInputs.enabled && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-theme-bg" />
                  )}
                </Button>

                {/* More Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-theme-text-muted hover:text-theme-text hover:bg-theme-card">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-theme-card border-theme-border z-50 w-52">

                    {/* Quotes actions */}
                    <DropdownMenuItem
                      onClick={() => {
                        localStorage.removeItem('cashflow_quote_draft');
                        navigate('/cashflow-generator');
                        window.location.reload();
                      }}
                      className="text-theme-text-muted hover:bg-theme-card-alt focus:bg-theme-card-alt gap-2"
                    >
                      <FilePlus className="w-4 h-4" />
                      {t('newQuote')}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setLoadQuoteModalOpen(true)}
                      className="text-theme-text-muted hover:bg-theme-card-alt focus:bg-theme-card-alt gap-2"
                    >
                      <FolderOpen className="w-4 h-4" />
                      {t('loadQuote')}
                    </DropdownMenuItem>

                    {quoteId && (
                      <DropdownMenuItem
                        onClick={() => setVersionHistoryOpen(true)}
                        className="text-theme-text-muted hover:bg-theme-card-alt focus:bg-theme-card-alt gap-2"
                      >
                        <History className="w-4 h-4" />
                        {t('versionHistory')}
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="bg-theme-border" />

                    {/* Settings section */}
                    <DropdownMenuItem
                      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                      className="text-theme-text-muted hover:bg-theme-card-alt focus:bg-theme-card-alt gap-2"
                    >
                      🌐 {language === 'en' ? 'Español' : 'English'}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setCurrency(currency === 'AED' ? 'USD' : 'AED')}
                      className="text-theme-text-muted hover:bg-theme-card-alt focus:bg-theme-card-alt gap-2"
                    >
                      💰 {currency === 'AED' ? 'USD' : 'AED'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Modals - rendered outside the visible button area */}
              <MortgageModal
                mortgageInputs={mortgageInputs}
                setMortgageInputs={setMortgageInputs}
                preHandoverPercent={inputs.preHandoverPercent}
                open={mortgageModalOpen}
                onOpenChange={setMortgageModalOpen}
              />
              <ClientUnitModal data={clientInfo} onChange={setClientInfo} open={clientModalOpen} onOpenChange={setClientModalOpen} />
              <OIInputModal inputs={inputs} setInputs={setInputs} open={modalOpen} onOpenChange={setModalOpen} currency={currency} mortgageInputs={mortgageInputs} setMortgageInputs={setMortgageInputs} clientInfo={clientInfo} setClientInfo={setClientInfo} quoteId={quoteId} />
              <LoadQuoteModal open={loadQuoteModalOpen} onOpenChange={setLoadQuoteModalOpen} />
              <VersionHistoryModal 
                open={versionHistoryOpen} 
                onOpenChange={setVersionHistoryOpen}
                quoteId={quoteId}
                onRestore={() => {
                  setDataLoaded(false);
                }}
              />
              
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
        {!isFullyConfigured ? (
          /* Unconfigured State - Simple welcome with Configure CTA */
          <div className="bg-theme-card border border-theme-border rounded-2xl p-8 sm:p-16 text-center">
            <div className="max-w-lg mx-auto">
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
          /* Configured State - Show full content with ClientUnitInfo */
          <>
            <ClientUnitInfo data={clientInfo} onEditClick={() => setClientModalOpen(true)} />
            {/* Floating Navigation */}
            <FloatingNav sections={floatingNavSections} />

            {/* Investment Overview Grid - Executive Summary */}
            <div id="overview-section" className="mb-4 sm:mb-6 scroll-mt-20">
              <InvestmentOverviewGrid
                inputs={inputs}
                calculations={calculations}
                mortgageAnalysis={mortgageAnalysis}
                mortgageEnabled={mortgageInputs.enabled}
                exitScenarios={exitScenarios}
                currency={currency}
                rate={rate}
              />
            </div>

            {/* Investment Snapshot */}
            <div id="property-section" className="mb-4 sm:mb-6 scroll-mt-20">
              <InvestmentSnapshot inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} totalEntryCosts={calculations.totalEntryCosts} rate={rate} holdAnalysis={calculations.holdAnalysis} unitSizeSqf={clientInfo.unitSizeSqf} />
            </div>

            {/* Payment Breakdown - Collapsible, default collapsed */}
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

            {/* Value Differentiators Display */}
            <ValueDifferentiatorsDisplay
              selectedDifferentiators={inputs.valueDifferentiators || []}
              customDifferentiators={customDifferentiators}
              onEditClick={() => setModalOpen(true)}
            />

            {/* Hold Strategy Analysis - Collapsible - Only show if enabled */}
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
                    <WealthSummaryCard propertyValueYear10={lastProjection.propertyValue} cumulativeRentIncome={lastProjection.cumulativeNetIncome} airbnbCumulativeIncome={calculations.showAirbnbComparison ? lastProjection.airbnbCumulativeNetIncome : undefined} initialInvestment={totalCapitalInvested} currency={currency} rate={rate} showAirbnbComparison={calculations.showAirbnbComparison} />
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* Exit Scenarios - Collapsible - Only show if enabled */}
            {(inputs.enabledSections?.exitStrategy !== false) && (
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

            {/* Mortgage Analysis - Collapsible */}
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

            {/* Investment Summary - Last, collapsed by default */}
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
          </>
        )}

      </main>
    </div>
    </CashflowErrorBoundary>
  );
};

export default OICalculatorContent;
