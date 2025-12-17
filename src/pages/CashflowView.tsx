import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { OIGrowthCurve } from '@/components/roi/OIGrowthCurve';
import { OIYearlyProjectionTable } from '@/components/roi/OIYearlyProjectionTable';
import { PaymentBreakdown } from '@/components/roi/PaymentBreakdown';
import { ExitScenariosCards, calculateAutoExitScenarios } from '@/components/roi/ExitScenariosCards';
import { ClientUnitInfo, ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { useOICalculations, OIInputs } from '@/components/roi/useOICalculations';
import { Currency, CURRENCY_CONFIG } from '@/components/roi/currencyUtils';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';

const CashflowViewContent = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { language, setLanguage, t } = useLanguage();
  const [currency, setCurrency] = useState<Currency>('AED');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<OIInputs | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientUnitData | null>(null);
  const [advisorName, setAdvisorName] = useState<string>('');

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

      setInputs(data.inputs as unknown as OIInputs);
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
      setAdvisorName((data.profiles as any)?.full_name || '');
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
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00EAFF]/20 rounded-xl">
              <Rocket className="w-6 h-6 text-[#00EAFF]" />
            </div>
            <div>
            <h1 className="text-xl font-bold text-white">Cashflow Statement</h1>
              {advisorName && (
                <p className="text-sm text-gray-400">Prepared by {advisorName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
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
          </div>
        </div>
      </header>

      {/* Main Content - Read-only view */}
      <main className="container mx-auto px-6 py-8">
        {/* Client & Unit Information */}
        <ClientUnitInfo data={clientInfo} onEditClick={() => {}} />

        <div className="space-y-8">
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

          <PaymentBreakdown 
            inputs={inputs}
            currency={currency}
            totalMonths={calculations.totalMonths}
            rate={rate}
          />

          <OIYearlyProjectionTable projections={calculations.yearlyProjections} currency={currency} rate={rate} />
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-[#2a3142] text-center">
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
