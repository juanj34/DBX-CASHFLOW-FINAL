import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { OIGrowthCurve } from '@/components/roi/OIGrowthCurve';
import { OIYearlyProjectionTable } from '@/components/roi/OIYearlyProjectionTable';
import { PaymentBreakdown } from '@/components/roi/PaymentBreakdown';
import { InvestmentSnapshot } from '@/components/roi/InvestmentSnapshot';
import { ExitScenariosCards, calculateAutoExitScenarios } from '@/components/roi/ExitScenariosCards';
import { ClientUnitInfo, ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { useOICalculations, OIInputs } from '@/components/roi/useOICalculations';
import { Currency, CURRENCY_CONFIG } from '@/components/roi/currencyUtils';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';

interface AdvisorProfile {
  full_name: string | null;
  avatar_url: string | null;
}

const CashflowViewContent = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { language, setLanguage, t } = useLanguage();
  const [currency, setCurrency] = useState<Currency>('AED');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<OIInputs | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientUnitData | null>(null);
  const [advisorProfile, setAdvisorProfile] = useState<AdvisorProfile | null>(null);

  const { rate } = useExchangeRate(currency);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!shareToken) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('cashflow_quotes')
        .select(`
          *,
          profiles:broker_id (full_name, avatar_url)
        `)
        .eq('share_token', shareToken)
        .single();

      if (fetchError || !data) {
        setError('Quote not found or has been deleted');
        setLoading(false);
        return;
      }

      // Merge with defaults to ensure all new fields exist
      const savedInputs = data.inputs as unknown as Partial<OIInputs>;
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
      // Migrate from legacy single client format to clients array
      const clients = data.client_name 
        ? [{ id: '1', name: data.client_name, country: data.client_country || '' }]
        : [];
      setClientInfo({
        developer: data.developer || '',
        clients,
        brokerName: (data.profiles as any)?.full_name || '',
        projectName: data.project_name || '',
        unit: data.unit || '',
        unitSizeSqf: data.unit_size_sqf || 0,
        unitSizeM2: data.unit_size_m2 || 0,
        unitType: data.unit_type || '',
      });
      setAdvisorProfile({
        full_name: (data.profiles as any)?.full_name || null,
        avatar_url: (data.profiles as any)?.avatar_url || null,
      });
      setLoading(false);
    };

    fetchQuote();
  }, [shareToken]);

  const calculations = inputs ? useOICalculations(inputs) : null;

  const exitScenarios: number[] = useMemo(() => 
    calculations ? calculateAutoExitScenarios(calculations.totalMonths) : [12, 24, 36],
    [calculations?.totalMonths]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CCFF00]" />
      </div>
    );
  }

  if (error || !inputs || !clientInfo || !calculations) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-2">Quote Not Found</h1>
          <p className="text-gray-400">{error || 'This quote may have been deleted or the link is invalid.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header - Simplified for client view */}
      <header className="border-b border-[#2a3142] bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-[#00EAFF]/20 rounded-xl">
              <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-[#00EAFF]" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-white">Cashflow Statement</h1>
            </div>
            {/* Desktop: Advisor info inline */}
            {advisorProfile?.full_name && (
              <div className="hidden md:flex items-center">
                <div className="h-8 w-px bg-[#2a3142] mx-2" />
                <div className="flex items-center gap-3">
                  {advisorProfile.avatar_url ? (
                    <img 
                      src={advisorProfile.avatar_url} 
                      alt={advisorProfile.full_name} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#2a3142]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#2a3142] flex items-center justify-center text-white font-medium">
                      {advisorProfile.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{advisorProfile.full_name}</p>
                    <p className="text-xs text-gray-400">Wealth Advisor</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle - Compact on mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="border-[#2a3142] bg-[#1a1f2e] text-gray-300 hover:bg-[#2a3142] hover:text-white h-7 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
            >
              {language === 'en' ? '🇬🇧' : '🇪🇸'}
              <span className="hidden sm:inline ml-1">{language === 'en' ? 'EN' : 'ES'}</span>
            </Button>

            {/* Currency Selector - Compact on mobile */}
            <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
              <SelectTrigger className="w-[70px] sm:w-[130px] h-7 sm:h-9 text-xs sm:text-sm border-[#2a3142] bg-[#1a1f2e] text-gray-300 hover:bg-[#2a3142]">
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
          </div>
        </div>
      </header>

      {/* Mobile-only Advisor Section */}
      {advisorProfile?.full_name && (
        <div className="md:hidden bg-[#1a1f2e] border-b border-[#2a3142] py-3 px-3">
          <div className="flex items-center gap-3">
            {advisorProfile.avatar_url ? (
              <img 
                src={advisorProfile.avatar_url} 
                alt={advisorProfile.full_name} 
                className="w-12 h-12 rounded-full object-cover border-2 border-[#2a3142]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#2a3142] flex items-center justify-center text-white font-medium text-lg">
                {advisorProfile.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-white">{advisorProfile.full_name}</p>
              <p className="text-xs text-[#CCFF00]">Wealth Advisor</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Read-only view */}
      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Client & Unit Information - Read only */}
        <ClientUnitInfo data={clientInfo} onEditClick={() => {}} readOnly={true} />

        {/* Two Column Layout: Payment Breakdown + Investment Snapshot */}
        {/* Mobile: Investment Snapshot first, Payment Breakdown second */}
        <div className="flex flex-col xl:grid xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="xl:col-span-1 order-1 xl:order-2">
            <InvestmentSnapshot 
              inputs={inputs}
              currency={currency}
              totalMonths={calculations.totalMonths}
              totalEntryCosts={calculations.totalEntryCosts}
              rate={rate}
              holdAnalysis={calculations.holdAnalysis}
            />
          </div>
          <div className="xl:col-span-2 order-2 xl:order-1">
            <PaymentBreakdown 
              inputs={inputs}
              currency={currency}
              totalMonths={calculations.totalMonths}
              rate={rate}
            />
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <OIGrowthCurve calculations={calculations} inputs={inputs} currency={currency} exitScenarios={exitScenarios} rate={rate} />

          <ExitScenariosCards 
            inputs={inputs}
            currency={currency}
            totalMonths={calculations.totalMonths}
            basePrice={calculations.basePrice}
            totalEntryCosts={calculations.totalEntryCosts}
            exitScenarios={exitScenarios}
            rate={rate}
            readOnly={true}
          />

          <OIYearlyProjectionTable projections={calculations.yearlyProjections} currency={currency} rate={rate} showAirbnbComparison={calculations.showAirbnbComparison} />
        </div>

        {/* Footer */}
        <footer className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-[#2a3142] text-center">
          <p className="text-xs text-gray-500">
            This cashflow statement is for informational purposes only and does not constitute financial advice.
          </p>
        </footer>
      </main>
    </div>
  );
};

const CashflowView = () => {
  return (
    <LanguageProvider>
      <CashflowViewContent />
    </LanguageProvider>
  );
};

export default CashflowView;