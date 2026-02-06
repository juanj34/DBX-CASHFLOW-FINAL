import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  User, Mail, Phone, MapPin, Globe, Languages, Building, FileText, 
  Presentation, BarChart3, Scale, ArrowLeft, Plus, ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useClients, Client } from "@/hooks/useClients";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useClientComparisons } from "@/hooks/useClientComparisons";
import { useNewQuote } from "@/hooks/useNewQuote";
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
import { PortfolioSection, PropertyWithProjections } from "@/components/portal/PortfolioSection";
import { OpportunitiesSection } from "@/components/portal/OpportunitiesSection";
import { PresentationsSection } from "@/components/portal/PresentationsSection";
import { ComparisonsSection } from "@/components/portal/ComparisonsSection";
import { CompareSection } from "@/components/portal/CompareSection";
import { SnapshotModal } from "@/components/portal/SnapshotModal";
import { ConvertToPropertyModal } from "@/components/portfolio/ConvertToPropertyModal";
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

const ClientPortfolioView = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { clients, loading: clientsLoading } = useClients();
  
  const { properties: portfolioProperties, loading: portfolioLoading, metrics: portfolioMetrics } = usePortfolio(clientId);
  const { savedComparisons, secondaryComparisons, totalComparisons, loading: comparisonsLoading } = useClientComparisons({ clientId });
  
  const [client, setClient] = useState<Client | null>(null);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [presentations, setPresentations] = useState<PresentationData[]>([]);
  const [loading, setLoading] = useState(true);

  // Currency and language state
  const [currency, setCurrency] = useState<Currency>('AED');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const { rate } = useExchangeRate(currency);

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportQuoteId, setExportQuoteId] = useState<string | null>(null);

  // Snapshot modal state
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [snapshotQuoteId, setSnapshotQuoteId] = useState<string | null>(null);

  // Compare state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Convert to property modal state
  const [convertingQuote, setConvertingQuote] = useState<QuoteData | null>(null);

  // Determine if user is an investor (has properties) or prospect (only quotes)
  const isInvestor = portfolioProperties.length > 0;
  const hasContent = quotes.length > 0 || presentations.length > 0 || isInvestor || totalComparisons > 0;

  // Default tab based on investor status
  const defaultTab = isInvestor ? "portfolio" : "opportunities";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Update active tab when investor status changes
  useEffect(() => {
    if (!loading && !portfolioLoading) {
      setActiveTab(isInvestor ? "portfolio" : "opportunities");
    }
  }, [isInvestor, loading, portfolioLoading]);

  useDocumentTitle(client?.name ? `${client.name} - Portfolio` : "Client Portfolio");

  // Find client from loaded clients
  useEffect(() => {
    if (!clientsLoading && clientId) {
      const found = clients.find(c => c.id === clientId);
      setClient(found || null);
    }
  }, [clients, clientId, clientsLoading]);

  // Fetch quotes and presentations for this client
  useEffect(() => {
    const fetchData = async () => {
      if (!clientId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch quotes for this client
        const { data: quotesData } = await supabase
          .from('cashflow_quotes')
          .select('id, project_name, developer, unit, unit_type, share_token, inputs, updated_at, client_name, client_country, unit_size_sqf')
          .eq('client_id', clientId)
          .or('is_archived.is.null,is_archived.eq.false')
          .order('updated_at', { ascending: false });

        if (quotesData) {
          setQuotes(quotesData);
        }

        // Fetch presentations for this client
        const { data: presentationsData } = await supabase
          .from('presentations')
          .select('id, title, description, share_token, items, updated_at')
          .eq('client_id', clientId)
          .order('updated_at', { ascending: false });

        if (presentationsData) {
          setPresentations(presentationsData as PresentationData[]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching client data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

  const handleDownloadQuote = (quoteId: string) => {
    setExportQuoteId(quoteId);
    setExportModalOpen(true);
  };

  const handleViewSnapshot = (quoteId: string) => {
    setSnapshotQuoteId(quoteId);
    setSnapshotModalOpen(true);
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

  const handleConvertToProperty = (quote: QuoteData) => {
    setConvertingQuote(quote);
  };

  const handleConversionSuccess = async () => {
    setConvertingQuote(null);
    // Refetch data
    if (clientId) {
      const { data: quotesData } = await supabase
        .from('cashflow_quotes')
        .select('id, project_name, developer, unit, unit_type, share_token, inputs, updated_at, client_name, client_country, unit_size_sqf')
        .eq('client_id', clientId)
        .or('is_archived.is.null,is_archived.eq.false')
        .order('updated_at', { ascending: false });
      if (quotesData) setQuotes(quotesData);
    }
  };

  const { startNewQuote } = useNewQuote();

  const handleCreateQuote = async () => {
    if (client) {
      // Use unified hook for consistent behavior across all entry points
      await startNewQuote({
        preselectedClient: {
          dbClientId: client.id,
          clientName: client.name,
          clientEmail: client.email || '',
          clientCountry: client.country || ''
        },
        openConfigurator: true,
        targetRoute: 'generator',
      });
    }
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

  const isLoadingAll = loading || portfolioLoading || clientsLoading || comparisonsLoading;

  if (isLoadingAll) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <User className="w-12 h-12 text-theme-text-muted mx-auto mb-4" />
          <h1 className="text-2xl text-theme-text mb-2">Client Not Found</h1>
          <p className="text-theme-text-muted mb-4">This client may have been deleted or you don't have access.</p>
          <Button onClick={() => navigate('/clients')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme-border sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/clients')}
              className="text-theme-text-muted hover:text-theme-text"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-theme-text">{client.name}</h1>
              <div className="flex items-center gap-3 text-sm text-theme-text-muted">
                {client.email && <span>{client.email}</span>}
                {client.country && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {client.country}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Create Quote Button */}
            <Button
              size="sm"
              onClick={handleCreateQuote}
              className="bg-theme-accent text-slate-900 hover:bg-theme-accent/90"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Quote
            </Button>

            {/* Preview Portal Button */}
            {client.portal_token && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/portal/${client.portal_token}`, '_blank')}
                className="border-theme-border bg-theme-bg text-theme-text hover:bg-theme-bg/80"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Preview Portal
              </Button>
            )}

            {/* Currency/Language selectors */}
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-theme-card border-theme-border">
            <CardContent className="p-4 text-center">
              <Building className="w-5 h-5 text-theme-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-theme-text">{portfolioProperties.length}</p>
              <p className="text-xs text-theme-text-muted">Properties</p>
            </CardContent>
          </Card>
          <Card className="bg-theme-card border-theme-border">
            <CardContent className="p-4 text-center">
              <FileText className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-cyan-400">{quotes.length}</p>
              <p className="text-xs text-theme-text-muted">Quotes</p>
            </CardContent>
          </Card>
          <Card className="bg-theme-card border-theme-border">
            <CardContent className="p-4 text-center">
              <Presentation className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-400">{presentations.length}</p>
              <p className="text-xs text-theme-text-muted">Presentations</p>
            </CardContent>
          </Card>
          <Card className="bg-theme-card border-theme-border">
            <CardContent className="p-4 text-center">
              <Scale className="w-5 h-5 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-400">{totalComparisons}</p>
              <p className="text-xs text-theme-text-muted">Comparisons</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-theme-card border border-theme-border p-1 h-auto flex-wrap">
            {isInvestor && (
              <TabsTrigger 
                value="portfolio" 
                className="data-[state=active]:bg-theme-accent data-[state=active]:text-slate-900 text-theme-text gap-2"
              >
                <Building className="w-4 h-4" />
                <span className="hidden sm:inline">Portfolio</span>
                <span className="sm:hidden">Props</span>
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="opportunities" 
              className="data-[state=active]:bg-theme-accent data-[state=active]:text-slate-900 text-theme-text gap-2"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Quotes</span>
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
            {totalComparisons > 0 && (
              <TabsTrigger 
                value="comparisons" 
                className="data-[state=active]:bg-theme-accent data-[state=active]:text-slate-900 text-theme-text gap-2"
              >
                <Scale className="w-4 h-4" />
                <span className="hidden sm:inline">Comparisons</span>
                <span className="sm:hidden">Compare</span>
                <span className="text-xs bg-theme-bg px-1.5 py-0.5 rounded-full">{totalComparisons}</span>
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
                properties={(() => {
                  // Enrich properties with projected rent from their linked quotes
                  return portfolioProperties.map(prop => {
                    // Find linked quote if exists
                    const linkedQuote = prop.source_quote_id 
                      ? quotes.find(q => q.id === prop.source_quote_id) 
                      : null;
                    
                    // Extract rental yield from quote inputs
                    const quoteInputs = linkedQuote?.inputs as any;
                    const rentalYieldPercent = quoteInputs?.rentalYieldPercent;
                    
                    // Calculate projected monthly rent
                    const projectedMonthlyRent = rentalYieldPercent 
                      ? (prop.purchase_price * (rentalYieldPercent / 100)) / 12
                      : undefined;
                    
                    return {
                      ...prop,
                      projectedMonthlyRent,
                      rentalYieldPercent,
                    } as PropertyWithProjections;
                  });
                })()}
                metrics={portfolioMetrics}
                currency={currency}
                rate={rate}
                onViewAnalysis={(quoteId) => navigate(`/cashflow/${quoteId}`)}
                defaultRentalYield={7} // Could come from broker profile
              />
            </TabsContent>
          )}

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="mt-6">
            <OpportunitiesSection 
              quotes={quotes}
              currency={currency}
              language={language}
              onDownload={handleDownloadQuote}
              onCompare={handleCompare}
              onConvertToProperty={handleConvertToProperty}
              isBrokerView={true}
            />
          </TabsContent>

          {/* Presentations Tab */}
          <TabsContent value="presentations" className="mt-6">
            <PresentationsSection presentations={presentations} />
          </TabsContent>

          {/* Comparisons Tab */}
          <TabsContent value="comparisons" className="mt-6">
            <ComparisonsSection 
              savedComparisons={savedComparisons}
              secondaryComparisons={secondaryComparisons}
              currency={currency}
              language={language}
            />
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
      </main>

      {/* Snapshot Modal */}
      <SnapshotModal
        quoteId={snapshotQuoteId}
        open={snapshotModalOpen}
        onOpenChange={setSnapshotModalOpen}
        currency={currency}
        language={language}
        rate={rate}
        onDownload={handleDownloadQuote}
      />

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

      {/* Convert to Property Modal */}
      <ConvertToPropertyModal
        open={!!convertingQuote}
        onOpenChange={(open) => !open && setConvertingQuote(null)}
        quote={convertingQuote ? {
          id: convertingQuote.id,
          project_name: convertingQuote.project_name,
          developer: convertingQuote.developer,
          unit: convertingQuote.unit,
          unit_type: convertingQuote.unit_type,
          inputs: {
            ...convertingQuote.inputs,
            unitSizeSqf: convertingQuote.unit_size_sqf || convertingQuote.inputs?.unitSizeSqf,
          },
          client_id: clientId,
        } : null}
        onSuccess={handleConversionSuccess}
      />
    </div>
  );
};

export default ClientPortfolioView;
