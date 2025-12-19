import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { LayoutDashboard, Wifi, WifiOff, Settings, TrendingUp, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OIInputModal } from "@/components/roi/OIInputModal";
import { OIGrowthCurve } from "@/components/roi/OIGrowthCurve";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { PaymentBreakdown } from "@/components/roi/PaymentBreakdown";
import { InvestmentSnapshot } from "@/components/roi/InvestmentSnapshot";
import { RentSnapshot } from "@/components/roi/RentSnapshot";
import { ExitScenariosCards, calculateAutoExitScenarios } from "@/components/roi/ExitScenariosCards";
import { ClientUnitInfo, ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { ClientUnitModal } from "@/components/roi/ClientUnitModal";
import { SaveControls } from "@/components/roi/SaveControls";
import { AdvisorInfo } from "@/components/roi/AdvisorInfo";
import { SectionHeader } from "@/components/roi/SectionHeader";
import { CumulativeIncomeChart } from "@/components/roi/CumulativeIncomeChart";
import { WealthSummaryCard } from "@/components/roi/WealthSummaryCard";
import { ViewVisibilityControls, ViewVisibility } from "@/components/roi/ViewVisibilityControls";
import { useOICalculations, OIInputs } from "@/components/roi/useOICalculations";
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
      setInputs(cleanInputs);
      const clients = savedClients.length > 0 ? savedClients : quote.client_name ? [{ id: '1', name: quote.client_name, country: quote.client_country || '' }] : [];
      setClientInfo({ developer: savedClientInfo.developer || quote.developer || '', projectName: savedClientInfo.projectName || quote.project_name || '', clients, brokerName: savedClientInfo.brokerName || '', unit: savedClientInfo.unit || quote.unit || '', unitSizeSqf: savedClientInfo.unitSizeSqf || quote.unit_size_sqf || 0, unitSizeM2: savedClientInfo.unitSizeM2 || quote.unit_size_m2 || 0, unitType: savedClientInfo.unitType || quote.unit_type || '' });
      setDataLoaded(true);
    } else if (!quoteId) {
      const draft = loadDraft();
      if (draft?.inputs) setInputs(draft.inputs);
      if (draft?.clientInfo) setClientInfo(prev => ({ ...prev, ...draft.clientInfo }));
      setDataLoaded(true);
    }
  }, [quote, quoteId, dataLoaded, loadDraft]);

  useEffect(() => { setDataLoaded(false); }, [quoteId]);
  useEffect(() => { if (profile?.full_name && !clientInfo.brokerName) setClientInfo(prev => ({ ...prev, brokerName: profile.full_name || '' })); }, [profile?.full_name]);
  useEffect(() => { if (clientInfo.unitSizeSqf && clientInfo.unitSizeSqf !== inputs.unitSizeSqf) setInputs(prev => ({ ...prev, unitSizeSqf: clientInfo.unitSizeSqf })); }, [clientInfo.unitSizeSqf]);
  useEffect(() => { if (!quoteLoading) scheduleAutoSave(inputs, clientInfo, quote?.id); }, [inputs, clientInfo, quote?.id, quoteLoading]);

  const [exitScenarios, setExitScenarios] = useState<number[]>(() => calculateAutoExitScenarios(calculations.totalMonths));
  useEffect(() => { setExitScenarios(calculateAutoExitScenarios(calculations.totalMonths)); }, [calculations.totalMonths]);

  const handleSave = useCallback(async () => saveQuote(inputs, clientInfo, quote?.id), [inputs, clientInfo, quote?.id, saveQuote]);
  const handleSaveAs = useCallback(async () => { const newQuote = await saveAsNew(inputs, clientInfo); if (newQuote) navigate(`/cashflow/${newQuote.id}`); return newQuote; }, [inputs, clientInfo, saveAsNew, navigate]);
  const handleShare = useCallback(async () => {
    let token: string | null = null;
    if (!quote?.id) {
      const savedQuote = await handleSave();
      if (savedQuote) token = await generateShareToken(savedQuote.id);
    } else {
      token = await generateShareToken(quote.id);
    }
    if (token) {
      return `${window.location.origin}/cash-statement/${token}`;
    }
    return null;
  }, [quote?.id, handleSave, generateShareToken]);

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
          <div><h1 className="text-2xl font-bold text-[#CCFF00]">CASHFLOW STATEMENT</h1><p className="text-gray-400 text-sm mt-1">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
          {profile && <div className="text-right"><p className="text-sm text-gray-400">{t('advisor')}</p><p className="font-medium">{profile.full_name || 'Advisor'}</p></div>}
        </div>
      </div>

      <header className="border-b border-[#2a3142] bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/home"><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e]"><LayoutDashboard className="w-5 h-5" /></Button></Link>
            {profile && <AdvisorInfo profile={profile} size="lg" showSubtitle />}
          </div>
          <div className="flex items-center gap-3">
            {currency !== 'AED' && <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${isLive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}<span>1 AED = {rate.toFixed(4)} {currency}</span></div>}
            <SaveControls quoteId={quote?.id} saving={saving} lastSaved={lastSaved} onSave={handleSave} onSaveAs={handleSaveAs} onShare={handleShare} />
            <ViewVisibilityControls shareUrl={shareUrl} onGenerateShareUrl={handleShare} onExportPDF={handleExportPDF} />
            <Button variant="outline" size="sm" onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="border-[#2a3142] bg-[#1a1f2e] text-gray-300 hover:bg-[#2a3142] hover:text-white px-3">{language === 'en' ? '🇬🇧 EN' : '🇪🇸 ES'}</Button>
            <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}><SelectTrigger className="w-[130px] border-[#2a3142] bg-[#1a1f2e] text-gray-300 hover:bg-[#2a3142]"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1a1f2e] border-[#2a3142]">{Object.entries(CURRENCY_CONFIG).map(([key, config]) => <SelectItem key={key} value={key} className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142]">{config.flag} {key}</SelectItem>)}</SelectContent></Select>
            <Link to="/account-settings"><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e]"><Settings className="w-5 h-5" /></Button></Link>
            <ClientUnitModal data={clientInfo} onChange={setClientInfo} open={clientModalOpen} onOpenChange={setClientModalOpen} />
            <OIInputModal inputs={inputs} setInputs={setInputs} open={modalOpen} onOpenChange={setModalOpen} currency={currency} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <ClientUnitInfo data={clientInfo} onEditClick={() => setClientModalOpen(true)} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2"><PaymentBreakdown inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} rate={rate} clientInfo={clientInfo} /></div>
          <div className="xl:col-span-1 flex flex-col">
            <InvestmentSnapshot inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} totalEntryCosts={calculations.totalEntryCosts} rate={rate} holdAnalysis={calculations.holdAnalysis} />
            <RentSnapshot inputs={inputs} currency={currency} rate={rate} holdAnalysis={calculations.holdAnalysis} />
          </div>
        </div>

        {/* Exit Strategy Section */}
        <div className="mb-8">
          <SectionHeader icon={<TrendingUp className="w-5 h-5 text-[#CCFF00]" />} title={t('exitStrategyAnalysis')} subtitle={t('whenToSell')} />
          <div className="space-y-6">
            <OIGrowthCurve calculations={calculations} inputs={inputs} currency={currency} exitScenarios={exitScenarios} rate={rate} />
            <ExitScenariosCards inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} basePrice={calculations.basePrice} totalEntryCosts={calculations.totalEntryCosts} exitScenarios={exitScenarios} setExitScenarios={setExitScenarios} rate={rate} />
          </div>
        </div>

        {/* Long-Term Hold Section */}
        <div className="mb-8">
          <SectionHeader icon={<Home className="w-5 h-5 text-[#CCFF00]" />} title={t('longTermHoldAnalysis')} subtitle={t('tenYearProjection')} />
          <div className="space-y-6">
            <CumulativeIncomeChart projections={calculations.yearlyProjections} currency={currency} rate={rate} totalCapitalInvested={totalCapitalInvested} showAirbnbComparison={calculations.showAirbnbComparison} />
            <OIYearlyProjectionTable projections={calculations.yearlyProjections} currency={currency} rate={rate} showAirbnbComparison={calculations.showAirbnbComparison} />
            <WealthSummaryCard propertyValueYear10={lastProjection.propertyValue} cumulativeRentIncome={lastProjection.cumulativeNetIncome} airbnbCumulativeIncome={calculations.showAirbnbComparison ? lastProjection.airbnbCumulativeNetIncome : undefined} initialInvestment={totalCapitalInvested} currency={currency} rate={rate} showAirbnbComparison={calculations.showAirbnbComparison} />
          </div>
        </div>

        <div className="mt-8 flex gap-4 print:hidden">
          <Link to="/my-quotes"><Button variant="outline" className="bg-[#1a1f2e] border-[#CCFF00]/30 text-[#CCFF00] hover:bg-[#CCFF00]/20">{t('myQuotes')}</Button></Link>
          <Link to="/roi-calculator"><Button variant="outline" className="border-[#2a3142] text-gray-300 hover:bg-[#2a3142] hover:text-white">{t('fullROICalculator')}</Button></Link>
        </div>
      </main>
    </div>
  );
};

const OICalculator = () => <LanguageProvider><OICalculatorContent /></LanguageProvider>;
export default OICalculator;
