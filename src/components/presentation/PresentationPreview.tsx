import { useState, useEffect, useMemo } from "react";
import { Loader2, FileText, GitCompare, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { OIInputs, useOICalculations } from "@/components/roi/useOICalculations";
import { useMortgageCalculations, DEFAULT_MORTGAGE_INPUTS, MortgageInputs } from "@/components/roi/useMortgageCalculations";
import { InvestmentStoryDashboard } from "@/components/roi/InvestmentStoryDashboard";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { PresentationItem } from "@/hooks/usePresentations";
import { CashflowQuote } from "@/hooks/useCashflowQuote";
import { cn } from "@/lib/utils";

// Vertical view components
import { InvestmentOverviewGrid } from "@/components/roi/InvestmentOverviewGrid";
import { OIGrowthCurve } from "@/components/roi/OIGrowthCurve";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { PaymentBreakdown } from "@/components/roi/PaymentBreakdown";
import { ExitScenariosCards, calculateAutoExitScenarios } from "@/components/roi/ExitScenariosCards";
import { CumulativeIncomeChart } from "@/components/roi/CumulativeIncomeChart";
import { MortgageBreakdown } from "@/components/roi/MortgageBreakdown";
import { CollapsibleSection } from "@/components/roi/CollapsibleSection";

interface PresentationPreviewProps {
  items: PresentationItem[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  quotes: CashflowQuote[];
}

interface QuoteData {
  inputs: OIInputs;
  mortgageInputs: MortgageInputs;
  heroImageUrl: string | null;
  buildingRenderUrl: string | null;
  clientInfo: {
    clientName?: string;
    clientCountry?: string;
    projectName?: string;
    developer?: string;
    unit?: string;
    unitType?: string;
    zoneName?: string;
    zoneId?: string;
  };
  developerId?: string;
  projectId?: string;
}

interface ComparisonData {
  title: string;
  quoteIds: string[];
  quotes: CashflowQuote[];
}

// Single quote preview component
const QuotePreview = ({ 
  quoteData, 
  viewMode 
}: { 
  quoteData: QuoteData; 
  viewMode: 'story' | 'vertical' | 'compact';
}) => {
  const { rate } = useExchangeRate('AED');
  const calculations = useOICalculations(quoteData.inputs);
  const mortgageAnalysis = useMortgageCalculations({
    mortgageInputs: quoteData.mortgageInputs,
    basePrice: quoteData.inputs.basePrice,
    preHandoverPercent: quoteData.inputs.preHandoverPercent,
  });

  const exitScenarios = useMemo(() => {
    if (!calculations) return [];
    return calculateAutoExitScenarios(calculations.totalMonths);
  }, [calculations]);

  if (!calculations) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-theme-accent" />
      </div>
    );
  }

  if (viewMode === 'story') {
    return (
      <div className="h-full overflow-y-auto">
        <InvestmentStoryDashboard
          inputs={quoteData.inputs}
          calculations={calculations}
          mortgageInputs={quoteData.mortgageInputs}
          mortgageAnalysis={mortgageAnalysis}
          exitScenarios={exitScenarios}
          currency="AED"
          rate={rate}
          clientInfo={quoteData.clientInfo}
          heroImageUrl={quoteData.heroImageUrl}
          buildingRenderUrl={quoteData.buildingRenderUrl}
          developerId={quoteData.developerId}
          projectId={quoteData.projectId}
          zoneId={quoteData.clientInfo.zoneId}
        />
      </div>
    );
  }

  // Vertical/Cashflow view
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <InvestmentOverviewGrid
        inputs={quoteData.inputs}
        calculations={calculations}
        currency="AED"
        rate={rate}
      />
      
      <CollapsibleSection title="Payment Schedule" defaultOpen>
        <PaymentBreakdown
          inputs={quoteData.inputs}
          totalMonths={calculations.totalMonths}
          currency="AED"
          rate={rate}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Growth Projection" defaultOpen>
        <OIGrowthCurve
          inputs={quoteData.inputs}
          calculations={calculations}
          exitScenarios={exitScenarios}
          currency="AED"
          rate={rate}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Rental Income" defaultOpen>
        <CumulativeIncomeChart
          projections={calculations.yearlyProjections}
          totalCapitalInvested={calculations.holdAnalysis.totalCapitalInvested}
          showAirbnbComparison={quoteData.inputs.showAirbnbComparison || false}
          currency="AED"
          rate={rate}
        />
      </CollapsibleSection>

      {quoteData.mortgageInputs.enabled && (
        <CollapsibleSection title="Mortgage Analysis" defaultOpen>
          <MortgageBreakdown
            mortgageInputs={quoteData.mortgageInputs}
            mortgageAnalysis={mortgageAnalysis}
            basePrice={quoteData.inputs.basePrice}
            currency="AED"
            rate={rate}
            preHandoverPercent={quoteData.inputs.preHandoverPercent}
          />
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Exit Scenarios" defaultOpen>
        <ExitScenariosCards
          inputs={quoteData.inputs}
          totalMonths={calculations.totalMonths}
          basePrice={quoteData.inputs.basePrice}
          totalEntryCosts={calculations.totalEntryCosts}
          exitScenarios={exitScenarios}
          currency="AED"
          rate={rate}
          readOnly
        />
      </CollapsibleSection>

      <CollapsibleSection title="Year-by-Year Projection">
        <OIYearlyProjectionTable
          projections={calculations.yearlyProjections}
          showAirbnbComparison={quoteData.inputs.showAirbnbComparison || false}
          currency="AED"
          rate={rate}
        />
      </CollapsibleSection>
    </div>
  );
};

// Comparison preview component (simplified for inline)
const ComparisonPreview = ({ 
  comparisonData 
}: { 
  comparisonData: ComparisonData;
}) => {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
          <GitCompare className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-theme-text mb-2">{comparisonData.title}</h3>
        <p className="text-theme-text-muted text-sm mb-4">
          Comparing {comparisonData.quoteIds.length} properties
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {comparisonData.quotes.slice(0, 4).map(quote => (
            <span 
              key={quote.id}
              className="px-3 py-1 rounded-full bg-theme-bg text-theme-text text-xs border border-theme-border"
            >
              {quote.project_name || "Quote"}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PresentationPreview = ({
  items,
  selectedIndex,
  onSelectIndex,
  quotes,
}: PresentationPreviewProps) => {
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);

  const currentItem = items[selectedIndex];

  // Load data for the selected item
  useEffect(() => {
    const loadItemData = async () => {
      if (!currentItem) {
        setQuoteData(null);
        setComparisonData(null);
        return;
      }

      setLoading(true);

      if (currentItem.type === 'quote') {
        // Load full quote data
        const quote = quotes.find(q => q.id === currentItem.id);
        if (quote) {
          // Fetch images
          const { data: imagesData } = await supabase
            .from('cashflow_images')
            .select('image_type, image_url')
            .eq('quote_id', quote.id);

          const heroImage = imagesData?.find(img => img.image_type === 'hero_image');
          const buildingRender = imagesData?.find(img => img.image_type === 'building_render');

          // Extract mortgage inputs from quote inputs (they're stored in the JSON)
          const savedMortgage = (quote.inputs as unknown as { _mortgageInputs?: Partial<MortgageInputs> })?._mortgageInputs;
          const mortgageInputs: MortgageInputs = savedMortgage ? {
            ...DEFAULT_MORTGAGE_INPUTS,
            ...savedMortgage,
          } : DEFAULT_MORTGAGE_INPUTS;

          // Extract zone info from inputs
          const inputsWithZone = quote.inputs as unknown as { zoneName?: string; zoneId?: string; developerId?: string; projectId?: string };

          setQuoteData({
            inputs: quote.inputs,
            mortgageInputs,
            heroImageUrl: heroImage?.image_url || null,
            buildingRenderUrl: buildingRender?.image_url || null,
            clientInfo: {
              clientName: quote.client_name || undefined,
              clientCountry: quote.client_country || undefined,
              projectName: quote.project_name || undefined,
              developer: quote.developer || undefined,
              unit: quote.unit || undefined,
              unitType: quote.unit_type || undefined,
              zoneName: inputsWithZone?.zoneName,
              zoneId: inputsWithZone?.zoneId || quote.inputs.zoneId,
            },
            developerId: inputsWithZone?.developerId,
            projectId: inputsWithZone?.projectId,
          });
          setComparisonData(null);
        }
      } else if (currentItem.type === 'comparison') {
        // Load comparison data
        const { data: comparison } = await supabase
          .from('saved_comparisons')
          .select('*')
          .eq('id', currentItem.id)
          .single();

        if (comparison) {
          const comparisonQuotes = quotes.filter(q => comparison.quote_ids.includes(q.id));
          setComparisonData({
            title: comparison.title,
            quoteIds: comparison.quote_ids,
            quotes: comparisonQuotes,
          });
          setQuoteData(null);
        }
      } else if (currentItem.type === 'inline_comparison' && currentItem.quoteIds) {
        // Inline comparison (not saved to database)
        const comparisonQuotes = quotes.filter(q => currentItem.quoteIds?.includes(q.id));
        setComparisonData({
          title: currentItem.title || "Comparison",
          quoteIds: currentItem.quoteIds,
          quotes: comparisonQuotes,
        });
        setQuoteData(null);
      }

      setLoading(false);
    };

    loadItemData();
  }, [currentItem, quotes]);

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-theme-accent/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-theme-accent" />
          </div>
          <h2 className="text-xl font-semibold text-theme-text mb-2">Add Content</h2>
          <p className="text-theme-text-muted">
            Add quotes and comparisons from the sidebar to build your presentation.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-theme-accent" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Preview Content */}
      <div className="flex-1 overflow-hidden bg-theme-bg">
        {currentItem?.type === 'quote' && quoteData && (
          <QuotePreview 
            quoteData={quoteData} 
            viewMode={currentItem.viewMode || 'story'} 
          />
        )}
        {(currentItem?.type === 'comparison' || currentItem?.type === 'inline_comparison') && comparisonData && (
          <ComparisonPreview comparisonData={comparisonData} />
        )}
      </div>

      {/* Navigation Dots */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-3 py-4 bg-theme-card border-t border-theme-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSelectIndex(Math.max(0, selectedIndex - 1))}
            disabled={selectedIndex === 0}
            className="h-8 w-8 text-theme-text-muted hover:text-theme-text"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            {items.map((item, index) => (
              <button
                key={`${item.type}-${item.id}-${index}`}
                onClick={() => onSelectIndex(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  index === selectedIndex
                    ? item.type === 'comparison' || item.type === 'inline_comparison'
                      ? "bg-purple-500 scale-125"
                      : "bg-theme-accent scale-125"
                    : "bg-theme-border hover:bg-theme-text-muted"
                )}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSelectIndex(Math.min(items.length - 1, selectedIndex + 1))}
            disabled={selectedIndex === items.length - 1}
            className="h-8 w-8 text-theme-text-muted hover:text-theme-text"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
