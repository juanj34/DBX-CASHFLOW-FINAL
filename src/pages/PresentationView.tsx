import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { 
  ChevronLeft, ChevronRight, FileText, GitCompare, User, Mail, MessageCircle, 
  Eye, Clock, Calendar, Download, Globe, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/AppLogo";
import { usePresentations, PresentationItem, Presentation } from "@/hooks/usePresentations";
import { useQuotesList, CashflowQuote } from "@/hooks/useCashflowQuote";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { PresentationPreview } from "@/components/presentation";
import { format } from "date-fns";
import { Currency } from "@/components/roi/currencyUtils";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ExportModal } from "@/components/roi/ExportModal";
import { useOICalculations, OIInputs } from "@/components/roi/useOICalculations";
import { useMortgageCalculations, DEFAULT_MORTGAGE_INPUTS, MortgageInputs } from "@/components/roi/useMortgageCalculations";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { calculateAutoExitScenarios } from "@/components/roi/ExitScenariosCards";

interface AdvisorProfile {
  full_name: string | null;
  avatar_url: string | null;
  business_email: string | null;
  whatsapp_number: string | null;
  whatsapp_country_code: string | null;
}

// Helper to get quote export data
interface QuoteExportData {
  inputs: OIInputs;
  mortgageInputs: MortgageInputs;
  clientInfo: ClientUnitData;
  exitScenarios: number[];
  quoteImages?: {
    heroImageUrl: string | null;
    floorPlanUrl: string | null;
    buildingRenderUrl?: string | null;
  };
}

const PresentationView = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { getPresentationByShareToken } = usePresentations();
  
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [advisorProfile, setAdvisorProfile] = useState<AdvisorProfile | null>(null);
  const [allQuotes, setAllQuotes] = useState<CashflowQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string>("");
  const [viewStartTime, setViewStartTime] = useState<number>(Date.now());
  
  // Global currency and language state
  const [currency, setCurrency] = useState<Currency>('AED');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const { rate } = useExchangeRate(currency);
  
  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportQuoteId, setExportQuoteId] = useState<string | null>(null);

  useDocumentTitle(presentation?.title || "Presentation");

  // Generate session ID on mount
  useEffect(() => {
    setSessionId(crypto.randomUUID());
    setViewStartTime(Date.now());
  }, []);

  // Fetch presentation and related data
  useEffect(() => {
    const fetchData = async () => {
      if (!shareToken) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      try {
        const pres = await getPresentationByShareToken(shareToken);
        
        if (!pres) {
          setError("Presentation not found or is not public");
          setLoading(false);
          return;
        }

        setPresentation(pres);

        // Fetch advisor profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, business_email, whatsapp_number, whatsapp_country_code')
          .eq('id', pres.broker_id)
          .single();

        if (profileData) {
          setAdvisorProfile(profileData);
        }

        // Collect all quote IDs from the presentation items
        const quoteIds = new Set<string>();
        for (const item of pres.items) {
          if (item.type === 'quote') {
            quoteIds.add(item.id);
          } else if (item.type === 'inline_comparison' && item.quoteIds) {
            item.quoteIds.forEach(id => quoteIds.add(id));
          } else if (item.type === 'comparison') {
            // Fetch comparison to get quote IDs
            const { data: comparison } = await supabase
              .from('saved_comparisons')
              .select('quote_ids')
              .eq('id', item.id)
              .single();
            if (comparison) {
              comparison.quote_ids.forEach((id: string) => quoteIds.add(id));
            }
          }
        }

        // Fetch all quotes using public view (protects sensitive client data)
        if (quoteIds.size > 0) {
          const { data: quotesData } = await supabase
            .from('cashflow_quotes_public')
            .select(`
              id, broker_id, share_token,
              project_name, developer, unit, unit_type, unit_size_sqf, unit_size_m2,
              inputs, title, created_at, updated_at, status, status_changed_at,
              presented_at, negotiation_started_at, sold_at, view_count, first_viewed_at,
              is_archived, archived_at, last_viewed_at
            `)
            .in('id', Array.from(quoteIds));

          if (quotesData) {
            // Cast inputs from Json to OIInputs
            const typedQuotes = quotesData.map(q => ({
              ...q,
              inputs: q.inputs as unknown as import('@/components/roi/useOICalculations').OIInputs,
              // These fields are no longer in public view, set to null
              client_name: null,
              client_country: null,
              client_email: null,
            })) as CashflowQuote[];
            setAllQuotes(typedQuotes);
          }
        }

        // Track the view
        await trackView(pres.id);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching presentation:', err);
        setError("Failed to load presentation");
        setLoading(false);
      }
    };

    fetchData();
  }, [shareToken, getPresentationByShareToken]);

  // Track view (increment view count)
  const trackView = async (presentationId: string) => {
    try {
      // Call the edge function to track the view
      await supabase.functions.invoke('track-presentation-view', {
        body: {
          presentationId,
          sessionId,
        },
      });
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  };

  // Track duration on unmount
  useEffect(() => {
    return () => {
      if (presentation && sessionId) {
        const duration = Math.floor((Date.now() - viewStartTime) / 1000);
        // Fire and forget - we don't wait for this
        supabase.functions.invoke('update-presentation-view-duration', {
          body: {
            presentationId: presentation.id,
            sessionId,
            durationSeconds: duration,
          },
        }).catch(console.error);
      }
    };
  }, [presentation, sessionId, viewStartTime]);

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

  const getQuoteTitle = (quoteId: string) => {
    const quote = allQuotes.find(q => q.id === quoteId);
    if (!quote) return "Quote";
    return quote.project_name || quote.client_name || "Quote";
  };

  // Get export data for a quote
  const getQuoteExportData = useCallback((quoteId: string): QuoteExportData | null => {
    const quote = allQuotes.find(q => q.id === quoteId);
    if (!quote) return null;

    const savedMortgage = (quote.inputs as unknown as { _mortgageInputs?: Partial<MortgageInputs> })?._mortgageInputs;
    const mortgageInputs: MortgageInputs = savedMortgage ? {
      ...DEFAULT_MORTGAGE_INPUTS,
      ...savedMortgage,
    } : DEFAULT_MORTGAGE_INPUTS;

    const inputsWithExtras = quote.inputs as unknown as { 
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
      _exitScenarios?: number[];
      heroImageUrl?: string;
      floorPlanUrl?: string;
      buildingRenderUrl?: string;
    };

    const savedClients = inputsWithExtras._clients;
    const savedClientInfo = inputsWithExtras._clientInfo;
    const clients = savedClients && savedClients.length > 0
      ? savedClients
      : quote.client_name 
        ? [{ id: '1', name: quote.client_name, country: quote.client_country || '' }]
        : [];

    const clientInfo: ClientUnitData = {
      developer: savedClientInfo?.developer || quote.developer || '',
      clients,
      brokerName: savedClientInfo?.brokerName || '',
      projectName: savedClientInfo?.projectName || quote.project_name || '',
      unit: savedClientInfo?.unit || quote.unit || '',
      unitSizeSqf: savedClientInfo?.unitSizeSqf || quote.unit_size_sqf || 0,
      unitSizeM2: savedClientInfo?.unitSizeM2 || quote.unit_size_m2 || 0,
      unitType: savedClientInfo?.unitType || quote.unit_type || '',
      splitEnabled: savedClientInfo?.splitEnabled || false,
      clientShares: savedClientInfo?.clientShares || [],
    };

    return {
      inputs: quote.inputs,
      mortgageInputs,
      clientInfo,
      exitScenarios: inputsWithExtras._exitScenarios || [],
      quoteImages: {
        heroImageUrl: inputsWithExtras.heroImageUrl || null,
        floorPlanUrl: inputsWithExtras.floorPlanUrl || null,
        buildingRenderUrl: inputsWithExtras.buildingRenderUrl || null,
      },
    };
  }, [allQuotes]);

  // Handle download for a single quote
  const handleDownloadQuote = (quoteId: string) => {
    setExportQuoteId(quoteId);
    setExportModalOpen(true);
  };

  // Group items for sidebar display - snapshot only (no cashflow)
  const quoteItems = presentation?.items.filter(item => item.type === 'quote') || [];
  const comparisonItems = presentation?.items.filter(item => item.type === 'comparison' || item.type === 'inline_comparison') || [];

  // Get current export quote data
  const exportQuoteData = useMemo(() => {
    if (!exportQuoteId) return null;
    return getQuoteExportData(exportQuoteId);
  }, [exportQuoteId, getQuoteExportData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent" />
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <FileText className="w-12 h-12 text-theme-text-muted mx-auto mb-4" />
          <h1 className="text-2xl text-theme-text mb-2">Presentation Not Found</h1>
          <p className="text-theme-text-muted">{error || 'This presentation may have been deleted or is not available.'}</p>
        </div>
      </div>
    );
  }

  const currentItem = presentation.items[selectedIndex];

  // Navigation sidebar item
  const NavItem = ({ item, index }: { item: PresentationItem; index: number }) => {
    const isSelected = index === selectedIndex;
    const isComparison = item.type === 'comparison' || item.type === 'inline_comparison';
    
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setSelectedIndex(index)}
          className={cn(
            "flex-1 flex items-center gap-2 p-2 rounded-lg transition-all text-left",
            isSelected
              ? isComparison
                ? "bg-purple-500/20 border border-purple-500/30"
                : "bg-theme-accent/20 border border-theme-accent/30"
              : "hover:bg-theme-bg/50 border border-transparent"
          )}
        >
          {isComparison ? (
            <GitCompare className="w-4 h-4 text-purple-400 flex-shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-theme-accent flex-shrink-0" />
          )}
          <span className="text-sm text-theme-text truncate">
            {item.title || (item.type === 'quote' ? getQuoteTitle(item.id) : "Comparison")}
          </span>
        </button>
        {/* Download button for quotes */}
        {item.type === 'quote' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-theme-text-muted hover:text-theme-accent shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadQuote(item.id);
            }}
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    );
  };

  const currencyOptions: Currency[] = ['AED', 'USD', 'EUR', 'GBP', 'COP'];

  return (
    <div className="min-h-screen bg-theme-bg flex">
      {/* Read-Only Sidebar */}
      <aside className="w-72 bg-theme-card border-r border-theme-border flex flex-col">
        {/* Logo */}
        <div className="h-14 border-b border-theme-border flex items-center px-4">
          <AppLogo size="md" linkTo={undefined} />
        </div>

        {/* Advisor Card */}
        {advisorProfile && (
          <div className="p-4 border-b border-theme-border">
            <div className="flex items-center gap-3 mb-3">
              {advisorProfile.avatar_url ? (
                <img 
                  src={advisorProfile.avatar_url} 
                  alt={advisorProfile.full_name || 'Advisor'} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-theme-accent/30" 
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-theme-bg flex items-center justify-center text-theme-text text-lg font-medium border-2 border-theme-accent/30">
                  {advisorProfile.full_name ? advisorProfile.full_name.charAt(0).toUpperCase() : <User className="w-5 h-5 text-theme-text-muted" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-theme-text truncate">{advisorProfile.full_name || 'Wealth Advisor'}</p>
                <p className="text-xs text-theme-accent">Wealth Advisor</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {advisorProfile.business_email && (
                <Button 
                  onClick={handleEmailAdvisor}
                  variant="outline" 
                  size="sm"
                  className="flex-1 border-theme-border bg-theme-bg text-theme-text hover:bg-theme-bg/80 text-xs"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  Email
                </Button>
              )}
              {advisorProfile.whatsapp_number && (
                <Button 
                  onClick={handleWhatsAppAdvisor}
                  variant="outline" 
                  size="sm"
                  className="flex-1 border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                  WhatsApp
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Presentation Info */}
        <div className="p-4 border-b border-theme-border">
          <h1 className="text-lg font-semibold text-theme-text mb-1">{presentation.title}</h1>
          {presentation.description && (
            <p className="text-sm text-theme-text-muted">{presentation.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-theme-text-muted">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {presentation.view_count} views
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(presentation.updated_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* Currency & Language Selectors */}
        <div className="p-4 border-b border-theme-border">
          <div className="flex items-center gap-2">
            {/* Currency Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-theme-border bg-theme-bg text-theme-text hover:bg-theme-bg/80"
                >
                  <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                  {currency}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-theme-card border-theme-border">
                {currencyOptions.map((c) => (
                  <DropdownMenuItem 
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={cn(
                      "text-theme-text hover:bg-theme-bg cursor-pointer",
                      currency === c && "bg-theme-accent/10 text-theme-accent"
                    )}
                  >
                    {c}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-theme-border bg-theme-bg text-theme-text hover:bg-theme-bg/80"
                >
                  <Globe className="w-3.5 h-3.5 mr-1.5" />
                  {language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-theme-card border-theme-border">
                <DropdownMenuItem 
                  onClick={() => setLanguage('en')}
                  className={cn(
                    "text-theme-text hover:bg-theme-bg cursor-pointer",
                    language === 'en' && "bg-theme-accent/10 text-theme-accent"
                  )}
                >
                  English
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage('es')}
                  className={cn(
                    "text-theme-text hover:bg-theme-bg cursor-pointer",
                    language === 'es' && "bg-theme-accent/10 text-theme-accent"
                  )}
                >
                  Español
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Properties - All Quotes (snapshot view only) */}
          {quoteItems.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-theme-text-muted font-semibold mb-2">
                Properties
              </p>
              <div className="space-y-1">
                {quoteItems.map((item) => {
                  const originalIndex = presentation.items.findIndex(i => i.type === item.type && i.id === item.id);
                  return <NavItem key={`nav-${item.id}`} item={item} index={originalIndex} />;
                })}
              </div>
            </div>
          )}

          {/* Comparisons */}
          {comparisonItems.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-purple-300 font-semibold mb-2">
                Comparisons
              </p>
              <div className="space-y-1">
                {comparisonItems.map((item) => {
                  const originalIndex = presentation.items.findIndex(i => i.type === item.type && i.id === item.id);
                  return <NavItem key={`nav-${item.id}`} item={item} index={originalIndex} />;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Export All Section */}
        {quoteItems.length > 0 && (
          <div className="p-4 border-t border-theme-border">
            <p className="text-xs uppercase tracking-wider text-theme-text-muted font-semibold mb-2">
              Downloads
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-theme-border bg-theme-bg text-theme-text hover:bg-theme-bg/80"
              onClick={async () => {
                // Export all quotes sequentially
                for (const item of quoteItems) {
                  handleDownloadQuote(item.id);
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              }}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export All ({quoteItems.length})
            </Button>
          </div>
        )}

        {/* Keyboard Nav Hint */}
        <div className="p-4 border-t border-theme-border">
          <p className="text-xs text-theme-text-muted text-center">
            Use ← → arrow keys to navigate
          </p>
        </div>
      </aside>

      {/* Main Content - Preview */}
      <main className="flex-1 overflow-auto">
        <LanguageProvider overrideLanguage={language}>
          <PresentationPreview
            items={presentation.items}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
            quotes={allQuotes}
            currency={currency}
            language={language}
            rate={rate}
          />
        </LanguageProvider>
      </main>

      {/* Keyboard Navigation */}
      <KeyboardNavigation 
        selectedIndex={selectedIndex}
        totalItems={presentation.items.length}
        onNavigate={setSelectedIndex}
      />

      {/* Export Modal */}
      {exportQuoteData && (
        <ExportQuoteModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          exportData={exportQuoteData}
          projectName={allQuotes.find(q => q.id === exportQuoteId)?.project_name || 'investment'}
          currency={currency}
          rate={rate}
          language={language}
        />
      )}
    </div>
  );
};

// Export modal wrapper that handles calculations
const ExportQuoteModal = ({ 
  open, 
  onOpenChange, 
  exportData,
  projectName,
  currency,
  rate,
  language,
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportData: QuoteExportData;
  projectName: string;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}) => {
  const calculations = useOICalculations(exportData.inputs);
  const mortgageAnalysis = useMortgageCalculations({
    mortgageInputs: exportData.mortgageInputs,
    basePrice: exportData.inputs.basePrice,
    preHandoverPercent: exportData.inputs.preHandoverPercent,
    monthlyRent: calculations?.holdAnalysis?.annualRent ? calculations.holdAnalysis.annualRent / 12 : 0,
    monthlyServiceCharges: calculations?.holdAnalysis?.annualServiceCharges ? calculations.holdAnalysis.annualServiceCharges / 12 : 0,
  });

  const exitScenarios = useMemo(() => {
    if (exportData.exitScenarios && exportData.exitScenarios.length > 0) {
      return exportData.exitScenarios;
    }
    if (!calculations) return [12, 24, 36];
    return calculateAutoExitScenarios(calculations.totalMonths);
  }, [exportData.exitScenarios, calculations]);

  if (!calculations) return null;

  return (
    <ExportModal
      open={open}
      onOpenChange={onOpenChange}
      projectName={projectName}
      activeView="snapshot"
      inputs={exportData.inputs}
      calculations={calculations}
      clientInfo={exportData.clientInfo}
      mortgageInputs={exportData.mortgageInputs}
      mortgageAnalysis={mortgageAnalysis}
      exitScenarios={exitScenarios}
      currency={currency}
      rate={rate}
      language={language}
      quoteImages={exportData.quoteImages}
    />
  );
};

// Keyboard navigation component
const KeyboardNavigation = ({ 
  selectedIndex, 
  totalItems, 
  onNavigate 
}: { 
  selectedIndex: number; 
  totalItems: number; 
  onNavigate: (index: number) => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate(Math.max(0, selectedIndex - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate(Math.min(totalItems - 1, selectedIndex + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, totalItems, onNavigate]);

  return null;
};

export default PresentationView;
