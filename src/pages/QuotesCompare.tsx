import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, LayoutGrid, Sparkles, BarChart3, TrendingUp, Gem, DoorOpen, Save, FolderOpen, X, Home, Percent, Pencil, GripVertical, ChevronDown, ChevronUp, Coins, Wallet, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useQuotesComparison, computeComparisonMetrics, QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { useOICalculations } from '@/components/roi/useOICalculations';
import { useRecommendationEngine, InvestmentFocus } from '@/hooks/useRecommendationEngine';
import { useSavedComparisons, SavedComparison } from '@/hooks/useSavedComparisons';
import { Currency, CURRENCY_CONFIG } from '@/components/roi/currencyUtils';
import { QuoteSelector } from '@/components/roi/compare/QuoteSelector';
import { CompareHeader } from '@/components/roi/compare/CompareHeader';
import { MetricsTable } from '@/components/roi/compare/MetricsTable';
import { PaymentComparison } from '@/components/roi/compare/PaymentComparison';
import { GrowthComparisonChart } from '@/components/roi/compare/GrowthComparisonChart';
import { ExitComparison } from '@/components/roi/compare/ExitComparison';
import { MortgageComparison } from '@/components/roi/compare/MortgageComparison';
import { RentalYieldComparison } from '@/components/roi/compare/RentalYieldComparison';
import { CashflowKPIComparison } from '@/components/roi/compare/CashflowKPIComparison';
import { DifferentiatorsComparison } from '@/components/roi/compare/DifferentiatorsComparison';
import { ProfileSelector } from '@/components/roi/compare/ProfileSelector';
import { RecommendationBadge, ScoreDisplay } from '@/components/roi/compare/RecommendationBadge';
import { RecommendationSummary } from '@/components/roi/compare/RecommendationSummary';
import { CollapsibleSection } from '@/components/roi/CollapsibleSection';
import { SaveComparisonModal } from '@/components/roi/compare/SaveComparisonModal';
import { LoadComparisonModal } from '@/components/roi/compare/LoadComparisonModal';
import { ShareComparisonButton } from '@/components/roi/compare/ShareComparisonButton';
import { ExportComparisonButton } from '@/components/roi/compare/ExportComparisonButton';
import { PageHeader, defaultShortcuts } from '@/components/layout/PageHeader';

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

const QuotesCompare = () => {
  useDocumentTitle("Compare Quotes");
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const ids = searchParams.get('ids');
    return ids ? ids.split(',').filter(Boolean) : [];
  });
  const [showSelector, setShowSelector] = useState(selectedIds.length < 2);
  const [calculationsMap, setCalculationsMap] = useState<Record<string, any>>({});
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState<InvestmentFocus | null>(null);
  
  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Expand/Collapse all state
  const [allExpanded, setAllExpanded] = useState(false);
  
  // Save/Load state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [currentComparisonId, setCurrentComparisonId] = useState<string | null>(null);
  const [currentComparisonTitle, setCurrentComparisonTitle] = useState<string>('');
  const [currentShareToken, setCurrentShareToken] = useState<string | null>(null);
  
  // Currency state
  const [currency, setCurrency] = useState<Currency>('AED');
  const exchangeRate = useExchangeRate(currency);

  const { quotes, loading, error } = useQuotesComparison(selectedIds);
  const { comparisons } = useSavedComparisons();

  // Update URL when selection changes
  useEffect(() => {
    if (selectedIds.length > 0) {
      setSearchParams({ ids: selectedIds.join(',') });
    } else {
      setSearchParams({});
    }
  }, [selectedIds]);

  const handleRemoveQuote = (id: string) => {
    setSelectedIds(prev => prev.filter(qId => qId !== id));
  };

  const handleCalculated = (quoteId: string, calc: any) => {
    setCalculationsMap(prev => ({ ...prev, [quoteId]: calc }));
  };

  // Drag handlers for reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    
    const newIds = [...selectedIds];
    const [draggedId] = newIds.splice(draggedIndex, 1);
    newIds.splice(dropIndex, 0, draggedId);
    setSelectedIds(newIds);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Build quotes with calculations
  const quotesWithCalcs: QuoteWithCalculations[] = useMemo(() => {
    return quotes
      .filter(q => calculationsMap[q.id])
      .map(q => ({
        quote: q,
        calculations: calculationsMap[q.id],
      }));
  }, [quotes, calculationsMap]);

  const metrics = useMemo(() => {
    if (quotesWithCalcs.length < 2) return null;
    return computeComparisonMetrics(quotesWithCalcs);
  }, [quotesWithCalcs]);

  const allCalculated = quotes.length > 0 && quotes.every(q => calculationsMap[q.id]);

  // Recommendation engine
  const recommendations = useRecommendationEngine(quotesWithCalcs);

  // Load comparison handler
  const handleLoadComparison = (comparison: SavedComparison) => {
    setSelectedIds(comparison.quote_ids);
    setShowRecommendations(comparison.show_recommendations);
    setSelectedFocus(comparison.investment_focus as InvestmentFocus | null);
    setCurrentComparisonId(comparison.id);
    setCurrentComparisonTitle(comparison.title);
    setCurrentShareToken(comparison.share_token);
  };

  const shortcuts = defaultShortcuts.map(s => ({
    ...s,
    active: s.href === '/compare'
  }));

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

      <PageHeader
        title={currentComparisonTitle || 'Compare Quotes'}
        subtitle={`${selectedIds.length} quotes selected`}
        icon={<LayoutGrid className="w-5 h-5" />}
        backLink="/my-quotes"
        shortcuts={shortcuts}
        actions={
          <div className="flex items-center gap-2">
            {/* Save Button */}
            <Button
              onClick={() => setShowSaveModal(true)}
              variant="outline"
              className="border-theme-border text-theme-text-muted hover:bg-theme-card-alt gap-2"
              disabled={selectedIds.length < 2}
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
            
            {/* Load Button */}
            <Button
              onClick={() => setShowLoadModal(true)}
              variant="outline"
              className="border-theme-border text-theme-text-muted hover:bg-theme-card-alt gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Load</span>
            </Button>

            {/* Export PDF */}
            <ExportComparisonButton 
              quotesWithCalcs={quotesWithCalcs}
              title={currentComparisonTitle || 'Property Comparison'}
              disabled={!allCalculated}
            />

            {/* Share Button */}
            <ShareComparisonButton 
              comparisonId={currentComparisonId || undefined}
              shareToken={currentShareToken}
              title={currentComparisonTitle || 'Property Comparison'}
            />

            {/* Recommendation Toggle */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-card border border-theme-border">
              <Sparkles className={`w-4 h-4 ${showRecommendations ? 'text-theme-accent' : 'text-theme-text-muted'}`} />
              <span className="text-sm text-theme-text-muted hidden md:inline">AI</span>
              <Switch
                checked={showRecommendations}
                onCheckedChange={setShowRecommendations}
                className="data-[state=checked]:bg-theme-accent"
              />
            </div>

            {/* Currency Selector */}
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger className="w-[90px] h-9 border-theme-border bg-theme-card text-theme-text text-sm">
                <Coins className="w-3.5 h-3.5 mr-1 text-theme-accent" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border">
                {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key} className="text-theme-text hover:bg-theme-card-alt focus:bg-theme-card-alt">
                    {config.flag} {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Expand/Collapse All */}
            <Button
              onClick={() => setAllExpanded(!allExpanded)}
              variant="outline"
              className="border-theme-border text-theme-text-muted hover:bg-theme-card-alt gap-2"
              title={allExpanded ? 'Collapse All' : 'Expand All'}
            >
              {allExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="hidden sm:inline">{allExpanded ? 'Collapse' : 'Expand'}</span>
            </Button>

            <Button 
              onClick={() => setShowSelector(true)}
              variant="outline"
              className="border-theme-border text-theme-text-muted hover:bg-theme-card-alt hover:text-theme-text gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        }
      />

      <main className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive">{error}</p>
            <Button 
              onClick={() => setShowSelector(true)}
              className="mt-4 bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
            >
              Select Quotes
            </Button>
          </div>
        ) : selectedIds.length < 2 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-card flex items-center justify-center">
              <LayoutGrid className="w-8 h-8 text-theme-text-muted" />
            </div>
            <h2 className="text-xl text-theme-text mb-2">Select quotes to compare</h2>
            <p className="text-theme-text-muted mb-6">Choose 2-4 quotes to see them side by side</p>
            <div className="flex items-center justify-center gap-3">
              <Button 
                onClick={() => setShowSelector(true)}
                className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
              >
                Select Quotes
              </Button>
              {comparisons.length > 0 && (
                <Button
                  onClick={() => setShowLoadModal(true)}
                  variant="outline"
                  className="border-theme-border text-theme-text-muted hover:bg-theme-card-alt"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Load Saved
                </Button>
              )}
            </div>
          </div>
        ) : !allCalculated ? (
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

            {/* Property Cards with Recommendation Badges */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${quotes.length}, minmax(200px, 1fr))` }}>
              {quotes.map((quote, index) => {
                const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500'];
                const color = colors[index % colors.length];
                const recommendation = recommendations?.recommendations.find(r => r.quoteId === quote.id);

                return (
                  <div
                    key={quote.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={`bg-[#1a1f2e] border border-[#2a3142] rounded-xl p-4 pl-8 relative cursor-grab active:cursor-grabbing transition-all ${
                      dragOverIndex === index ? 'ring-2 ring-[#CCFF00] scale-[1.02]' : ''
                    } ${draggedIndex === index ? 'opacity-50' : ''}`}
                    style={{ borderTopColor: color, borderTopWidth: '3px' }}
                  >
                    {/* Drag handle */}
                    <div className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-600">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => navigate(`/cashflow/${quote.id}`)}
                      className="absolute top-2 right-9 p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-[#CCFF00] transition-colors"
                      title="Edit this quote"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveQuote(quote.id)}
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Recommendation Badge */}
                    {showRecommendations && recommendation && (
                      <div className="mb-3">
                        <RecommendationBadge 
                          recommendation={recommendation} 
                          focus={selectedFocus} 
                          color={color}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div>
                        <h3 className="font-semibold text-white truncate">
                          {quote.title || 'Untitled Quote'}
                        </h3>
                        {quote.developer && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            by {quote.developer}
                          </p>
                        )}
                      </div>
                      
                      {/* Unit Info */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                        {quote.unit && (
                          <span>Unit: {quote.unit}</span>
                        )}
                        {quote.unitSizeSqf && (
                          <span>{quote.unitSizeSqf.toLocaleString()} sqft</span>
                        )}
                        {quote.unitType && (
                          <span>{quote.unitType}</span>
                        )}
                      </div>
                    </div>

                    {/* Score Display when recommendations enabled */}
                    {showRecommendations && recommendation && (
                      <ScoreDisplay scores={recommendation.scores} focus={selectedFocus} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Key Metrics Table */}
            {metrics && (
              <CollapsibleSection
                title="Key Metrics Comparison"
                icon={<BarChart3 className="w-4 h-4 text-theme-accent" />}
                defaultOpen={allExpanded}
              >
                <MetricsTable quotesWithCalcs={quotesWithCalcs} metrics={metrics} />
              </CollapsibleSection>
            )}

            {/* Payment Plans Section */}
            <CollapsibleSection
              title="Payment Plans"
              icon={<Wallet className="w-4 h-4 text-theme-accent" />}
              defaultOpen={allExpanded}
            >
              <PaymentComparison quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={exchangeRate.rate} />
            </CollapsibleSection>

            {/* Growth Chart Section */}
            <CollapsibleSection
              title="Value Growth"
              icon={<TrendingUp className="w-4 h-4 text-theme-accent" />}
              defaultOpen={allExpanded}
            >
              <GrowthComparisonChart quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={exchangeRate.rate} />
            </CollapsibleSection>

            {/* Cashflow KPI - Rent vs Mortgage */}
            {quotesWithCalcs.some(q => 
              (q.quote.inputs.rentalYieldPercent || 0) > 0 || 
              (q.quote.inputs as any)?._mortgageInputs?.enabled
            ) && (
              <CollapsibleSection
                title="Monthly Cashflow"
                icon={<Banknote className="w-4 h-4 text-theme-accent" />}
                defaultOpen={allExpanded}
              >
                <CashflowKPIComparison quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={exchangeRate.rate} />
              </CollapsibleSection>
            )}

            {/* Rental Yield Comparison - BEFORE Mortgage */}
            {quotesWithCalcs.some(q => 
              (q.quote.inputs.rentalYieldPercent || 0) > 0 || 
              (q.calculations.holdAnalysis?.netAnnualRent || 0) > 0
            ) && (
              <CollapsibleSection
                title="Rental Yield"
                icon={<Percent className="w-4 h-4 text-theme-accent" />}
                defaultOpen={allExpanded}
              >
                <RentalYieldComparison quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={exchangeRate.rate} />
              </CollapsibleSection>
            )}

            {/* Mortgage Comparison - AFTER Rental Yield */}
            {quotesWithCalcs.some(q => (q.quote.inputs as any)?._mortgageInputs?.enabled) && (
              <CollapsibleSection
                title="Mortgage Comparison"
                icon={<Home className="w-4 h-4 text-theme-accent" />}
                defaultOpen={allExpanded}
              >
                <MortgageComparison quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={exchangeRate.rate} />
              </CollapsibleSection>
            )}

            {/* Value Differentiators Comparison */}
            <CollapsibleSection
              title="Value Differentiators"
              icon={<Gem className="w-4 h-4 text-theme-accent" />}
              defaultOpen={allExpanded}
            >
              <DifferentiatorsComparison quotesWithCalcs={quotesWithCalcs} />
            </CollapsibleSection>

            {/* Exit Scenarios */}
            {quotesWithCalcs.some(q => (q.quote.inputs as any)?.enabledSections?.exitStrategy !== false) && (
              <CollapsibleSection
                title="Exit Scenarios"
                icon={<DoorOpen className="w-4 h-4 text-theme-accent" />}
                defaultOpen={allExpanded}
              >
                <ExitComparison quotesWithCalcs={quotesWithCalcs} />
              </CollapsibleSection>
            )}
          </div>
        )}
      </main>

      {/* Quote Selector Modal */}
      <QuoteSelector
        open={showSelector}
        onClose={() => setShowSelector(false)}
        selectedIds={selectedIds}
        onSelect={setSelectedIds}
        maxQuotes={4}
        onLoadComparison={handleLoadComparison}
      />

      {/* Save Comparison Modal */}
      <SaveComparisonModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        quoteIds={selectedIds}
        investmentFocus={selectedFocus}
        showRecommendations={showRecommendations}
        existingId={currentComparisonId || undefined}
        existingTitle={currentComparisonTitle}
      />

      {/* Load Comparison Modal */}
      <LoadComparisonModal
        open={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoad={handleLoadComparison}
      />
    </div>
  );
};

export default QuotesCompare;
