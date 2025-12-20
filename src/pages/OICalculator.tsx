import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { LayoutDashboard, Wifi, WifiOff, Settings, TrendingUp, Home, FolderOpen, Globe, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { RentSnapshot } from "@/components/roi/RentSnapshot";
import { ExitScenariosCards, calculateAutoExitScenarios } from "@/components/roi/ExitScenariosCards";
import { ClientUnitInfo, ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { ClientUnitModal } from "@/components/roi/ClientUnitModal";
import { SaveControls } from "@/components/roi/SaveControls";
import { AdvisorInfo } from "@/components/roi/AdvisorInfo";
import { CumulativeIncomeChart } from "@/components/roi/CumulativeIncomeChart";
import { WealthSummaryCard } from "@/components/roi/WealthSummaryCard";
import { ViewVisibilityControls, ViewVisibility } from "@/components/roi/ViewVisibilityControls";
import { CollapsibleSection } from "@/components/roi/CollapsibleSection";
import { LoadQuoteModal } from "@/components/roi/LoadQuoteModal";
import { useOICalculations, OIInputs } from "@/components/roi/useOICalculations";
import { migrateInputs } from "@/components/roi/inputMigration";
import { Currency, CURRENCY_CONFIG } from "@/components/roi/currencyUtils";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useCashflowQuote } from "@/hooks/useCashflowQuote";
import { useProfile } from "@/hooks/useProfile";
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
  const [currency, setCurrency] = useState<Currency>('AED');
  const [inputs, setInputs] = useState<OIInputs>(DEFAULT_INPUTS);
  const [clientInfo, setClientInfo] = useState<ClientUnitData>(DEFAULT_CLIENT_INFO);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const { profile } = useProfile();
  const { quote, loading: quoteLoading, saving, lastSaved, saveQuote, saveAsNew, scheduleAutoSave, generateShareToken, loadDraft } = useCashflowQuote(quoteId);
  const calculations = useOICalculations(inputs);
  const { rate, isLive } = useExchangeRate(currency);

  useEffect(() => {
    if (dataLoaded) return;
    if (quote) {
      const savedClients = (quote.inputs as any)?._clients || [];
      const savedClientInfo = (quote.inputs as any)?._clientInfo || {};
      const cleanInputs = { ...quote.inputs };
      delete (cleanInputs as any)._clients;
      delete (cleanInputs as any)._clientInfo;
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
      });
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
  useEffect(() => { if (!quoteLoading) scheduleAutoSave(inputs, clientInfo, quote?.id); }, [inputs, clientInfo, quote?.id, quoteLoading]);

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
  }, [quote?.id, inputs, clientInfo, exitScenarios, saveQuote, generateShareToken]);

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
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CCFF00]" /></div>;
  }

  return (
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
              {profile && <AdvisorInfo profile={profile} size="lg" showSubtitle />}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Primary Actions */}
              <Button variant="outline" size="sm" onClick={() => setLoadQuoteModalOpen(true)} className="border-[#2a3142] bg-[#1a1f2e] text-gray-300 hover:bg-[#2a3142] hover:text-white h-8 px-2 sm:px-3">
                <FolderOpen className="w-4 h-4" />
                <span className="hidden md:inline ml-1.5">{t('loadQuote')}</span>
              </Button>
              <SaveControls saving={saving} lastSaved={lastSaved} onSave={handleSave} onSaveAs={handleSaveAs} />
              <ViewVisibilityControls shareUrl={shareUrl} onGenerateShareUrl={handleShare} onExportPDF={handleExportPDF} />

              {/* Separator */}
              <div className="hidden sm:block w-px h-6 bg-[#2a3142] mx-1" />

              {/* Secondary Controls */}
              <div className="hidden sm:flex items-center gap-1.5">
                {currency !== 'AED' && (
                  <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${isLive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    <span>1 AED = {rate.toFixed(4)} {currency}</span>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="text-gray-400 hover:text-white hover:bg-[#1a1f2e] h-8 px-2" title={t('language')}>
                  <Globe className="w-3.5 h-3.5" />
                  <span className="ml-1">{language === 'en' ? '🇬🇧' : '🇪🇸'}</span>
                </Button>
                <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
                  <SelectTrigger className="w-[90px] h-8 text-xs border-[#2a3142] bg-[#1a1f2e] text-gray-300 hover:bg-[#2a3142]" title={t('currency')}>
                    <Coins className="w-3.5 h-3.5 mr-1 text-[#CCFF00]" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f2e] border-[#2a3142] z-50">
                    {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key} className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142]">{config.flag} {key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Link to="/account-settings">
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e] h-8 w-8">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Mobile: Secondary controls dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="sm:hidden">
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e] h-8 w-8">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1f2e] border-[#2a3142] z-50 w-48">
                  <DropdownMenuItem onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142]">
                    <Globe className="w-4 h-4 mr-2" />
                    {language === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#2a3142]" />
                  {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                    <DropdownMenuItem key={key} onClick={() => setCurrency(key as Currency)} className={`text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142] ${currency === key ? 'bg-[#2a3142]' : ''}`}>
                      <Coins className="w-4 h-4 mr-2" />
                      {config.flag} {key}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-[#2a3142]" />
                  <Link to="/account-settings">
                    <DropdownMenuItem className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142]">
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Configure Button - Always visible */}
              <ClientUnitModal data={clientInfo} onChange={setClientInfo} open={clientModalOpen} onOpenChange={setClientModalOpen} />
              <OIInputModal inputs={inputs} setInputs={setInputs} open={modalOpen} onOpenChange={setModalOpen} currency={currency} />
              <LoadQuoteModal open={loadQuoteModalOpen} onOpenChange={setLoadQuoteModalOpen} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <ClientUnitInfo data={clientInfo} onEditClick={() => setClientModalOpen(true)} />

        {/* Payment Breakdown 2/3 + Investment Snapshot 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="lg:col-span-2">
            <PaymentBreakdown inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} rate={rate} />
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
            <OIYearlyProjectionTable projections={calculations.yearlyProjections} currency={currency} rate={rate} showAirbnbComparison={calculations.showAirbnbComparison} />
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
            <ExitScenariosCards inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} basePrice={calculations.basePrice} totalEntryCosts={calculations.totalEntryCosts} exitScenarios={exitScenarios} setExitScenarios={setExitScenarios} rate={rate} />
            <OIGrowthCurve calculations={calculations} inputs={inputs} currency={currency} exitScenarios={exitScenarios} rate={rate} />
          </div>
        </CollapsibleSection>

        <div className="mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-4 print:hidden">
          <Link to="/my-quotes"><Button variant="outline" className="bg-[#1a1f2e] border-[#CCFF00]/30 text-[#CCFF00] hover:bg-[#CCFF00]/20 text-xs sm:text-sm">{t('myQuotes')}</Button></Link>
          <Link to="/roi-calculator"><Button variant="outline" className="border-[#2a3142] text-gray-300 hover:bg-[#2a3142] hover:text-white text-xs sm:text-sm">{t('fullROICalculator')}</Button></Link>
        </div>
      </main>
    </div>
  );
};

export default OICalculatorContent;
