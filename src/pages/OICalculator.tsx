import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { LayoutDashboard, Rocket, ChevronDown, ChevronUp, Home, Wifi, WifiOff, Target, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { OIInputModal } from "@/components/roi/OIInputModal";
import { OIGrowthCurve } from "@/components/roi/OIGrowthCurve";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { PaymentBreakdown } from "@/components/roi/PaymentBreakdown";
import { ExitScenariosCards, calculateAutoExitScenarios } from "@/components/roi/ExitScenariosCards";
import { ClientUnitInfo, ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { ClientUnitModal } from "@/components/roi/ClientUnitModal";
import { SaveControls } from "@/components/roi/SaveControls";
import { AdvisorInfo } from "@/components/roi/AdvisorInfo";
import { useOICalculations, OIInputs, OIExitScenario } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency, CURRENCY_CONFIG } from "@/components/roi/currencyUtils";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useCashflowQuote } from "@/hooks/useCashflowQuote";
import { useProfile } from "@/hooks/useProfile";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";

const DEFAULT_INPUTS: OIInputs = {
  basePrice: 800000,
  rentalYieldPercent: 8.5,
  appreciationRate: 10,
  bookingMonth: 1,
  bookingYear: 2025,
  handoverQuarter: 4,
  handoverYear: 2027,
  downpaymentPercent: 20,
  preHandoverPercent: 20,
  additionalPayments: [],
  eoiFee: 50000,
  oqoodFee: 5000,
  minimumExitThreshold: 30,
};

const DEFAULT_CLIENT_INFO: ClientUnitData = {
  developer: '',
  projectName: '',
  clientName: '',
  clientCountry: '',
  brokerName: '',
  unit: '',
  unitSizeSqf: 0,
  unitSizeM2: 0,
  unitType: '',
};

const OICalculatorContent = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>('AED');
  const [inputs, setInputs] = useState<OIInputs>(DEFAULT_INPUTS);
  const [clientInfo, setClientInfo] = useState<ClientUnitData>(DEFAULT_CLIENT_INFO);
  const [holdAnalysisOpen, setHoldAnalysisOpen] = useState(false);

  const { profile } = useProfile();
  const { 
    quote, 
    loading: quoteLoading, 
    saving, 
    lastSaved, 
    saveQuote, 
    saveAsNew, 
    scheduleAutoSave,
    generateShareToken,
    loadDraft 
  } = useCashflowQuote(quoteId);

  const calculations = useOICalculations(inputs);
  const { rate, isLive } = useExchangeRate(currency);

  // Load quote data or draft on mount
  useEffect(() => {
    if (quote) {
      setInputs(quote.inputs);
      setClientInfo({
        developer: quote.developer || '',
        projectName: quote.project_name || '',
        clientName: quote.client_name || '',
        clientCountry: quote.client_country || '',
        brokerName: profile?.full_name || '',
        unit: quote.unit || '',
        unitSizeSqf: quote.unit_size_sqf || 0,
        unitSizeM2: quote.unit_size_m2 || 0,
        unitType: quote.unit_type || '',
      });
    } else if (!quoteId) {
      // Load draft from localStorage
      const draft = loadDraft();
      if (draft?.inputs) {
        setInputs(draft.inputs);
      }
      if (draft?.clientInfo) {
        setClientInfo(prev => ({ ...prev, ...draft.clientInfo }));
      }
    }
  }, [quote, quoteId, profile?.full_name]);

  // Update broker name from profile
  useEffect(() => {
    if (profile?.full_name && !clientInfo.brokerName) {
      setClientInfo(prev => ({ ...prev, brokerName: profile.full_name || '' }));
    }
  }, [profile?.full_name]);

  // Auto-save when inputs or clientInfo change
  useEffect(() => {
    if (!quoteLoading) {
      scheduleAutoSave(inputs, clientInfo, quote?.id);
    }
  }, [inputs, clientInfo, quote?.id, quoteLoading]);

  // Exit scenarios - now user-configurable
  const [exitScenarios, setExitScenarios] = useState<number[]>(() => 
    calculateAutoExitScenarios(calculations.totalMonths)
  );

  // Update exit scenarios when totalMonths changes significantly
  useEffect(() => {
    const autoScenarios = calculateAutoExitScenarios(calculations.totalMonths);
    setExitScenarios(autoScenarios);
  }, [calculations.totalMonths]);

  const bestROEScenario = calculations.scenarios.reduce<OIExitScenario | null>(
    (best, current) => (!best || current.trueROE > best.trueROE ? current : best),
    null
  );

  const handoverScenario = calculations.scenarios.find(s => s.exitMonths === calculations.totalMonths);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleSave = useCallback(async () => {
    return saveQuote(inputs, clientInfo, quote?.id);
  }, [inputs, clientInfo, quote?.id, saveQuote]);

  const handleSaveAs = useCallback(async () => {
    const newQuote = await saveAsNew(inputs, clientInfo);
    if (newQuote) {
      navigate(`/cashflow/${newQuote.id}`);
    }
    return newQuote;
  }, [inputs, clientInfo, saveAsNew, navigate]);

  const handleShare = useCallback(async () => {
    if (!quote?.id) {
      // Save first if not saved
      const savedQuote = await handleSave();
      if (savedQuote) {
        return generateShareToken(savedQuote.id);
      }
      return null;
    }
    return generateShareToken(quote.id);
  }, [quote?.id, handleSave, generateShareToken]);

  if (quoteLoading && quoteId) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CCFF00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-[#2a3142] bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/home">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e]">
                <LayoutDashboard className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#00EAFF]/20 rounded-xl">
                  <Rocket className="w-6 h-6 text-[#00EAFF]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Cashflow Statements</h1>
                  <p className="text-sm text-gray-400">{t('exitScenariosPaymentBreakdown')}</p>
                </div>
              </div>
              {profile && (
                <>
                  <div className="h-10 w-px bg-[#2a3142]" />
                  <AdvisorInfo profile={profile} size="md" showSubtitle />
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Live rate indicator */}
            {currency !== 'AED' && (
              <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${isLive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>1 AED = {rate.toFixed(4)} {currency}</span>
              </div>
            )}
            
            {/* Save Controls */}
            <SaveControls
              quoteId={quote?.id}
              saving={saving}
              lastSaved={lastSaved}
              onSave={handleSave}
              onSaveAs={handleSaveAs}
              onShare={handleShare}
            />
            
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="border-[#2a3142] bg-[#1a1f2e] text-gray-300 hover:bg-[#2a3142] hover:text-white px-3"
            >
              {language === 'en' ? '🇬🇧 EN' : '🇪🇸 ES'}
            </Button>

            {/* Currency Selector */}
            <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
              <SelectTrigger className="w-[130px] border-[#2a3142] bg-[#1a1f2e] text-gray-300 hover:bg-[#2a3142]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key} className="text-gray-300 hover:bg-[#2a3142] focus:bg-[#2a3142]">
                    {config.flag} {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Settings Icon */}
            <Link to="/account-settings">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e]">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>

            <ClientUnitModal
              data={clientInfo}
              onChange={setClientInfo}
              open={clientModalOpen}
              onOpenChange={setClientModalOpen}
            />
            <OIInputModal
              inputs={inputs} 
              setInputs={setInputs} 
              open={modalOpen}
              onOpenChange={setModalOpen}
              currency={currency}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Client & Unit Information - Read-only display */}
        <ClientUnitInfo 
          data={clientInfo} 
          onEditClick={() => setClientModalOpen(true)} 
          brokerProfile={profile}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Charts & Tables */}
          <div className="xl:col-span-2 space-y-8">
            <OIGrowthCurve calculations={calculations} inputs={inputs} currency={currency} exitScenarios={exitScenarios} rate={rate} />

            <ExitScenariosCards 
              inputs={inputs}
              currency={currency}
              totalMonths={calculations.totalMonths}
              basePrice={calculations.basePrice}
              totalEntryCosts={calculations.totalEntryCosts}
              exitScenarios={exitScenarios}
              setExitScenarios={setExitScenarios}
              rate={rate}
            />

            <PaymentBreakdown 
              inputs={inputs}
              currency={currency}
              totalMonths={calculations.totalMonths}
              rate={rate}
            />

            <OIYearlyProjectionTable projections={calculations.yearlyProjections} currency={currency} rate={rate} />
          </div>

          {/* Right Column - Metrics Panel */}
          <div className="xl:col-span-1">
            <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-6 sticky top-24">
              <h3 className="font-semibold text-white mb-4">{t('investmentSummary')}</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-[#0d1117] rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">{t('basePropertyPrice')}</div>
                  <div className="text-xl font-bold text-white font-mono">
                    {formatCurrency(inputs.basePrice, currency, rate)}
                  </div>
                </div>

                <div className="p-4 bg-[#0d1117] rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">{t('paymentPlan')}</div>
                  <div className="text-xl font-bold text-[#CCFF00] font-mono">
                    {inputs.preHandoverPercent}/{100 - inputs.preHandoverPercent}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('downpayment')}: {inputs.downpaymentPercent}% + {inputs.additionalPayments.length} {t('additional')}
                  </div>
                </div>

                <div className="p-4 bg-[#0d1117] rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">{t('constructionPeriod')}</div>
                  <div className="text-xl font-bold text-white font-mono">
                    {calculations.totalMonths} {t('months')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {monthNames[inputs.bookingMonth - 1]} {inputs.bookingYear} → Q{inputs.handoverQuarter} {inputs.handoverYear}
                  </div>
                </div>

                {/* Editable Financial Metrics */}
                <div className="p-4 bg-[#0d1117] rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{t('appreciationRate')}</span>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[inputs.appreciationRate]}
                        onValueChange={([v]) => setInputs(prev => ({ ...prev, appreciationRate: v }))}
                        min={1}
                        max={25}
                        step={0.5}
                        className="w-20 roi-slider-lime"
                      />
                      <span className="text-sm font-bold text-[#CCFF00] font-mono w-12 text-right">{inputs.appreciationRate}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{t('rentalYield')}</span>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[inputs.rentalYieldPercent]}
                        onValueChange={([v]) => setInputs(prev => ({ ...prev, rentalYieldPercent: v }))}
                        min={3}
                        max={15}
                        step={0.5}
                        className="w-20 roi-slider-lime"
                      />
                      <span className="text-sm font-bold text-white font-mono w-12 text-right">{inputs.rentalYieldPercent}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Target className="w-3 h-3 text-[#CCFF00]" />
                      {t('minimumExitThreshold')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[inputs.minimumExitThreshold]}
                        onValueChange={([v]) => setInputs(prev => ({ ...prev, minimumExitThreshold: v }))}
                        min={10}
                        max={100}
                        step={5}
                        className="w-20 roi-slider-lime"
                      />
                      <span className="text-sm font-bold text-[#CCFF00] font-mono w-12 text-right">{inputs.minimumExitThreshold}%</span>
                    </div>
                  </div>
                </div>

                {/* Entry Costs Summary */}
                <div className="p-4 bg-[#0d1117] rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">{t('totalEntryCosts')}</div>
                  <div className="text-xl font-bold text-red-400 font-mono">
                    -{formatCurrency(calculations.totalEntryCosts, currency, rate)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    DLD 4% + Oqood {formatCurrency(inputs.oqoodFee, currency, rate)}
                  </div>
                </div>

                {/* Best ROE Highlight */}
                {bestROEScenario && (
                  <div className="p-4 bg-[#CCFF00]/10 border border-[#CCFF00]/30 rounded-xl">
                    <div className="text-xs text-[#CCFF00] mb-1">{t('bestROE')} ({bestROEScenario.exitMonths} {t('months')})</div>
                    <div className="text-2xl font-bold text-[#CCFF00] font-mono">
                      {bestROEScenario.trueROE.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {t('profit')}: {formatCurrency(bestROEScenario.trueProfit, currency, rate)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t('capital')}: {formatCurrency(bestROEScenario.totalCapitalDeployed, currency, rate)}
                    </div>
                  </div>
                )}

                {/* Handover */}
                {handoverScenario && (
                  <div className="p-4 bg-[#0d1117] rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">{t('atHandover')} ({handoverScenario.exitMonths} {t('months')})</div>
                    <div className="text-xl font-bold text-white font-mono">
                      {formatCurrency(handoverScenario.exitPrice, currency, rate)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t('profit')}: {formatCurrency(handoverScenario.trueProfit, currency, rate)}
                    </div>
                  </div>
                )}

                {/* Hold Analysis - Collapsible */}
                <div className="border border-[#2a3142] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setHoldAnalysisOpen(!holdAnalysisOpen)}
                    className="w-full p-4 flex items-center justify-between bg-[#0d1117] hover:bg-[#161b26] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{t('ifYouHoldAfterHandover')}</span>
                    </div>
                    {holdAnalysisOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {holdAnalysisOpen && (
                    <div className="p-4 space-y-3 bg-[#0d1117]/50">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">{t('totalCapitalInvested')}</span>
                        <span className="text-sm text-white font-mono">
                          {formatCurrency(calculations.holdAnalysis.totalCapitalInvested, currency, rate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">{t('valueAtHandover')}</span>
                        <span className="text-sm text-white font-mono">
                          {formatCurrency(calculations.holdAnalysis.propertyValueAtHandover, currency, rate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">{t('annualRentEst')}</span>
                        <span className="text-sm text-[#CCFF00] font-mono">
                          {formatCurrency(calculations.holdAnalysis.annualRent, currency, rate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">{t('rentalYieldOnInvestment')}</span>
                        <span className="text-sm text-white font-mono">
                          {calculations.holdAnalysis.rentalYieldOnInvestment.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">{t('yearsToBreakEven')}</span>
                        <span className="text-sm text-white font-mono">
                          {calculations.holdAnalysis.yearsToBreakEven.toFixed(1)} {language === 'en' ? 'years' : 'años'}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[#2a3142]">
                        <p className="text-xs text-gray-500">
                          💡 {t('holdingMeansFullPayment')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation to Full Calculator */}
              <div className="mt-6 pt-4 border-t border-[#2a3142] space-y-2">
                <Link to="/my-quotes">
                  <Button 
                    variant="outline" 
                    className="w-full bg-[#1a1f2e] border-[#CCFF00]/30 text-[#CCFF00] hover:bg-[#CCFF00]/20"
                  >
                    {t('myQuotes')}
                  </Button>
                </Link>
                <Link to="/roi-calculator">
                  <Button 
                    variant="outline" 
                    className="w-full border-[#2a3142] text-gray-300 hover:bg-[#2a3142] hover:text-white"
                  >
                    {t('fullROICalculator')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const OICalculator = () => {
  return (
    <LanguageProvider>
      <OICalculatorContent />
    </LanguageProvider>
  );
};

export default OICalculator;
