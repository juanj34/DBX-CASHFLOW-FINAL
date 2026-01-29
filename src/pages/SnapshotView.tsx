import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOICalculations, OIInputs } from '@/components/roi/useOICalculations';
import { useMortgageCalculations, MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from '@/components/roi/useMortgageCalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { calculateAutoExitScenarios } from '@/components/roi/ExitScenariosCards';
import { CashflowSkeleton } from '@/components/roi/CashflowSkeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SnapshotContent, SnapshotViewSidebar } from '@/components/roi/snapshot';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { useExportRenderer } from '@/hooks/useExportRenderer';
import { downloadSnapshotPDF } from '@/lib/pdfGenerator';
import { toast } from '@/hooks/use-toast';

interface BrokerProfile {
  fullName: string | null;
  avatarUrl: string | null;
  businessEmail: string | null;
  whatsappNumber: string | null;
  whatsappCountryCode: string | null;
}

const SnapshotViewContent = () => {
  useDocumentTitle("Investment Snapshot");
  const { shareToken } = useParams<{ shareToken: string }>();
  const [searchParams] = useSearchParams();
  const { language: contextLanguage, setLanguage: setContextLanguage } = useLanguage();
  
  // Initialize currency and language from URL params or defaults
  const [currency, setCurrency] = useState<Currency>(() => {
    const urlCurrency = searchParams.get('currency');
    if (urlCurrency && ['AED', 'USD', 'EUR', 'GBP', 'COP'].includes(urlCurrency)) {
      return urlCurrency as Currency;
    }
    return 'AED';
  });
  
  const [language, setLanguageLocal] = useState<'en' | 'es'>(() => {
    const urlLang = searchParams.get('lang');
    return urlLang === 'es' ? 'es' : 'en';
  });
  
  // Sync language with context
  const setLanguage = useCallback((lang: 'en' | 'es') => {
    setLanguageLocal(lang);
    setContextLanguage(lang);
  }, [setContextLanguage]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<OIInputs | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientUnitData | null>(null);
  const [mortgageInputs, setMortgageInputs] = useState<MortgageInputs>(DEFAULT_MORTGAGE_INPUTS);
  const [quoteImages, setQuoteImages] = useState<{ heroImageUrl: string | null; floorPlanUrl: string | null }>({
    heroImageUrl: null,
    floorPlanUrl: null,
  });
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile>({
    fullName: null,
    avatarUrl: null,
    businessEmail: null,
    whatsappNumber: null,
    whatsappCountryCode: null,
  });
  const [quoteInfo, setQuoteInfo] = useState<{
    projectName: string | null;
    createdAt: string | null;
    viewCount: number;
  }>({
    projectName: null,
    createdAt: null,
    viewCount: 0,
  });
  
  // Export state
  const [exporting, setExporting] = useState(false);
  
  // View tracking refs
  const viewTrackedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const viewStartTime = useRef(Date.now());
  
  const { rate } = useExchangeRate(currency);
  
  const { exportSnapshot } = useExportRenderer({
    projectName: quoteInfo.projectName || undefined,
  });

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
          inputs, created_at, view_count,
          profiles:broker_id (full_name, avatar_url, business_email, whatsapp_number, whatsapp_country_code)
        `)
        .eq('share_token', shareToken)
        .single();

      if (fetchError || !data) {
        setError('Quote not found or has been deleted');
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
        splitEnabled: false,
        clientShares: [],
      });
      
      if (savedInputs._mortgageInputs) {
        setMortgageInputs(savedInputs._mortgageInputs);
      }
      
      // Set broker profile with contact info
      const profile = data.profiles as any;
      setBrokerProfile({
        fullName: profile?.full_name || null,
        avatarUrl: profile?.avatar_url || null,
        businessEmail: profile?.business_email || null,
        whatsappNumber: profile?.whatsapp_number || null,
        whatsappCountryCode: profile?.whatsapp_country_code || null,
      });
      
      // Set quote info
      setQuoteInfo({
        projectName: data.project_name || null,
        createdAt: data.created_at || null,
        viewCount: data.view_count || 0,
      });
      
      // Fetch images
      const { data: imagesData } = await supabase
        .from('cashflow_images')
        .select('image_type, image_url')
        .eq('quote_id', data.id);

      if (imagesData) {
        const heroImage = imagesData.find(img => img.image_type === 'hero_image');
        const floorPlan = imagesData.find(img => img.image_type === 'floor_plan');
        setQuoteImages({
          heroImageUrl: heroImage?.image_url || null,
          floorPlanUrl: floorPlan?.image_url || null,
        });
      }
      
      setLoading(false);
    };

    fetchQuote();
  }, [shareToken]);

  // Track view on first load
  useEffect(() => {
    if (!shareToken || viewTrackedRef.current) return;
    
    // Check if already tracked in this session
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

  const exitScenarios: number[] = useMemo(() => {
    const savedExitScenarios = (inputs as any)?._exitScenarios;
    const totalMonths = calculations?.totalMonths || 120;
    if (savedExitScenarios && Array.isArray(savedExitScenarios) && savedExitScenarios.length > 0) {
      return savedExitScenarios.map((m: number) => Math.min(Math.max(1, m), totalMonths));
    }
    return calculations ? calculateAutoExitScenarios(calculations.totalMonths) : [12, 24, 36];
  }, [inputs, calculations?.totalMonths]);

  // Export handlers
  const handleExportPDF = useCallback(async () => {
    if (!inputs || !calculations || !clientInfo || !mortgageInputs || !mortgageAnalysis) {
      toast({
        title: 'Cannot export',
        description: 'Export data not available',
        variant: 'destructive',
      });
      return;
    }

    setExporting(true);
    toast({
      title: 'Preparing PDF...',
      description: 'Generating your document.',
    });

    try {
      const result = await downloadSnapshotPDF({
        inputs,
        calculations,
        clientInfo,
        mortgageInputs,
        mortgageAnalysis,
        exitScenarios,
        currency,
        rate,
        language,
        projectName: quoteInfo.projectName || clientInfo.projectName,
      });

      if (result.success) {
        toast({
          title: 'Export complete',
          description: 'Your PDF has been downloaded.',
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      toast({
        title: 'Export failed',
        description: 'Failed to generate PDF.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  }, [inputs, calculations, clientInfo, mortgageInputs, mortgageAnalysis, exitScenarios, currency, rate, language, quoteInfo.projectName]);

  const handleExportPNG = useCallback(async () => {
    if (!inputs || !calculations || !clientInfo || !mortgageInputs || !mortgageAnalysis) {
      toast({
        title: 'Cannot export',
        description: 'Export data not available',
        variant: 'destructive',
      });
      return;
    }

    setExporting(true);
    toast({
      title: 'Preparing PNG...',
      description: 'Generating your image.',
    });

    try {
      const result = await exportSnapshot(
        {
          inputs,
          calculations,
          clientInfo,
          mortgageInputs,
          mortgageAnalysis,
          exitScenarios,
          currency,
          rate,
          language,
        },
        'png'
      );

      if (result.success) {
        toast({
          title: 'Export complete',
          description: 'Your PNG has been downloaded.',
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      console.error('PNG export error:', err);
      toast({
        title: 'Export failed',
        description: 'Failed to generate PNG.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  }, [inputs, calculations, clientInfo, mortgageInputs, mortgageAnalysis, exitScenarios, currency, rate, language, exportSnapshot]);

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
          <h1 className="text-2xl text-theme-text mb-2">Quote Not Found</h1>
          <p className="text-theme-text-muted">{error || 'This quote may have been deleted.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col lg:flex-row">
      {/* Sidebar */}
      <SnapshotViewSidebar
        brokerProfile={brokerProfile}
        quoteInfo={quoteInfo}
        currency={currency}
        setCurrency={setCurrency}
        language={language}
        setLanguage={setLanguage}
        onExportPDF={handleExportPDF}
        onExportPNG={handleExportPNG}
        exporting={exporting}
        hideViewCount={true}
      />
      
      {/* Main Content - add top padding on mobile for fixed header */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <SnapshotContent
          inputs={inputs}
          calculations={calculations}
          clientInfo={clientInfo}
          mortgageInputs={mortgageInputs}
          mortgageAnalysis={mortgageAnalysis}
          exitScenarios={exitScenarios}
          quoteImages={quoteImages}
          currency={currency}
          setCurrency={undefined} // Moved to sidebar
          language={language}
          setLanguage={undefined} // Moved to sidebar
          rate={rate}
        />
      </main>
    </div>
  );
};

// Wrap in LanguageProvider with default language from URL params
const SnapshotView = () => {
  // Get language from URL on initial render
  const urlParams = new URLSearchParams(window.location.search);
  const defaultLang = urlParams.get('lang') === 'es' ? 'es' : 'en';
  
  return (
    <LanguageProvider defaultLanguage={defaultLang}>
      <SnapshotViewContent />
    </LanguageProvider>
  );
};

export default SnapshotView;
