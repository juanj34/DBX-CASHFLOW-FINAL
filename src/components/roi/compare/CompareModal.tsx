import { useState, useEffect, useMemo } from 'react';
import { X, LayoutGrid, Sparkles, ChevronUp, ChevronDown, Save, FolderOpen, Coins, Home, Percent, Gem, DoorOpen, TrendingUp, Wallet, Banknote, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useQuotesComparison, computeComparisonMetrics, QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { useOICalculations } from '@/components/roi/useOICalculations';
import { useRecommendationEngine, InvestmentFocus } from '@/hooks/useRecommendationEngine';
import { useSavedComparisons, SavedComparison } from '@/hooks/useSavedComparisons';
import { Currency, CURRENCY_CONFIG } from '@/components/roi/currencyUtils';
import { MetricsTable } from './MetricsTable';
import { PaymentComparison } from './PaymentComparison';
import { GrowthComparisonChart } from './GrowthComparisonChart';
import { ExitComparison } from './ExitComparison';
import { MortgageComparison } from './MortgageComparison';
import { RentalYieldComparison } from './RentalYieldComparison';
import { CashflowKPIComparison } from './CashflowKPIComparison';
import { DifferentiatorsComparison } from './DifferentiatorsComparison';
import { RecommendationBadge, ScoreDisplay } from './RecommendationBadge';
import { RecommendationSummary } from './RecommendationSummary';
import { CollapsibleSection } from '@/components/roi/CollapsibleSection';
import { SaveComparisonModal } from './SaveComparisonModal';
import { LoadComparisonModal } from './LoadComparisonModal';
import { ShareComparisonButton } from './ShareComparisonButton';
import { ExportComparisonButton } from './ExportComparisonButton';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface CompareModalProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
}

export const CompareModal = ({ open, onClose, selectedIds }: CompareModalProps) => {
  const { t } = useLanguage();
  const [calculationsMap, setCalculationsMap] = useState<Record<string, any>>({});
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState<InvestmentFocus | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [currentComparisonId, setCurrentComparisonId] = useState<string | null>(null);
  const [currentComparisonTitle, setCurrentComparisonTitle] = useState<string>('');
  const [currentShareToken, setCurrentShareToken] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('AED');
  const exchangeRate = useExchangeRate(currency);

  const { quotes, loading, error } = useQuotesComparison(selectedIds);

  const handleCalculated = (quoteId: string, calc: any) => {
    setCalculationsMap(prev => ({ ...prev, [quoteId]: calc }));
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
    setShowRecommendations(comparison.show_recommendations);
    setSelectedFocus(comparison.investment_focus as InvestmentFocus | null);
    setCurrentComparisonId(comparison.id);
    setCurrentComparisonTitle(comparison.title);
    setCurrentShareToken(comparison.share_token);
    setShowLoadModal(false);
  };

  // Reset state when modal opens with new ids
  useEffect(() => {
    if (open) {
      setCalculationsMap({});
      setCurrentComparisonId(null);
      setCurrentComparisonTitle('');
      setCurrentShareToken(null);
    }
  }, [open, selectedIds.join(',')]);

  const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500'];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] bg-theme-bg border-theme-border p-0 flex flex-col">
        {/* Hidden calculators */}
        {quotes.map(quote => (
          <QuoteCalculator 
            key={quote.id}
            quote={quote}
            onCalculated={(calc) => handleCalculated(quote.id, calc)}
          />
        ))}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-5 h-5 text-theme-accent" />
            <div>
              <DialogTitle className="text-lg font-semibold text-theme-text">
                {currentComparisonTitle || 'Compare Quotes'}
              </DialogTitle>
              <p className="text-sm text-theme-text-muted">{selectedIds.length} quotes selected</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Save Button */}
            <Button
              onClick={() => setShowSaveModal(true)}
              variant="outline"
              size="sm"
              className="border-theme-border text-theme-text-muted hover:bg-theme-card-alt gap-1.5"
              disabled={selectedIds.length < 2}
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </Button>
            
            {/* Load Button */}
            <Button
              onClick={() => setShowLoadModal(true)}
              variant="outline"
              size="sm"
              className="border-theme-border text-theme-text-muted hover:bg-theme-card-alt gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" />
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

            {/* AI Toggle */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-theme-card border border-theme-border">
              <Sparkles className={`w-3.5 h-3.5 ${showRecommendations ? 'text-theme-accent' : 'text-theme-text-muted'}`} />
              <Switch
                checked={showRecommendations}
                onCheckedChange={setShowRecommendations}
                className="data-[state=checked]:bg-theme-accent scale-90"
              />
            </div>

            {/* Currency Selector */}
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger className="w-[80px] h-8 border-theme-border bg-theme-card text-theme-text text-xs">
                <Coins className="w-3 h-3 mr-1 text-theme-accent" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border">
                {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key} className="text-theme-text hover:bg-theme-card-alt focus:bg-theme-card-alt text-xs">
                    {config.flag} {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Expand/Collapse All */}
            <Button
              onClick={() => setAllExpanded(!allExpanded)}
              variant="outline"
              size="sm"
              className="border-theme-border text-theme-text-muted hover:bg-theme-card-alt gap-1.5"
            >
              {allExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent" />
              </div>
            )}

            {!loading && quotes.length > 0 && (
              <>
                {/* Quote Cards */}
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${quotes.length}, minmax(180px, 1fr))` }}>
                  {quotes.map((quote, index) => {
                    const color = colors[index % colors.length];
                    const recommendation = showRecommendations && recommendations 
                      ? recommendations.recommendations.find(r => r.quoteId === quote.id)
                      : null;
                    
                    return (
                      <div
                        key={quote.id}
                        className="bg-theme-card border border-theme-border rounded-xl p-4 relative"
                        style={{ borderTopColor: color, borderTopWidth: '3px' }}
                      >
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
                            <h3 className="font-semibold text-theme-text truncate">
                              {quote.title || 'Untitled Quote'}
                            </h3>
                            {quote.developer && (
                              <p className="text-xs text-theme-text-muted mt-0.5">
                                by {quote.developer}
                              </p>
                            )}
                          </div>
                          
                          {/* Unit Info */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-theme-text-muted">
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

                {/* Recommendation Summary */}
                {showRecommendations && recommendations && selectedFocus && (
                  <RecommendationSummary 
                    result={recommendations}
                    focus={selectedFocus}
                  />
                )}

                {/* Comparison Sections */}
                {/* Quick KPI */}
                {metrics && (
                  <CollapsibleSection
                    title="Key Metrics Comparison"
                    icon={<BarChart3 className="w-4 h-4 text-theme-accent" />}
                    defaultOpen={allExpanded}
                  >
                    <MetricsTable quotesWithCalcs={quotesWithCalcs} metrics={metrics} />
                  </CollapsibleSection>
                )}

                {/* Cashflow KPI */}
                <CollapsibleSection
                  title="Cashflow Analysis"
                  icon={<Wallet className="w-4 h-4 text-theme-accent" />}
                  defaultOpen={allExpanded}
                >
                  <CashflowKPIComparison quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={exchangeRate.rate} />
                </CollapsibleSection>

                {/* Payment Plans */}
                <CollapsibleSection
                  title="Payment Plans"
                  icon={<Banknote className="w-4 h-4 text-theme-accent" />}
                  defaultOpen={allExpanded}
                >
                  <PaymentComparison quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={exchangeRate.rate} />
                </CollapsibleSection>

                {/* Growth Chart */}
                <CollapsibleSection
                  title="Projected Growth"
                  icon={<TrendingUp className="w-4 h-4 text-theme-accent" />}
                  defaultOpen={allExpanded}
                >
                  <GrowthComparisonChart quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={exchangeRate.rate} />
                </CollapsibleSection>

                {/* Rental Yield */}
                {quotesWithCalcs.some(q => (q.quote.inputs as any)?.enabledSections?.longTermHold !== false) && (
                  <CollapsibleSection
                    title="Rental Yield"
                    icon={<Percent className="w-4 h-4 text-theme-accent" />}
                    defaultOpen={allExpanded}
                  >
                    <RentalYieldComparison quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={exchangeRate.rate} />
                  </CollapsibleSection>
                )}

                {/* Mortgage */}
                {quotesWithCalcs.some(q => (q.quote.inputs as any)?._mortgageInputs?.enabled) && (
                  <CollapsibleSection
                    title="Mortgage Comparison"
                    icon={<Home className="w-4 h-4 text-theme-accent" />}
                    defaultOpen={allExpanded}
                  >
                    <MortgageComparison quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={exchangeRate.rate} />
                  </CollapsibleSection>
                )}

                {/* Value Differentiators */}
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
              </>
            )}
          </div>
        </ScrollArea>

        {/* Save Comparison Modal */}
        <SaveComparisonModal
          open={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSaved={(id, title) => {
            setCurrentComparisonId(id);
            setCurrentComparisonTitle(title);
          }}
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
      </DialogContent>
    </Dialog>
  );
};
