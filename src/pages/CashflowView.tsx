import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Rocket, TrendingUp, Home, Globe, Coins, Mail, MessageCircle, User, CreditCard, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { OIGrowthCurve } from '@/components/roi/OIGrowthCurve';
import { OIYearlyProjectionTable } from '@/components/roi/OIYearlyProjectionTable';
import { PaymentBreakdown } from '@/components/roi/PaymentBreakdown';
import { InvestmentSnapshot } from '@/components/roi/InvestmentSnapshot';
import { UnifiedInvestmentOverview } from '@/components/roi/UnifiedInvestmentOverview';
import { RentSnapshot } from '@/components/roi/RentSnapshot';
import { ExitScenariosCards, calculateAutoExitScenarios } from '@/components/roi/ExitScenariosCards';
import { ClientUnitInfo, ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { CumulativeIncomeChart } from '@/components/roi/CumulativeIncomeChart';
import { WealthSummaryCard } from '@/components/roi/WealthSummaryCard';
import { CollapsibleSection } from '@/components/roi/CollapsibleSection';
import { CashflowSummaryCard } from '@/components/roi/CashflowSummaryCard';
import { CashflowSkeleton } from '@/components/roi/CashflowSkeleton';
import { CashflowErrorBoundary } from '@/components/roi/ErrorBoundary';
import { ClientOnboardingModal, useClientOnboarding } from '@/components/roi/ClientOnboardingModal';
import { decodeVisibility } from '@/components/roi/ViewVisibilityControls';
import { MortgageBreakdown } from '@/components/roi/MortgageBreakdown';
import { useMortgageCalculations, MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from '@/components/roi/useMortgageCalculations';
import { ValueDifferentiatorsDisplay } from '@/components/roi/ValueDifferentiatorsDisplay';
import { useOICalculations, OIInputs } from '@/components/roi/useOICalculations';
import { Currency, CURRENCY_CONFIG } from '@/components/roi/currencyUtils';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardTabs } from '@/components/roi/tabs/DashboardTabs';

interface AdvisorProfile {
  full_name: string | null;
  avatar_url: string | null;
  business_email: string | null;
  whatsapp_number: string | null;
  whatsapp_country_code: string | null;
}

const CashflowViewContent = () => {
  useDocumentTitle("Cashflow Generator");
  const { shareToken } = useParams<{ shareToken: string }>();
  const [searchParams] = useSearchParams();
  const { language, setLanguage, t } = useLanguage();
  const [currency, setCurrency] = useState<Currency>('AED');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<OIInputs | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientUnitData | null>(null);
  const [mortgageInputs, setMortgageInputs] = useState<MortgageInputs>(DEFAULT_MORTGAGE_INPUTS);
  const [advisorProfile, setAdvisorProfile] = useState<AdvisorProfile | null>(null);
  const [quoteImages, setQuoteImages] = useState<{ heroImageUrl: string | null; buildingRenderUrl: string | null }>({
    heroImageUrl: null,
    buildingRenderUrl: null,
  });
  const { showOnboarding, setShowOnboarding } = useClientOnboarding();
  // Force story view only - no dashboard toggle for client view
  const viewTrackedRef = useRef(false);
  const { rate } = useExchangeRate(currency);
  
  // Parse visibility from URL
  const visibility = useMemo(() => decodeVisibility(searchParams.get('v')), [searchParams]);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!shareToken) {
        setError(t('invalidShareLink'));
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('cashflow_quotes')
        .select(`*, profiles:broker_id (full_name, avatar_url, business_email, whatsapp_number, whatsapp_country_code)`)
        .eq('share_token', shareToken)
        .single();

      if (fetchError || !data) {
        setError(t('quoteDeletedOrNotFound'));
        setLoading(false);
        return;
      }

      const savedInputs = data.inputs as unknown as Partial<OIInputs> & {
        _clients?: Array<{ id: string; name: string; country: string; share?: number }>;
        _clientInfo?: {
          developer?: string;
          projectName?: string;
          unit?: string;
          unitType?: string;
          unitSizeSqf?: number;
          unitSizeM2?: number;
          brokerName?: string;
          splitEnabled?: boolean;
          clientShares?: Array<{ clientId: string; sharePercent: number }>;
        };
      };
      
      setInputs({
        ...savedInputs,
        zoneMaturityLevel: savedInputs.zoneMaturityLevel ?? 60,
        useZoneDefaults: savedInputs.useZoneDefaults ?? true,
        constructionAppreciation: savedInputs.constructionAppreciation ?? 12,
        growthAppreciation: savedInputs.growthAppreciation ?? 8,
        matureAppreciation: savedInputs.matureAppreciation ?? 4,
        growthPeriodYears: savedInputs.growthPeriodYears ?? 5,
        rentGrowthRate: savedInputs.rentGrowthRate ?? 4,
        serviceChargePerSqft: savedInputs.serviceChargePerSqft ?? 18,
        adrGrowthRate: savedInputs.adrGrowthRate ?? 3,
        unitSizeSqf: data.unit_size_sqf || savedInputs.unitSizeSqf || 0,
      } as OIInputs);
      
      // Extract clients from _clients (new format) or fallback to single client (legacy)
      const savedClients = savedInputs._clients;
      const savedClientInfo = savedInputs._clientInfo;
      
      const clients = savedClients && savedClients.length > 0
        ? savedClients
        : data.client_name 
          ? [{ id: '1', name: data.client_name, country: data.client_country || '' }]
          : [];
          
      setClientInfo({
        developer: savedClientInfo?.developer || data.developer || '',
        clients,
        brokerName: savedClientInfo?.brokerName || (data.profiles as any)?.full_name || '',
        projectName: savedClientInfo?.projectName || data.project_name || '',
        unit: savedClientInfo?.unit || data.unit || '',
        unitSizeSqf: savedClientInfo?.unitSizeSqf || data.unit_size_sqf || 0,
        unitSizeM2: savedClientInfo?.unitSizeM2 || data.unit_size_m2 || 0,
        unitType: savedClientInfo?.unitType || data.unit_type || '',
        splitEnabled: savedClientInfo?.splitEnabled || false,
        clientShares: savedClientInfo?.clientShares || [],
      });
      
      // Load mortgage inputs if saved
      const savedMortgageInputs = (savedInputs as any)?._mortgageInputs;
      if (savedMortgageInputs) {
        setMortgageInputs(savedMortgageInputs);
      }
      
      setAdvisorProfile({
        full_name: (data.profiles as any)?.full_name || null,
        avatar_url: (data.profiles as any)?.avatar_url || null,
        business_email: (data.profiles as any)?.business_email || null,
        whatsapp_number: (data.profiles as any)?.whatsapp_number || null,
        whatsapp_country_code: (data.profiles as any)?.whatsapp_country_code || '+971',
      });
      
      // Fetch quote images
      const { data: imagesData } = await supabase
        .from('cashflow_images')
        .select('image_type, image_url')
        .eq('quote_id', data.id);

      if (imagesData) {
        const buildingRender = imagesData.find(img => img.image_type === 'building_render');
        const heroImage = imagesData.find(img => img.image_type === 'hero_image');
        setQuoteImages({
          heroImageUrl: heroImage?.image_url || null,
          buildingRenderUrl: buildingRender?.image_url || null,
        });
      }
      
      setLoading(false);
    };

    fetchQuote();
  }, [shareToken]);

  // Track view - only once per session, also track time spent
  const viewStartTime = useRef<number>(Date.now());
  const sessionIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!shareToken || viewTrackedRef.current) return;
    
    const sessionKey = `quote_viewed_${shareToken}`;
    const existingSessionId = sessionStorage.getItem(`quote_session_${shareToken}`);
    
    if (sessionStorage.getItem(sessionKey) && existingSessionId) {
      viewTrackedRef.current = true;
      sessionIdRef.current = existingSessionId;
      return;
    }
    
    const trackView = async () => {
      try {
        const { data } = await supabase.functions.invoke('track-quote-view', {
          body: { shareToken },
        });
        sessionStorage.setItem(sessionKey, 'true');
        viewTrackedRef.current = true;
        
        if (data?.session_id) {
          sessionIdRef.current = data.session_id;
          sessionStorage.setItem(`quote_session_${shareToken}`, data.session_id);
        }
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };
    
    trackView();
  }, [shareToken]);

  // Track time spent when user leaves the page
  useEffect(() => {
    const sendDuration = () => {
      if (!sessionIdRef.current) return;
      
      const durationSeconds = (Date.now() - viewStartTime.current) / 1000;
      
      // Use sendBeacon for reliable tracking on page close
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-quote-view-duration`;
      const payload = JSON.stringify({
        sessionId: sessionIdRef.current,
        durationSeconds,
      });
      
      navigator.sendBeacon(url, payload);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendDuration();
      }
    };

    const handleBeforeUnload = () => {
      sendDuration();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sendDuration();
    };
  }, []);

  const calculations = inputs ? useOICalculations(inputs) : null;
  const mortgageAnalysis = useMortgageCalculations({
    mortgageInputs,
    basePrice: calculations?.basePrice || 0,
    preHandoverPercent: inputs?.preHandoverPercent || 20,
    monthlyRent: calculations?.holdAnalysis?.annualRent ? calculations.holdAnalysis.annualRent / 12 : 0,
    monthlyServiceCharges: calculations?.holdAnalysis?.annualServiceCharges ? calculations.holdAnalysis.annualServiceCharges / 12 : 0,
  });
  // Load exit scenarios from saved inputs or auto-calculate, clamp to bounds
  const exitScenarios: number[] = useMemo(() => {
    const savedExitScenarios = (inputs as any)?._exitScenarios;
    const totalMonths = calculations?.totalMonths || 120;
    if (savedExitScenarios && Array.isArray(savedExitScenarios) && savedExitScenarios.length > 0) {
      // Clamp saved exit scenarios to valid bounds (1 to totalMonths)
      const clampedScenarios = savedExitScenarios
        .map((m: number) => Math.min(Math.max(1, m), totalMonths))
        .filter((m: number, i: number, arr: number[]) => arr.indexOf(m) === i); // Remove duplicates
      return clampedScenarios.length > 0 ? clampedScenarios : calculateAutoExitScenarios(totalMonths);
    }
    return calculations ? calculateAutoExitScenarios(calculations.totalMonths) : [12, 24, 36];
  }, [inputs, calculations?.totalMonths]);

  if (loading) {
    return <CashflowSkeleton />;
  }

  if (error || !inputs || !clientInfo || !calculations) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="p-4 bg-red-500/20 rounded-full inline-flex mb-4">
            <Rocket className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl text-theme-text mb-2">{t('quoteNotFound')}</h1>
          <p className="text-theme-text-muted">{error || t('quoteNotFoundDesc')}</p>
        </div>
      </div>
    );
  }

  // Use year 7 projection for WealthSummaryCard
  const year7Projection = calculations.yearlyProjections[6] || calculations.yearlyProjections[calculations.yearlyProjections.length - 1];
  const totalCapitalInvested = calculations.basePrice + calculations.totalEntryCosts;

  const handleEmailAdvisor = () => {
    if (advisorProfile?.business_email) {
      window.open(`mailto:${advisorProfile.business_email}`, '_blank');
    }
  };

  const handleWhatsAppAdvisor = () => {
    if (advisorProfile?.whatsapp_number) {
      const number = `${advisorProfile.whatsapp_country_code || '+971'}${advisorProfile.whatsapp_number}`.replace(/\D/g, '');
      window.open(`https://wa.me/${number}`, '_blank');
    }
  };

  return (
    <CashflowErrorBoundary>
    <ClientOnboardingModal 
      open={showOnboarding} 
      onOpenChange={setShowOnboarding}
      advisorName={advisorProfile?.full_name || undefined}
      onContactAdvisor={handleWhatsAppAdvisor}
    />
    <div className="min-h-screen bg-theme-bg">
      {/* Header */}
      <header className="border-b border-theme-border bg-theme-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Top row - Title and controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-theme-accent/20 rounded-xl">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-theme-accent" />
              </div>
              <h1 className="text-sm sm:text-xl font-bold text-theme-text">{t('cashflowStatement')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outlineDark" size="sm" onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="h-7 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm" title={t('language')}>
                <Globe className="w-3.5 h-3.5 sm:mr-1" />
                {language === 'en' ? '🇬🇧' : '🇪🇸'}
                <span className="hidden sm:inline ml-1">{language === 'en' ? 'EN' : 'ES'}</span>
              </Button>
              <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
                <SelectTrigger className="w-[80px] sm:w-[140px] h-7 sm:h-9 text-xs sm:text-sm border-theme-border bg-theme-card text-theme-text hover:bg-theme-card-alt" title={t('currency')}>
                  <Coins className="w-3.5 h-3.5 mr-1 text-theme-accent" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-theme-card border-theme-border">
                  {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key} className="text-theme-text hover:bg-theme-card-alt focus:bg-theme-card-alt">{config.flag} {key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Advisor info panel - scrolls with content */}
        <div className="mb-4 sm:mb-6 p-4 bg-theme-card rounded-xl border border-theme-border">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Avatar and info */}
            <div className="flex items-center gap-4 flex-1">
              {advisorProfile?.avatar_url ? (
                <img src={advisorProfile.avatar_url} alt={advisorProfile.full_name || 'Advisor'} className="w-14 h-14 rounded-full object-cover border-2 border-theme-accent/30" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-theme-card-alt flex items-center justify-center text-theme-text text-xl font-medium border-2 border-theme-accent/30">
                  {advisorProfile?.full_name ? advisorProfile.full_name.charAt(0).toUpperCase() : <User className="w-6 h-6 text-theme-text-muted" />}
                </div>
              )}
              <div>
                <p className="text-lg font-medium text-theme-text">{advisorProfile?.full_name || t('wealthAdvisor')}</p>
                <p className="text-sm text-theme-accent">{t('wealthAdvisor')}</p>
                {advisorProfile?.business_email && (
                  <p className="text-xs text-theme-text-muted mt-0.5">{advisorProfile.business_email}</p>
                )}
              </div>
            </div>
            
            {/* Contact buttons */}
            <div className="flex items-center gap-2">
              {advisorProfile?.business_email && (
                <Button 
                  onClick={handleEmailAdvisor}
                  variant="outline" 
                  size="sm"
                  className="border-theme-border bg-theme-bg text-theme-text hover:bg-theme-card-alt"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {t('emailAdvisor')}
                </Button>
              )}
              {advisorProfile?.whatsapp_number && (
                <Button 
                  onClick={handleWhatsAppAdvisor}
                  variant="outline" 
                  size="sm"
                  className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Story View - Client share view */}
        <div className="select-none">
            <ClientUnitInfo data={clientInfo} onEditClick={() => {}} readOnly={true} />

            {/* Unified Investment Overview - Combines grid and exit scenarios */}
            <div className="mb-4 sm:mb-6">
              <UnifiedInvestmentOverview
                inputs={inputs}
                calculations={calculations}
                mortgageAnalysis={mortgageAnalysis}
                mortgageEnabled={mortgageInputs.enabled}
                exitScenarios={exitScenarios}
                currency={currency}
                rate={rate}
                readOnly={true}
                compact={true}
              />
            </div>

            {/* Payment Breakdown - Collapsible */}
            {visibility.paymentBreakdown && (
              <CollapsibleSection
                title={t('paymentBreakdownTitle')}
                subtitle={`${inputs.preHandoverPercent}/${100 - inputs.preHandoverPercent} ${t('paymentStructure')}`}
                icon={<CreditCard className="w-5 h-5 text-theme-accent" />}
                defaultOpen={false}
              >
                <PaymentBreakdown inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} rate={rate} unitSizeSqf={clientInfo.unitSizeSqf} clientInfo={clientInfo} />
              </CollapsibleSection>
            )}

            {/* Value Differentiators Display */}
            <ValueDifferentiatorsDisplay
              selectedDifferentiators={inputs.valueDifferentiators || []}
              readOnly={true}
              showAppreciationBonus={visibility.showAppreciationBonus}
            />

            {/* Hold Strategy Analysis - Collapsible - default CLOSED for client view */}
            {visibility.longTermHold && (inputs.enabledSections?.longTermHold !== false) && (
              <CollapsibleSection
                title={t('holdStrategyAnalysis')}
                subtitle={t('holdStrategySubtitle')}
                icon={<Home className="w-5 h-5 text-theme-accent" />}
                defaultOpen={false}
              >
                <div className="space-y-4 sm:space-y-6">
                  {visibility.rentSnapshot && (
                    <RentSnapshot inputs={inputs} currency={currency} rate={rate} holdAnalysis={calculations.holdAnalysis} />
                  )}
                  <CumulativeIncomeChart projections={calculations.yearlyProjections.slice(0, 7)} currency={currency} rate={rate} totalCapitalInvested={totalCapitalInvested} showAirbnbComparison={calculations.showAirbnbComparison} />
                  <OIYearlyProjectionTable projections={calculations.yearlyProjections.slice(0, 7)} currency={currency} rate={rate} showAirbnbComparison={calculations.showAirbnbComparison} />
                  <WealthSummaryCard propertyValueFinal={year7Projection.propertyValue} cumulativeRentIncome={year7Projection.cumulativeNetIncome} airbnbCumulativeIncome={calculations.showAirbnbComparison ? year7Projection.airbnbCumulativeNetIncome : undefined} initialInvestment={totalCapitalInvested} currency={currency} rate={rate} showAirbnbComparison={calculations.showAirbnbComparison} />
                </div>
              </CollapsibleSection>
            )}

            {/* Exit Strategy - Collapsible - requires explicit enabling OR existing scenarios */}
            {visibility.exitStrategy && (inputs.enabledSections?.exitStrategy === true || (inputs.enabledSections?.exitStrategy !== false && Array.isArray((inputs as any)?._exitScenarios) && (inputs as any)._exitScenarios.length > 0)) && (
              <CollapsibleSection
                title={t('exitStrategyAnalysis')}
                subtitle={t('whenToSell')}
                icon={<TrendingUp className="w-5 h-5 text-theme-accent" />}
                defaultOpen={false}
              >
                <div className="space-y-4 sm:space-y-6">
                  <ExitScenariosCards inputs={inputs} currency={currency} totalMonths={calculations.totalMonths} basePrice={calculations.basePrice} totalEntryCosts={calculations.totalEntryCosts} exitScenarios={exitScenarios} rate={rate} readOnly={true} unitSizeSqf={clientInfo.unitSizeSqf} />
                  <OIGrowthCurve calculations={calculations} inputs={inputs} currency={currency} exitScenarios={exitScenarios} rate={rate} />
                </div>
              </CollapsibleSection>
            )}

            {/* Mortgage Analysis - Collapsible */}
            {mortgageInputs.enabled && calculations && (
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
                  
                  // Year 5 = first full rental year + 4 years of rent growth
                  // With 4% growth: 1.04^4 = 1.1699 = +17% growth over 4 years
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
                      rentGrowthRate={inputs.rentGrowthRate}
                      year5LongTermRent={year5LongTermRent}
                      year5AirbnbNet={year5AirbnbNet}
                    />
                  );
                })()}
              </CollapsibleSection>
            )}

            {/* Investment Summary - Read-only for client view */}
            <CashflowSummaryCard
              inputs={inputs}
              clientInfo={clientInfo}
              calculations={calculations}
              mortgageAnalysis={mortgageAnalysis}
              mortgageInputs={mortgageInputs}
              exitScenarios={exitScenarios}
              currency={currency}
              rate={rate}
              showExitScenarios={(inputs as any)?._summaryToggles?.showExit ?? (inputs.enabledSections?.exitStrategy === true || (inputs.enabledSections?.exitStrategy !== false && Array.isArray((inputs as any)?._exitScenarios) && (inputs as any)._exitScenarios.length > 0))}
              showRentalPotential={(inputs as any)?._summaryToggles?.showRental ?? true}
              showMortgageAnalysis={mortgageInputs?.enabled ?? false}
              readOnly={true}
              defaultOpen={false}
            />
          </div>

        <footer className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-theme-border text-center">
          <p className="text-xs text-theme-text-muted">{t('disclaimerText')}</p>
        </footer>
      </main>
    </div>
    </CashflowErrorBoundary>
  );
};

export default CashflowViewContent;
