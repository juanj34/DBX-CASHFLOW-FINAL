import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LayoutGrid, Sparkles, BarChart3, User, Mail, MessageCircle, Home, Percent, Coins, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSavedComparisons, SavedComparison } from '@/hooks/useSavedComparisons';
import { useQuotesComparison, computeComparisonMetrics, QuoteWithCalculations, ComparisonQuote } from '@/hooks/useQuotesComparison';
import { useOICalculations } from '@/components/roi/useOICalculations';
import { useRecommendationEngine, InvestmentFocus } from '@/hooks/useRecommendationEngine';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { Currency, CURRENCY_CONFIG } from '@/components/roi/currencyUtils';
import { MetricsTable } from '@/components/roi/compare/MetricsTable';
import { MortgageComparison } from '@/components/roi/compare/MortgageComparison';
import { RentalYieldComparison } from '@/components/roi/compare/RentalYieldComparison';
import { ProfileSelector } from '@/components/roi/compare/ProfileSelector';
import { RecommendationBadge, ScoreDisplay } from '@/components/roi/compare/RecommendationBadge';
import { RecommendationSummary } from '@/components/roi/compare/RecommendationSummary';
import { CollapsibleSection } from '@/components/roi/CollapsibleSection';
import { CompareHeader } from '@/components/roi/compare/CompareHeader';
import { AppLogo } from '@/components/AppLogo';
import { supabase } from '@/integrations/supabase/client';

// Wrapper component to calculate for a single quote
const QuoteCalculator = ({ 
  quote, 
  onCalculated 
}: { 
  quote: any; 
  onCalculated: (calc: any) => void;
}) => {
  const calculations = useOICalculations(quote.inputs);
  
  useEffect(() => {
    if (calculations) {
      onCalculated(calculations);
    }
  }, [calculations]);

  return null;
};

interface AdvisorProfile {
  full_name: string | null;
  avatar_url: string | null;
  business_email: string | null;
  whatsapp_number: string | null;
  whatsapp_country_code: string | null;
}

const CompareView = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  useDocumentTitle("Compare Properties");
  const { t } = useLanguage();
  
  const [comparison, setComparison] = useState<SavedComparison | null>(null);
  const [advisorProfile, setAdvisorProfile] = useState<AdvisorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculationsMap, setCalculationsMap] = useState<Record<string, any>>({});
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState<InvestmentFocus | null>(null);
  const [currency, setCurrency] = useState<Currency>('AED');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [orderedQuoteIds, setOrderedQuoteIds] = useState<string[]>([]);
  
  const { rate } = useExchangeRate(currency);
  const { getComparisonByShareToken } = useSavedComparisons();

  // Fetch comparison by share token
  useEffect(() => {
    const fetchComparison = async () => {
      if (!shareToken) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      const data = await getComparisonByShareToken(shareToken);
      
      if (!data) {
        setError('Comparison not found or is not public');
        setLoading(false);
        return;
      }

      setComparison(data);
      setShowRecommendations(data.show_recommendations);
      setSelectedFocus(data.investment_focus as InvestmentFocus | null);

      // Fetch advisor profile
      const { data: quoteData } = await supabase
        .from('cashflow_quotes')
        .select('broker_id')
        .eq('id', data.quote_ids[0])
        .single();

      if (quoteData?.broker_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, business_email, whatsapp_number, whatsapp_country_code')
          .eq('id', quoteData.broker_id)
          .single();

        if (profileData) {
          setAdvisorProfile(profileData);
        }
      }

      setLoading(false);
    };

    fetchComparison();
  }, [shareToken]);

  // Sync ordered quote IDs when comparison loads
  useEffect(() => {
    if (comparison?.quote_ids) {
      setOrderedQuoteIds(comparison.quote_ids);
    }
  }, [comparison]);

  const { quotes, loading: quotesLoading } = useQuotesComparison(orderedQuoteIds.length > 0 ? orderedQuoteIds : (comparison?.quote_ids || []));

  const handleCalculated = (quoteId: string, calc: any) => {
    setCalculationsMap(prev => ({ ...prev, [quoteId]: calc }));
  };

  // Order quotes based on orderedQuoteIds
  const orderedQuotes: ComparisonQuote[] = useMemo(() => {
    return orderedQuoteIds
      .map(id => quotes.find(q => q.id === id))
      .filter((q): q is ComparisonQuote => q !== undefined);
  }, [quotes, orderedQuoteIds]);

  // Build quotes with calculations
  const quotesWithCalcs: QuoteWithCalculations[] = useMemo(() => {
    return orderedQuotes
      .filter(q => calculationsMap[q.id])
      .map(q => ({
        quote: q,
        calculations: calculationsMap[q.id],
      }));
  }, [orderedQuotes, calculationsMap]);

  const metrics = useMemo(() => {
    if (quotesWithCalcs.length < 2) return null;
    return computeComparisonMetrics(quotesWithCalcs);
  }, [quotesWithCalcs]);

  const allCalculated = orderedQuotes.length > 0 && orderedQuotes.every(q => calculationsMap[q.id]);

  // Recommendation engine
  const recommendations = useRecommendationEngine(quotesWithCalcs);

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

  if (loading || quotesLoading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent" />
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <LayoutGrid className="w-12 h-12 text-theme-text-muted mx-auto mb-4" />
          <h1 className="text-2xl text-theme-text mb-2">Comparison Not Found</h1>
          <p className="text-theme-text-muted">{error || 'This comparison may have been deleted or is not available.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Hidden calculators */}
      {quotes.map(quote => (
        <QuoteCalculator 
          key={quote.id}
          quote={quote}
          onCalculated={(calc) => handleCalculated(quote.id, calc)}
        />
      ))}

      <header className="border-b border-theme-border bg-theme-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AppLogo size="md" linkTo={undefined} />
            <div>
              <h1 className="text-xl font-bold text-theme-text flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-theme-accent" />
                {comparison.title}
              </h1>
              <p className="text-sm text-theme-text-muted">
                {quotes.length} properties compared
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Currency Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-3 text-theme-text hover:bg-theme-card">
                  <Coins className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">{CURRENCY_CONFIG[currency].flag}</span> {currency}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-theme-card border-theme-border z-50">
                {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                  <DropdownMenuItem 
                    key={key} 
                    onClick={() => setCurrency(key as Currency)}
                    className="text-theme-text hover:bg-theme-card-alt"
                  >
                    {currency === key && <Check className="w-3 h-3 mr-2 text-theme-accent" />}
                    {config.flag} {key} - {config.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-3 text-theme-text hover:bg-theme-card">
                  <Globe className="w-4 h-4 mr-1.5" />
                  {language === 'en' ? '🇬🇧 EN' : '🇪🇸 ES'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-theme-card border-theme-border z-50">
                <DropdownMenuItem 
                  onClick={() => setLanguage('en')}
                  className="text-theme-text hover:bg-theme-card-alt"
                >
                  {language === 'en' && <Check className="w-3 h-3 mr-2 text-theme-accent" />}
                  🇬🇧 English
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage('es')}
                  className="text-theme-text hover:bg-theme-card-alt"
                >
                  {language === 'es' && <Check className="w-3 h-3 mr-2 text-theme-accent" />}
                  🇪🇸 Español
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Recommendation Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-card border border-theme-border">
              <Sparkles className={`w-4 h-4 ${showRecommendations ? 'text-theme-accent' : 'text-theme-text-muted'}`} />
              <span className="text-sm text-theme-text-muted hidden sm:inline">AI Insights</span>
              <Switch
                checked={showRecommendations}
                onCheckedChange={setShowRecommendations}
                className="data-[state=checked]:bg-theme-accent"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Advisor Card */}
        {advisorProfile && (
          <div className="mb-6 p-4 bg-theme-card rounded-xl border border-theme-border">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                {advisorProfile.avatar_url ? (
                  <img 
                    src={advisorProfile.avatar_url} 
                    alt={advisorProfile.full_name || 'Advisor'} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-theme-accent/30" 
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-theme-card-alt flex items-center justify-center text-theme-text text-xl font-medium border-2 border-theme-accent/30">
                    {advisorProfile.full_name ? advisorProfile.full_name.charAt(0).toUpperCase() : <User className="w-6 h-6 text-theme-text-muted" />}
                  </div>
                )}
                <div>
                  <p className="text-lg font-medium text-theme-text">{advisorProfile.full_name || 'Wealth Advisor'}</p>
                  <p className="text-sm text-theme-accent">Wealth Advisor</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {advisorProfile.business_email && (
                  <Button 
                    onClick={handleEmailAdvisor}
                    variant="outline" 
                    size="sm"
                    className="border-theme-border bg-theme-bg text-theme-text hover:bg-theme-card-alt"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                )}
                {advisorProfile.whatsapp_number && (
                  <Button 
                    onClick={handleWhatsAppAdvisor}
                    variant="outline" 
                    size="sm"
                    className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {!allCalculated ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent mx-auto mb-4" />
              <p className="text-theme-text-muted">Calculating projections...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recommendation Engine Toggle Section */}
            {showRecommendations && recommendations && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#CCFF00]" />
                      What's your investment priority?
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Select a focus to see which option is best for you
                    </p>
                  </div>
                </div>
                <ProfileSelector selected={selectedFocus} onSelect={setSelectedFocus} />
                <RecommendationSummary result={recommendations} focus={selectedFocus} />
              </div>
            )}

            {/* Draggable Property Cards */}
            <CompareHeader 
              quotes={orderedQuotes} 
              onRemove={() => {}} 
              onReorder={setOrderedQuoteIds}
            />

            {/* Key Metrics Table */}
            {metrics && (
              <CollapsibleSection
                title="Key Metrics Comparison"
                icon={<BarChart3 className="w-4 h-4 text-theme-accent" />}
                defaultOpen={true}
              >
                <MetricsTable quotesWithCalcs={quotesWithCalcs} metrics={metrics} currency={currency} exchangeRate={rate} />
              </CollapsibleSection>
            )}

            {/* Mortgage Comparison */}
            {quotesWithCalcs.some(q => (q.quote.inputs as any)?._mortgageInputs?.enabled) && (
              <CollapsibleSection
                title="Mortgage Comparison"
                icon={<Home className="w-4 h-4 text-theme-accent" />}
                defaultOpen={true}
              >
                <MortgageComparison quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={rate} />
              </CollapsibleSection>
            )}

            {/* Rental Yield Comparison */}
            {quotesWithCalcs.some(q => 
              (q.quote.inputs.rentalYieldPercent || 0) > 0 || 
              (q.calculations.holdAnalysis?.netAnnualRent || 0) > 0
            ) && (
              <CollapsibleSection
                title="Rental Yield"
                icon={<Percent className="w-4 h-4 text-theme-accent" />}
                defaultOpen={true}
              >
                <RentalYieldComparison quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={rate} />
              </CollapsibleSection>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CompareView;
