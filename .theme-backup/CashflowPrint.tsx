import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useOICalculations, OIInputs } from '@/components/roi/useOICalculations';
import { useMortgageCalculations, MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from '@/components/roi/useMortgageCalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { calculateAutoExitScenarios } from '@/components/roi/ExitScenariosCards';
import { CashflowPrintContent } from '@/components/roi/cashflow/CashflowPrintContent';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

const CashflowPrintInner = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [currency, setCurrency] = useState<Currency>('AED');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<OIInputs | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientUnitData | null>(null);
  const [mortgageInputs, setMortgageInputs] = useState<MortgageInputs>(DEFAULT_MORTGAGE_INPUTS);
  const [quoteImages, setQuoteImages] = useState<{ heroImageUrl: string | null; floorPlanUrl: string | null; buildingRenderUrl?: string | null }>({
    heroImageUrl: null,
    floorPlanUrl: null,
    buildingRenderUrl: null,
  });
  // Theme is now single blue/white — no need to force a specific theme

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
          id, broker_id, share_token, client_name, client_country, client_email,
          project_name, developer, unit, unit_type, unit_size_sqf, unit_size_m2,
          inputs,
          profiles:broker_id (full_name, avatar_url)
        `)
        .eq('share_token', shareToken)
        .single();

      if (fetchError || !data) {
        setError('Quote not found');
        setLoading(false);
        return;
      }

      const savedInputs = data.inputs as unknown as Partial<OIInputs> & {
        _clients?: Array<{ id: string; name: string; country: string }>;
        _clientInfo?: any;
        _mortgageInputs?: MortgageInputs;
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
      
      if (savedInputs._mortgageInputs) {
        setMortgageInputs(savedInputs._mortgageInputs);
      }
      
      // Fetch images
      const { data: imagesData } = await supabase
        .from('cashflow_images')
        .select('image_type, image_url')
        .eq('quote_id', data.id);

      if (imagesData) {
        const heroImage = imagesData.find(img => img.image_type === 'hero_image');
        const floorPlan = imagesData.find(img => img.image_type === 'floor_plan');
        const buildingRender = imagesData.find(img => img.image_type === 'building_render');
        setQuoteImages({
          heroImageUrl: heroImage?.image_url || null,
          floorPlanUrl: floorPlan?.image_url || null,
          buildingRenderUrl: buildingRender?.image_url || null,
        });
      }
      
      setLoading(false);
    };

    fetchQuote();
  }, [shareToken]);

  const calculations = inputs ? useOICalculations(inputs) : null;
  const mortgageAnalysis = useMortgageCalculations({
    mortgageInputs,
    basePrice: calculations?.basePrice || 0,
    preHandoverPercent: inputs?.preHandoverPercent || 20,
    monthlyRent: calculations?.holdAnalysis?.annualRent ? calculations.holdAnalysis.annualRent / 12 : 0,
    monthlyServiceCharges: calculations?.holdAnalysis?.annualServiceCharges ? calculations.holdAnalysis.annualServiceCharges / 12 : 0,
  });

  const exitScenarios: number[] = useMemo(() => {
    const savedExitScenarios = (inputs as any)?._exitScenarios;
    const totalMonths = calculations?.totalMonths || 120;
    if (savedExitScenarios && Array.isArray(savedExitScenarios) && savedExitScenarios.length > 0) {
      return savedExitScenarios.map((m: number) => Math.min(Math.max(1, m), totalMonths));
    }
    return calculations ? calculateAutoExitScenarios(calculations.totalMonths) : [12, 24, 36];
  }, [inputs, calculations?.totalMonths]);

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-theme-text">Loading...</div>
      </div>
    );
  }

  if (error || !inputs || !clientInfo || !calculations) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-red-400">{error || 'Failed to load quote'}</div>
      </div>
    );
  }

  return (
    <CashflowPrintContent
      inputs={inputs}
      calculations={calculations}
      clientInfo={clientInfo}
      mortgageInputs={mortgageInputs}
      mortgageAnalysis={mortgageAnalysis}
      exitScenarios={exitScenarios}
      quoteImages={quoteImages}
      currency={currency}
      rate={rate}
      language="en"
    />
  );
};

// Wrap with providers for standalone page
const CashflowPrint = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <CashflowPrintInner />
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default CashflowPrint;
