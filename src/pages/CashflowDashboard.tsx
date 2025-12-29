import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { LayoutDashboard, SlidersHorizontal, Settings2, AlertCircle, MoreVertical, FolderOpen, FilePlus, History, Save, Loader2, Check, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OIInputModal } from "@/components/roi/OIInputModal";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { ClientUnitModal } from "@/components/roi/ClientUnitModal";
import { QuotesDropdown } from "@/components/roi/QuotesDropdown";
import { SettingsDropdown } from "@/components/roi/SettingsDropdown";
import { AdvisorInfo } from "@/components/roi/AdvisorInfo";
import { ViewVisibilityControls, ViewVisibility } from "@/components/roi/ViewVisibilityControls";
import { LoadQuoteModal } from "@/components/roi/LoadQuoteModal";
import { VersionHistoryModal } from "@/components/roi/VersionHistoryModal";
import { CashflowSkeleton } from "@/components/roi/CashflowSkeleton";
import { CashflowErrorBoundary } from "@/components/roi/ErrorBoundary";
import { MortgageModal } from "@/components/roi/MortgageModal";
import { useMortgageCalculations, MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from "@/components/roi/useMortgageCalculations";
import { AlertTriangle, TrendingUp } from "lucide-react";
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
import { DashboardLayout, SectionId } from "@/components/roi/dashboard";
import { PropertyTabContent, PaymentsTabContent, HoldTabContent, ExitTabContent, MortgageTabContent, SummaryTabContent } from "@/components/roi/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DEFAULT_INPUTS: OIInputs = {
  basePrice: 800000, rentalYieldPercent: 8.5, appreciationRate: 10, bookingMonth: 1, bookingYear: 2025, handoverQuarter: 4, handoverYear: 2027, downpaymentPercent: 20, preHandoverPercent: 20, additionalPayments: [], eoiFee: 50000, oqoodFee: 5000, minimumExitThreshold: 30, showAirbnbComparison: false, shortTermRental: { averageDailyRate: 800, occupancyPercent: 70, operatingExpensePercent: 25, managementFeePercent: 15 }, zoneMaturityLevel: 60, useZoneDefaults: true, constructionAppreciation: 12, growthAppreciation: 8, matureAppreciation: 4, growthPeriodYears: 5, rentGrowthRate: 4, serviceChargePerSqft: 18, adrGrowthRate: 3, valueDifferentiators: [],
};

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
  const [inputs, setInputs] = useState<OIInputs>(DEFAULT_INPUTS);
  const [clientInfo, setClientInfo] = useState<ClientUnitData>(DEFAULT_CLIENT_INFO);
  const [mortgageInputs, setMortgageInputs] = useState<MortgageInputs>(DEFAULT_MORTGAGE_INPUTS);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('property');

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
    return inputs.basePrice !== 800000 || !!quoteId;
  }, [inputs.basePrice, quoteId]);

  const isFullyConfigured = hasClientDetails && hasPropertyConfigured;

  const isQuoteConfigured = useMemo(() => {
    return (
      !!quoteId ||
      !!clientInfo.developer ||
      !!clientInfo.projectName ||
      inputs.basePrice !== 800000
    );
  }, [quoteId, clientInfo.developer, clientInfo.projectName, inputs.basePrice]);

  // Load quote data
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
    } else if (!quoteId) {
      const draft = loadDraft();
      if (draft?.inputs) setInputs(migrateInputs(draft.inputs));
      if (draft?.clientInfo) setClientInfo(prev => ({ ...prev, ...draft.clientInfo }));
      setDataLoaded(true);
    }
  }, [quote, quoteId, dataLoaded, loadDraft]);

  useEffect(() => { setDataLoaded(false); }, [quoteId]);
  useEffect(() => { if (profile?.full_name && !clientInfo.brokerName) setClientInfo(prev => ({ ...prev, brokerName: profile.full_name || '' })); }, [profile?.full_name]);
  useEffect(() => { if (clientInfo.unitSizeSqf && clientInfo.unitSizeSqf !== inputs.unitSizeSqf) setInputs(prev => ({ ...prev, unitSizeSqf: clientInfo.unitSizeSqf })); }, [clientInfo.unitSizeSqf]);

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
      mortgageInputs
    );
  }, [inputs, clientInfo, quoteId, quote?.id, quoteLoading, isQuoteConfigured, mortgageInputs, scheduleAutoSave, dataLoaded]);

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
  const handleSave = useCallback(async () => saveQuote(inputs, clientInfo, quote?.id, exitScenarios, mortgageInputs, saveVersion), [inputs, clientInfo, quote?.id, exitScenarios, mortgageInputs, saveQuote, saveVersion]);
  const handleSaveAs = useCallback(async () => { const newQuote = await saveAsNew(inputs, clientInfo, exitScenarios, mortgageInputs); if (newQuote) navigate(`/cashflow-dashboard/${newQuote.id}`); return newQuote; }, [inputs, clientInfo, exitScenarios, mortgageInputs, saveAsNew, navigate]);
  const handleShare = useCallback(async () => {
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

  // Navigate to classic view
  const handleSwitchToClassic = useCallback(() => {
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
        {/* Header */}
        <header className="border-b border-theme-border bg-theme-bg/80 backdrop-blur-xl sticky top-0 z-50 print:hidden">
          <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
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
                    size="icon"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-8 w-8 sm:h-8 sm:w-auto sm:px-3"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
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

                  {/* Switch to Classic View */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSwitchToClassic}
                        className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card h-8 w-8"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('switchToClassic')}</p>
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
                  <ViewVisibilityControls shareUrl={shareUrl} onGenerateShareUrl={handleShare} onExportPDF={handleExportPDF} />

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
                      <DropdownMenuItem
                        onClick={() => {
                          localStorage.removeItem('cashflow_quote_draft');
                          navigate('/cashflow-dashboard');
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

                      <DropdownMenuItem
                        onClick={handleSwitchToClassic}
                        className="text-theme-text-muted hover:bg-theme-card-alt focus:bg-theme-card-alt gap-2"
                      >
                        <List className="w-4 h-4" />
                        {t('switchToClassic')}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-theme-border" />

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

                {/* Modals */}
                <MortgageModal
                  mortgageInputs={mortgageInputs}
                  setMortgageInputs={setMortgageInputs}
                  preHandoverPercent={inputs.preHandoverPercent}
                  open={mortgageModalOpen}
                  onOpenChange={setMortgageModalOpen}
                />
                <ClientUnitModal data={clientInfo} onChange={setClientInfo} open={clientModalOpen} onOpenChange={setClientModalOpen} />
                <OIInputModal inputs={inputs} setInputs={setInputs} open={modalOpen} onOpenChange={setModalOpen} currency={currency} mortgageInputs={mortgageInputs} setMortgageInputs={setMortgageInputs} />
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

        {!isFullyConfigured ? (
          /* Unconfigured State */
          <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
            <div className="bg-theme-card border border-theme-border rounded-2xl p-8 sm:p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-theme-accent/20 flex items-center justify-center mx-auto mb-6">
                  {!hasClientDetails ? <AlertCircle className="w-8 h-8 text-theme-accent" /> : <Settings2 className="w-8 h-8 text-theme-accent" />}
                </div>
                <h3 className="text-xl font-semibold text-theme-text mb-3">
                  {!hasClientDetails ? t('completeClientInfo') : t('configurePropertyFinancials')}
                </h3>
                <p className="text-theme-text-muted mb-6">
                  {!hasClientDetails ? t('completeClientInfoDesc') : t('configurePropertyFinancialsDesc')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {!hasClientDetails ? (
                    <Button
                      onClick={() => setClientModalOpen(true)}
                      className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90 gap-2"
                    >
                      <Settings2 className="w-4 h-4" />
                      Set Client & Property
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setModalOpen(true)}
                      className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90 gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Configure Financials
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </main>
        ) : (
          /* Configured State - Dashboard with Sidebar Navigation */
          <DashboardLayout
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            inputs={inputs}
            mortgageInputs={mortgageInputs}
          >
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
          </DashboardLayout>
        )}
      </div>
    </CashflowErrorBoundary>
  );
};

export default CashflowDashboardContent;
