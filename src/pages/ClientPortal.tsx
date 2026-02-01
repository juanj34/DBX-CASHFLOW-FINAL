import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { User, Mail, MessageCircle, Globe, Languages, Building, FileText, Presentation, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLogo } from "@/components/AppLogo";
import { useClients, Client } from "@/hooks/useClients";
import { useClientPortfolio } from "@/hooks/usePortfolio";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Currency } from "@/components/roi/currencyUtils";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { ExportModal } from "@/components/roi/ExportModal";
import { useOICalculations, OIInputs } from "@/components/roi/useOICalculations";
import { useMortgageCalculations, DEFAULT_MORTGAGE_INPUTS, MortgageInputs } from "@/components/roi/useMortgageCalculations";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { migrateInputs } from "@/components/roi/inputMigration";
import { NEW_QUOTE_OI_INPUTS } from "@/components/roi/configurator/types";
import { PortfolioSection } from "@/components/portal/PortfolioSection";
import { OpportunitiesSection } from "@/components/portal/OpportunitiesSection";
import { PresentationsSection } from "@/components/portal/PresentationsSection";
import { CompareSection } from "@/components/portal/CompareSection";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuoteData {
  id: string;
  project_name: string | null;
  developer: string | null;
  unit: string | null;
  unit_type: string | null;
  share_token: string | null;
  inputs: any;
  updated_at: string;
  client_name?: string | null;
  client_country?: string | null;
  unit_size_sqf?: number | null;
}

interface PresentationData {
  id: string;
  title: string;
  description: string | null;
  share_token: string | null;
  items: any[];
  updated_at: string;
}

interface AdvisorProfile {
  full_name: string | null;
  avatar_url: string | null;
  business_email: string | null;
  whatsapp_number: string | null;
  whatsapp_country_code: string | null;
}

const ClientPortal = () => {
  const { portalToken } = useParams<{ portalToken: string }>();
  const { getClientByPortalToken } = useClients();
  const { properties: portfolioProperties, loading: portfolioLoading, metrics: portfolioMetrics } = useClientPortfolio(portalToken || '');
  
  const [client, setClient] = useState<Client | null>(null);
  const [advisor, setAdvisor] = useState<AdvisorProfile | null>(null);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [presentations, setPresentations] = useState<PresentationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Currency and language state
  const [currency, setCurrency] = useState<Currency>('AED');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const { rate } = useExchangeRate(currency);

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportQuoteId, setExportQuoteId] = useState<string | null>(null);

  // Compare state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Determine if user is an investor (has properties) or prospect (only quotes)
  const isInvestor = portfolioProperties.length > 0;
  const hasContent = quotes.length > 0 || presentations.length > 0 || isInvestor;

  // Default tab based on investor status
  const defaultTab = isInvestor ? "portfolio" : "opportunities";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Update active tab when investor status changes
  useEffect(() => {
    if (!loading && !portfolioLoading) {
      setActiveTab(isInvestor ? "portfolio" : "opportunities");
    }
  }, [isInvestor, loading, portfolioLoading]);

  useDocumentTitle(client?.name ? `${client.name} - Portal` : "Client Portal");

  useEffect(() => {
    const fetchData = async () => {
      if (!portalToken) {
        setError("Invalid portal link");
        setLoading(false);
        return;
      }

      try {
        const clientData = await getClientByPortalToken(portalToken);
        
        if (!clientData) {
          setError("Portal not found or access disabled");
          setLoading(false);
          return;
        }

        setClient(clientData);

        // Fetch advisor profile
        const { data: advisorData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, business_email, whatsapp_number, whatsapp_country_code')
          .eq('id', clientData.broker_id)
          .single();

        if (advisorData) {
          setAdvisor(advisorData);
        }

        // Fetch quotes for this client
        const { data: quotesData } = await supabase
          .from('cashflow_quotes')
          .select('id, project_name, developer, unit, unit_type, share_token, inputs, updated_at, client_name, client_country, unit_size_sqf')
          .eq('client_id', clientData.id)
          .order('updated_at', { ascending: false });

        if (quotesData) {
          setQuotes(quotesData);
        }

        // Fetch presentations for this client
        const { data: presentationsData } = await supabase
          .from('presentations')
          .select('id, title, description, share_token, items, updated_at')
          .eq('client_id', clientData.id)
          .order('updated_at', { ascending: false });

        if (presentationsData) {
          setPresentations(presentationsData as PresentationData[]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching portal data:', err);
        setError("Failed to load portal");
        setLoading(false);
      }
    };

    fetchData();
  }, [portalToken, getClientByPortalToken]);

  const handleEmailAdvisor = () => {
    if (advisor?.business_email) {
      window.open(`mailto:${advisor.business_email}`, '_blank');
    }
  };

  const handleWhatsAppAdvisor = () => {
    if (advisor?.whatsapp_number) {
      const number = `${advisor.whatsapp_country_code || '+971'}${advisor.whatsapp_number}`.replace(/\D/g, '');
      window.open(`https://wa.me/${number}`, '_blank');
    }
  };

  const handleDownloadQuote = (quoteId: string) => {
    setExportQuoteId(quoteId);
    setExportModalOpen(true);
  };

  const handleCompare = (quoteIds: string[]) => {
    setCompareIds(quoteIds);
    setShowCompare(true);
    setActiveTab("compare");
  };

  const handleBackFromCompare = () => {
    setShowCompare(false);
    setActiveTab("opportunities");
  };

  const currencyOptions: { value: Currency; label: string }[] = [
    { value: 'AED', label: 'AED' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
  ];

  // Export preparation
  const exportQuote = quotes.find(q => q.id === exportQuoteId);
  
  const exportInputs: OIInputs | null = useMemo(() => {
    if (!exportQuote?.inputs) return null;
    return migrateInputs(exportQuote.inputs);
  }, [exportQuote?.inputs]);
  
  const exportCalculations = useOICalculations(exportInputs || NEW_QUOTE_OI_INPUTS);
  
  const exportClientInfo: ClientUnitData = useMemo(() => {
    if (!exportQuote) return { developer: '', projectName: '', clients: [], brokerName: '', unit: '', unitSizeSqf: 0, unitSizeM2: 0, unitType: '' };
    return {
      developer: exportQuote.developer || '',
      projectName: exportQuote.project_name || '',
      clients: exportQuote.client_name ? [{ id: '1', name: exportQuote.client_name, country: exportQuote.client_country || '' }] : [],
      brokerName: '',
      unit: exportQuote.unit || '',
      unitSizeSqf: exportQuote.unit_size_sqf || 0,
      unitSizeM2: Math.round((exportQuote.unit_size_sqf || 0) * 0.0929),
      unitType: exportQuote.unit_type || '',
    };
  }, [exportQuote]);
  
  const exportMortgageInputs: MortgageInputs = useMemo(() => {
    if (!exportInputs) return DEFAULT_MORTGAGE_INPUTS;
    return (exportInputs as any).mortgageInputs || DEFAULT_MORTGAGE_INPUTS;
  }, [exportInputs]);
  
  const exportMortgageAnalysis = useMortgageCalculations({
    mortgageInputs: exportMortgageInputs,
    basePrice: exportCalculations.basePrice,
    preHandoverPercent: exportInputs?.preHandoverPercent || 100,
    monthlyRent: exportCalculations.holdAnalysis?.annualRent ? exportCalculations.holdAnalysis.annualRent / 12 : 0,
    monthlyServiceCharges: exportCalculations.holdAnalysis?.annualServiceCharges ? exportCalculations.holdAnalysis.annualServiceCharges / 12 : 0,
  });
  
  const exportExitScenarios: number[] = useMemo(() => {
    if (!exportInputs) return [];
    return ((exportInputs as any).exitScenarios || []).map((e: any) => typeof e === 'number' ? e : e.months);
  }, [exportInputs]);
  
  const exportQuoteImages = useMemo(() => {
    if (!exportInputs) return undefined;
    const inputs = exportInputs as any;
    return {
      heroImageUrl: inputs.heroImageUrl || null,
      floorPlanUrl: inputs.floorPlanUrl || null,
      buildingRenderUrl: inputs.buildingRenderUrl || null,
    };
  }, [exportInputs]);

  if (loading || portfolioLoading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <User className="w-12 h-12 text-theme-text-muted mx-auto mb-4" />
          <h1 className="text-2xl text-theme-text mb-2">Portal Not Available</h1>
          <p className="text-theme-text-muted">{error || 'This portal may have been disabled or the link is invalid.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <AppLogo size="md" />
          
          {/* Currency/Language selectors */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-theme-border bg-theme-bg text-theme-text hover:bg-theme-bg/80">
                  <Globe className="w-3.5 h-3.5 mr-1.5" />
                  {currency}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-theme-card border-theme-border z-50">
                {currencyOptions.map(opt => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setCurrency(opt.value)}
                    className={currency === opt.value ? 'bg-theme-accent/20 text-theme-accent' : 'text-theme-text'}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-theme-border bg-theme-bg text-theme-text hover:bg-theme-bg/80">
                  <Languages className="w-3.5 h-3.5 mr-1.5" />
                  {language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-theme-card border-theme-border z-50">
                <DropdownMenuItem
                  onClick={() => setLanguage('en')}
                  className={language === 'en' ? 'bg-theme-accent/20 text-theme-accent' : 'text-theme-text'}
                >
                  English
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage('es')}
                  className={language === 'es' ? 'bg-theme-accent/20 text-theme-accent' : 'text-theme-text'}
                >
                  Español
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-theme-text mb-1">
            Welcome{isInvestor ? ' back' : ''}, {client.name}
          </h1>
          <p className="text-theme-text-muted">
            {isInvestor 
              ? "Track your investment performance and explore new opportunities"
              : "Explore your personalized investment opportunities"
            }
          </p>
        </div>

        {/* Advisor Card */}
        {advisor && (
          <Card className="bg-theme-card border-theme-border mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {advisor.avatar_url ? (
                  <img 
                    src={advisor.avatar_url} 
                    alt={advisor.full_name || 'Advisor'} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-theme-accent/30" 
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-theme-bg flex items-center justify-center text-xl font-medium text-theme-text border-2 border-theme-accent/30">
                    {advisor.full_name ? advisor.full_name.charAt(0).toUpperCase() : <User className="w-6 h-6 text-theme-text-muted" />}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-theme-text">{advisor.full_name || 'Your Advisor'}</p>
                  <p className="text-sm text-theme-accent">Wealth Advisor</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {advisor.business_email && (
                    <Button 
                      onClick={handleEmailAdvisor}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-initial border-theme-border bg-theme-bg text-theme-text hover:bg-theme-bg/80"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  )}
                  {advisor.whatsapp_number && (
                    <Button 
                      onClick={handleWhatsAppAdvisor}
                      size="sm"
                      className="flex-1 sm:flex-initial bg-green-500 text-white hover:bg-green-600"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State - No content at all */}
        {!hasContent && <PortalEmptyState type="all" />}

        {/* Main Content with Tabs */}
        {hasContent && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-theme-card border border-theme-border p-1 h-auto flex-wrap">
              {isInvestor && (
                <TabsTrigger 
                  value="portfolio" 
                  className="data-[state=active]:bg-theme-accent data-[state=active]:text-slate-900 text-theme-text gap-2"
                >
                  <Building className="w-4 h-4" />
                  <span className="hidden sm:inline">My Portfolio</span>
                  <span className="sm:hidden">Portfolio</span>
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="opportunities" 
                className="data-[state=active]:bg-theme-accent data-[state=active]:text-slate-900 text-theme-text gap-2"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">{isInvestor ? 'New Opportunities' : 'Opportunities'}</span>
                <span className="sm:hidden">Quotes</span>
                {quotes.length > 0 && (
                  <span className="text-xs bg-theme-bg px-1.5 py-0.5 rounded-full">{quotes.length}</span>
                )}
              </TabsTrigger>
              {presentations.length > 0 && (
                <TabsTrigger 
                  value="presentations" 
                  className="data-[state=active]:bg-theme-accent data-[state=active]:text-slate-900 text-theme-text gap-2"
                >
                  <Presentation className="w-4 h-4" />
                  <span className="hidden sm:inline">Presentations</span>
                  <span className="sm:hidden">Decks</span>
                  <span className="text-xs bg-theme-bg px-1.5 py-0.5 rounded-full">{presentations.length}</span>
                </TabsTrigger>
              )}
              {showCompare && (
                <TabsTrigger 
                  value="compare" 
                  className="data-[state=active]:bg-theme-accent data-[state=active]:text-slate-900 text-theme-text gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Compare
                </TabsTrigger>
              )}
            </TabsList>

            {/* Portfolio Tab */}
            {isInvestor && (
              <TabsContent value="portfolio" className="mt-6">
                <PortfolioSection 
                  properties={portfolioProperties}
                  metrics={portfolioMetrics}
                  currency={currency}
                  rate={rate}
                />
              </TabsContent>
            )}

            {/* Opportunities Tab */}
            <TabsContent value="opportunities" className="mt-6">
              {!isInvestor && portfolioProperties.length === 0 && (
                <div className="mb-6">
                  <PortalEmptyState type="portfolio" />
                </div>
              )}
              <OpportunitiesSection 
                quotes={quotes}
                currency={currency}
                language={language}
                onDownload={handleDownloadQuote}
                onCompare={handleCompare}
              />
            </TabsContent>

            {/* Presentations Tab */}
            <TabsContent value="presentations" className="mt-6">
              <PresentationsSection presentations={presentations} />
            </TabsContent>

            {/* Compare Tab */}
            {showCompare && (
              <TabsContent value="compare" className="mt-6">
                <CompareSection 
                  quotes={quotes}
                  selectedIds={compareIds}
                  currency={currency}
                  rate={rate}
                  onBack={handleBackFromCompare}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>

      {/* Export Modal */}
      {exportQuote && exportInputs && (
        <ExportModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          inputs={exportInputs}
          calculations={exportCalculations}
          clientInfo={exportClientInfo}
          mortgageInputs={exportMortgageInputs}
          mortgageAnalysis={exportMortgageAnalysis}
          exitScenarios={exportExitScenarios}
          projectName={exportQuote.project_name || 'Investment Property'}
          currency={currency}
          language={language}
          rate={rate}
          quoteImages={exportQuoteImages}
        />
      )}
    </div>
  );
};

export default ClientPortal;
