import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, LayoutGrid, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuotesComparison, computeComparisonMetrics, QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { useOICalculations } from '@/components/roi/useOICalculations';
import { useRecommendationEngine, InvestmentFocus } from '@/hooks/useRecommendationEngine';
import { QuoteSelector } from '@/components/roi/compare/QuoteSelector';
import { CompareHeader } from '@/components/roi/compare/CompareHeader';
import { MetricsTable } from '@/components/roi/compare/MetricsTable';
import { PaymentComparison } from '@/components/roi/compare/PaymentComparison';
import { GrowthComparisonChart } from '@/components/roi/compare/GrowthComparisonChart';
import { ExitComparison } from '@/components/roi/compare/ExitComparison';
import { ProfileSelector } from '@/components/roi/compare/ProfileSelector';
import { RecommendationBadge, ScoreDisplay } from '@/components/roi/compare/RecommendationBadge';
import { RecommendationSummary } from '@/components/roi/compare/RecommendationSummary';

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

  const { quotes, loading, error } = useQuotesComparison(selectedIds);

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

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Hidden calculators */}
      {quotes.map(quote => (
        <QuoteCalculator 
          key={quote.id}
          quote={quote}
          onCalculated={(calc) => handleCalculated(quote.id, calc)}
        />
      ))}

      <header className="border-b border-[#2a3142] bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/my-quotes">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e]">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-[#CCFF00]" />
                Compare Quotes
              </h1>
              <p className="text-sm text-gray-400">
                {selectedIds.length} quotes selected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Recommendation Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1f2e] border border-[#2a3142]">
              <Sparkles className={`w-4 h-4 ${showRecommendations ? 'text-[#CCFF00]' : 'text-gray-500'}`} />
              <span className="text-sm text-gray-400 hidden sm:inline">AI Insights</span>
              <Switch
                checked={showRecommendations}
                onCheckedChange={setShowRecommendations}
                className="data-[state=checked]:bg-[#CCFF00]"
              />
            </div>
            <Button 
              onClick={() => setShowSelector(true)}
              variant="outline"
              className="border-[#2a3142] text-gray-300 hover:bg-[#2a3142] hover:text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Quote
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CCFF00]" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-400">{error}</p>
            <Button 
              onClick={() => setShowSelector(true)}
              className="mt-4 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
            >
              Select Quotes
            </Button>
          </div>
        ) : selectedIds.length < 2 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1a1f2e] flex items-center justify-center">
              <LayoutGrid className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-xl text-white mb-2">Select quotes to compare</h2>
            <p className="text-gray-400 mb-6">Choose 2-4 quotes to see them side by side</p>
            <Button 
              onClick={() => setShowSelector(true)}
              className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
            >
              Select Quotes
            </Button>
          </div>
        ) : !allCalculated ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CCFF00] mx-auto mb-4" />
              <p className="text-gray-400">Calculating projections...</p>
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
                    className="bg-[#1a1f2e] border border-[#2a3142] rounded-xl p-4 relative"
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

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-white truncate">
                          {quote.title || 'Untitled Quote'}
                        </h3>
                        {quote.projectName && (
                          <p className="text-sm text-gray-400 mt-1">
                            {quote.projectName}
                          </p>
                        )}
                        {quote.developer && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            by {quote.developer}
                          </p>
                        )}
                      </div>

                      {/* Score Display when recommendations enabled */}
                      {showRecommendations && recommendation && (
                        <ScoreDisplay scores={recommendation.scores} focus={selectedFocus} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Key Metrics Table */}
            {metrics && (
              <MetricsTable 
                quotesWithCalcs={quotesWithCalcs} 
                metrics={metrics} 
              />
            )}

            {/* Two column layout for Payment and Growth */}
            <div className="grid lg:grid-cols-2 gap-6">
              <PaymentComparison quotesWithCalcs={quotesWithCalcs} />
              <GrowthComparisonChart quotesWithCalcs={quotesWithCalcs} />
            </div>

            {/* Exit Scenarios */}
            <ExitComparison quotesWithCalcs={quotesWithCalcs} />
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
      />
    </div>
  );
};

export default QuotesCompare;
