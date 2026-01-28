import { useState, useEffect, useMemo } from "react";
import { Loader2, FileText, GitCompare, ChevronLeft, ChevronRight, BarChart3, TrendingUp, Gem, Home, DoorOpen, CreditCard, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { OIInputs, useOICalculations } from "@/components/roi/useOICalculations";
import { useMortgageCalculations, DEFAULT_MORTGAGE_INPUTS, MortgageInputs } from "@/components/roi/useMortgageCalculations";
import { InvestmentStoryDashboard } from "@/components/roi/InvestmentStoryDashboard";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { PresentationItem } from "@/hooks/usePresentations";
import { CashflowQuote } from "@/hooks/useCashflowQuote";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Currency } from "@/components/roi/currencyUtils";

// Vertical view components
import { InvestmentOverviewGrid } from "@/components/roi/InvestmentOverviewGrid";
import { OIGrowthCurve } from "@/components/roi/OIGrowthCurve";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { PaymentBreakdown } from "@/components/roi/PaymentBreakdown";
import { ExitScenariosCards, calculateAutoExitScenarios } from "@/components/roi/ExitScenariosCards";
import { CumulativeIncomeChart } from "@/components/roi/CumulativeIncomeChart";
import { MortgageBreakdown } from "@/components/roi/MortgageBreakdown";
import { CollapsibleSection } from "@/components/roi/CollapsibleSection";
import { ClientUnitInfo, ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { InvestmentSnapshot } from "@/components/roi/InvestmentSnapshot";
import { RentSnapshot } from "@/components/roi/RentSnapshot";
import { WealthSummaryCard } from "@/components/roi/WealthSummaryCard";
import { CashflowSummaryCard } from "@/components/roi/CashflowSummaryCard";
import { ValueDifferentiatorsDisplay } from "@/components/roi/ValueDifferentiatorsDisplay";
import { SnapshotContent } from "@/components/roi/snapshot";

// Comparison components
import { MetricsTable } from "@/components/roi/compare/MetricsTable";
import { PaymentComparison } from "@/components/roi/compare/PaymentComparison";
import { GrowthComparisonChart } from "@/components/roi/compare/GrowthComparisonChart";
import { ExitComparison } from "@/components/roi/compare/ExitComparison";
import { MortgageComparison } from "@/components/roi/compare/MortgageComparison";
import { DifferentiatorsComparison } from "@/components/roi/compare/DifferentiatorsComparison";
import { computeComparisonMetrics, QuoteWithCalculations, ComparisonQuote } from "@/hooks/useQuotesComparison";

interface PresentationPreviewProps {
  items: PresentationItem[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  quotes: CashflowQuote[];
  // Global settings from parent
  currency?: Currency;
  language?: 'en' | 'es';
  rate?: number;
}

interface QuoteData {
  inputs: OIInputs;
  mortgageInputs: MortgageInputs;
  heroImageUrl: string | null;
  buildingRenderUrl: string | null;
  floorPlanUrl: string | null;
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
  clientUnitData: ClientUnitData;
  developerId?: string;
  projectId?: string;
  exitScenarios?: number[];
}

interface ComparisonData {
  title: string;
  quoteIds: string[];
  quotes: CashflowQuote[];
}

// Single quote preview component
const QuotePreview = ({ 
  quoteData, 
  viewMode,
  currency = 'AED',
  language = 'en',
  rate: propRate,
}: { 
  quoteData: QuoteData; 
  viewMode: 'snapshot' | 'vertical' | 'compact';
  currency?: Currency;
  language?: 'en' | 'es';
  rate?: number;
}) => {
  const { rate: defaultRate } = useExchangeRate(currency);
  const rate = propRate ?? defaultRate;
  const { t } = useLanguage();
  const calculations = useOICalculations(quoteData.inputs);
  const mortgageAnalysis = useMortgageCalculations({
    mortgageInputs: quoteData.mortgageInputs,
    basePrice: quoteData.inputs.basePrice,
    preHandoverPercent: quoteData.inputs.preHandoverPercent,
    monthlyRent: calculations?.holdAnalysis?.annualRent ? calculations.holdAnalysis.annualRent / 12 : 0,
    monthlyServiceCharges: calculations?.holdAnalysis?.annualServiceCharges ? calculations.holdAnalysis.annualServiceCharges / 12 : 0,
  });

  // Use saved exit scenarios or auto-calculate - but only if exits are enabled
  const exitScenarios = useMemo(() => {
    // If exit strategy is explicitly disabled, return empty array
    if (quoteData.inputs.enabledSections?.exitStrategy === false) {
      return [];
    }
    if (quoteData.exitScenarios && quoteData.exitScenarios.length > 0) {
      return quoteData.exitScenarios;
    }
    if (!calculations) return [12, 24, 36];
    return calculateAutoExitScenarios(calculations.totalMonths);
  }, [quoteData.exitScenarios, quoteData.inputs.enabledSections?.exitStrategy, calculations]);

  if (!calculations) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-theme-accent" />
      </div>
    );
  }

  // Snapshot view - use the same SnapshotContent as OICalculator and SnapshotView
  if (viewMode === 'snapshot') {
    return (
      <SnapshotContent
        inputs={quoteData.inputs}
        calculations={calculations}
        clientInfo={quoteData.clientUnitData}
        mortgageInputs={quoteData.mortgageInputs}
        mortgageAnalysis={mortgageAnalysis}
        exitScenarios={exitScenarios}
        quoteImages={{
          heroImageUrl: quoteData.heroImageUrl,
          floorPlanUrl: quoteData.floorPlanUrl,
          buildingRenderUrl: quoteData.buildingRenderUrl,
        }}
        currency={currency}
        setCurrency={undefined}
        language={language}
        setLanguage={undefined}
        rate={rate}
      />
    );
  }

  // Vertical/Cashflow view - matching CashflowView.tsx layout exactly
  const year7Projection = calculations.yearlyProjections[6] || calculations.yearlyProjections[calculations.yearlyProjections.length - 1];
  const totalCapitalInvested = calculations.basePrice + calculations.totalEntryCosts;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Client & Unit Info */}
      <ClientUnitInfo data={quoteData.clientUnitData} onEditClick={() => {}} readOnly={true} />

      {/* Investment Overview Grid with hero image */}
      <InvestmentOverviewGrid
        inputs={quoteData.inputs}
        calculations={calculations}
        mortgageAnalysis={mortgageAnalysis}
        mortgageEnabled={quoteData.mortgageInputs.enabled}
        currency="AED"
        rate={rate}
        compact={true}
        renderImageUrl={quoteData.heroImageUrl || quoteData.buildingRenderUrl}
      />

      {/* Investment Snapshot */}
      <InvestmentSnapshot 
        inputs={quoteData.inputs} 
        currency="AED" 
        totalMonths={calculations.totalMonths} 
        totalEntryCosts={calculations.totalEntryCosts} 
        rate={rate} 
        holdAnalysis={calculations.holdAnalysis} 
        unitSizeSqf={quoteData.clientUnitData.unitSizeSqf} 
      />

      {/* Payment Breakdown - Collapsible */}
      <CollapsibleSection
        title={t('paymentBreakdownTitle') || "Payment Schedule"}
        subtitle={`${quoteData.inputs.preHandoverPercent}/${100 - quoteData.inputs.preHandoverPercent} ${t('paymentStructure') || 'Payment Structure'}`}
        icon={<CreditCard className="w-5 h-5 text-theme-accent" />}
        defaultOpen={false}
      >
        <PaymentBreakdown 
          inputs={quoteData.inputs} 
          currency="AED" 
          totalMonths={calculations.totalMonths} 
          rate={rate} 
          unitSizeSqf={quoteData.clientUnitData.unitSizeSqf} 
          clientInfo={quoteData.clientUnitData} 
        />
      </CollapsibleSection>

      {/* Value Differentiators Display */}
      <ValueDifferentiatorsDisplay
        selectedDifferentiators={quoteData.inputs.valueDifferentiators || []}
        readOnly={true}
        showAppreciationBonus={true}
      />

      {/* Hold Strategy Analysis - Collapsible */}
      {(quoteData.inputs.enabledSections?.longTermHold !== false) && (
        <CollapsibleSection
          title={t('holdStrategyAnalysis') || "Long-Term Hold Analysis"}
          subtitle={t('holdStrategySubtitle') || "Rental income projections over time"}
          icon={<Home className="w-5 h-5 text-theme-accent" />}
          defaultOpen={false}
        >
          <div className="space-y-4 sm:space-y-6">
            <RentSnapshot 
              inputs={quoteData.inputs} 
              currency="AED" 
              rate={rate} 
              holdAnalysis={calculations.holdAnalysis} 
            />
            <CumulativeIncomeChart 
              projections={calculations.yearlyProjections.slice(0, 7)} 
              currency="AED" 
              rate={rate} 
              totalCapitalInvested={totalCapitalInvested} 
              showAirbnbComparison={calculations.showAirbnbComparison} 
            />
            <OIYearlyProjectionTable 
              projections={calculations.yearlyProjections.slice(0, 7)} 
              currency="AED" 
              rate={rate} 
              showAirbnbComparison={calculations.showAirbnbComparison} 
            />
            <WealthSummaryCard 
              propertyValueFinal={year7Projection.propertyValue} 
              cumulativeRentIncome={year7Projection.cumulativeNetIncome} 
              airbnbCumulativeIncome={calculations.showAirbnbComparison ? year7Projection.airbnbCumulativeNetIncome : undefined} 
              initialInvestment={totalCapitalInvested} 
              currency="AED" 
              rate={rate} 
              showAirbnbComparison={calculations.showAirbnbComparison} 
            />
          </div>
        </CollapsibleSection>
      )}

      {/* Exit Strategy - Collapsible */}
      {(quoteData.inputs.enabledSections?.exitStrategy === true || (quoteData.inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0)) && (
        <CollapsibleSection
          title={t('exitStrategyAnalysis') || "Exit Strategy Analysis"}
          subtitle={t('whenToSell') || "When to flip for maximum return"}
          icon={<TrendingUp className="w-5 h-5 text-theme-accent" />}
          defaultOpen={false}
        >
          <div className="space-y-4 sm:space-y-6">
            <ExitScenariosCards 
              inputs={quoteData.inputs} 
              currency="AED" 
              totalMonths={calculations.totalMonths} 
              basePrice={calculations.basePrice} 
              totalEntryCosts={calculations.totalEntryCosts} 
              exitScenarios={exitScenarios} 
              rate={rate} 
              readOnly={true} 
              unitSizeSqf={quoteData.clientUnitData.unitSizeSqf} 
            />
            <OIGrowthCurve 
              calculations={calculations} 
              inputs={quoteData.inputs} 
              currency="AED" 
              exitScenarios={exitScenarios} 
              rate={rate} 
            />
          </div>
        </CollapsibleSection>
      )}

      {/* Mortgage Analysis - Collapsible */}
      {quoteData.mortgageInputs.enabled && calculations && (
        <CollapsibleSection
          title={t('mortgageAnalysis') || "Mortgage Analysis"}
          subtitle={t('mortgageAnalysisSubtitle') || "Loan structure, fees, and impact on cashflow"}
          icon={<Building2 className="w-5 h-5 text-theme-accent" />}
          defaultOpen={false}
        >
          {(() => {
            const firstFullRentalYear = calculations.yearlyProjections.find(p => 
              !p.isConstruction && !p.isHandover && p.annualRent !== null && p.annualRent > 0
            );
            const fullAnnualRent = firstFullRentalYear?.annualRent || (quoteData.inputs.basePrice * quoteData.inputs.rentalYieldPercent / 100);
            const monthlyLongTermRent = fullAnnualRent / 12;
            const monthlyServiceCharges = (firstFullRentalYear?.serviceCharges || 0) / 12;
            const fullAnnualAirbnbNet = firstFullRentalYear?.airbnbNetIncome || 0;
            const monthlyAirbnbNet = fullAnnualAirbnbNet / 12;
            
            const year5RentalYear = (firstFullRentalYear?.year || 0) + 4;
            const year5Projection = calculations.yearlyProjections.find(p => p.year === year5RentalYear);
            const year5LongTermRent = year5Projection?.annualRent ? (year5Projection.annualRent / 12) : undefined;
            const year5AirbnbNet = year5Projection?.airbnbNetIncome ? (year5Projection.airbnbNetIncome / 12) : undefined;
            
            return (
              <MortgageBreakdown
                mortgageInputs={quoteData.mortgageInputs}
                mortgageAnalysis={mortgageAnalysis}
                basePrice={calculations.basePrice}
                currency="AED"
                rate={rate}
                preHandoverPercent={quoteData.inputs.preHandoverPercent}
                monthlyLongTermRent={monthlyLongTermRent}
                monthlyServiceCharges={monthlyServiceCharges}
                monthlyAirbnbNet={monthlyAirbnbNet}
                showAirbnbComparison={calculations.showAirbnbComparison}
                rentGrowthRate={quoteData.inputs.rentGrowthRate}
                year5LongTermRent={year5LongTermRent}
                year5AirbnbNet={year5AirbnbNet}
              />
            );
          })()}
        </CollapsibleSection>
      )}

      {/* Investment Summary */}
      <CashflowSummaryCard
        inputs={quoteData.inputs}
        clientInfo={quoteData.clientUnitData}
        calculations={calculations}
        mortgageAnalysis={mortgageAnalysis}
        mortgageInputs={quoteData.mortgageInputs}
        exitScenarios={exitScenarios}
        currency="AED"
        rate={rate}
        showExitScenarios={quoteData.inputs.enabledSections?.exitStrategy === true || (quoteData.inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0)}
        showRentalPotential={true}
        showMortgageAnalysis={quoteData.mortgageInputs?.enabled ?? false}
        readOnly={true}
        defaultOpen={false}
      />
    </div>
  );
};

// Helper component to calculate for a single quote
const QuoteCalculator = ({ 
  quote, 
  onCalculated 
}: { 
  quote: CashflowQuote; 
  onCalculated: (quoteId: string, calc: any) => void;
}) => {
  const calculations = useOICalculations(quote.inputs);
  
  useEffect(() => {
    if (calculations) {
      onCalculated(quote.id, calculations);
    }
  }, [calculations, quote.id, onCalculated]);

  return null;
};

// Full comparison preview component with all comparison sections
const ComparisonPreview = ({ 
  comparisonData,
  currency = 'AED',
  language = 'en',
  rate: propRate,
}: { 
  comparisonData: ComparisonData;
  currency?: Currency;
  language?: 'en' | 'es';
  rate?: number;
}) => {
  const { rate: defaultRate } = useExchangeRate(currency);
  const rate = propRate ?? defaultRate;
  const [calculationsMap, setCalculationsMap] = useState<Record<string, any>>({});

  const handleCalculated = (quoteId: string, calc: any) => {
    setCalculationsMap(prev => ({ ...prev, [quoteId]: calc }));
  };

  // Build quotesWithCalcs from comparisonData.quotes
  const quotesWithCalcs: QuoteWithCalculations[] = useMemo(() => {
    return comparisonData.quotes
      .filter(q => calculationsMap[q.id])
      .map(q => {
        // Map CashflowQuote to ComparisonQuote structure
        const comparisonQuote: ComparisonQuote = {
          id: q.id,
          title: q.title || q.project_name || 'Quote',
          projectName: q.project_name || undefined,
          developer: q.developer || undefined,
          clientName: q.client_name || undefined,
          unit: q.unit || undefined,
          unitType: q.unit_type || undefined,
          unitSizeSqf: q.unit_size_sqf || undefined,
          inputs: q.inputs,
          updatedAt: q.updated_at || new Date().toISOString(),
        };
        return {
          quote: comparisonQuote,
          calculations: calculationsMap[q.id],
        };
      });
  }, [comparisonData.quotes, calculationsMap]);

  const metrics = useMemo(() => {
    if (quotesWithCalcs.length < 2) return null;
    return computeComparisonMetrics(quotesWithCalcs);
  }, [quotesWithCalcs]);

  const allCalculated = comparisonData.quotes.length > 0 && 
    comparisonData.quotes.every(q => calculationsMap[q.id]);

  // Check for mortgage data
  const hasMortgage = quotesWithCalcs.some(q => 
    (q.quote.inputs as any)?._mortgageInputs?.enabled
  );

  return (
    <div className="h-full overflow-y-auto">
      {/* Hidden calculators */}
      {comparisonData.quotes.map(quote => (
        <QuoteCalculator 
          key={quote.id}
          quote={quote}
          onCalculated={handleCalculated}
        />
      ))}

      {!allCalculated ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent mx-auto mb-4" />
            <p className="text-theme-text-muted">Calculating projections...</p>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Comparison Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-theme-text flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-purple-400" />
                {comparisonData.title}
              </h2>
              <p className="text-sm text-theme-text-muted">
                Comparing {comparisonData.quotes.length} properties
              </p>
            </div>
          </div>

          {/* Key Metrics Table */}
          {metrics && (
            <CollapsibleSection
              title="Key Metrics Comparison"
              icon={<BarChart3 className="w-4 h-4 text-theme-accent" />}
              defaultOpen={true}
            >
              <MetricsTable quotesWithCalcs={quotesWithCalcs} metrics={metrics} />
            </CollapsibleSection>
          )}

          {/* Payment & Growth */}
          <CollapsibleSection
            title="Payment & Growth"
            icon={<TrendingUp className="w-4 h-4 text-theme-accent" />}
            defaultOpen={true}
          >
            <div className="space-y-6">
              <PaymentComparison quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={rate} />
              <GrowthComparisonChart quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={rate} />
            </div>
          </CollapsibleSection>

          {/* Value Differentiators */}
          <CollapsibleSection
            title="Value Differentiators"
            icon={<Gem className="w-4 h-4 text-theme-accent" />}
            defaultOpen={true}
          >
            <DifferentiatorsComparison quotesWithCalcs={quotesWithCalcs} />
          </CollapsibleSection>

          {/* Mortgage Comparison */}
          {hasMortgage && (
            <CollapsibleSection
              title="Mortgage Comparison"
              icon={<Home className="w-4 h-4 text-theme-accent" />}
              defaultOpen={true}
            >
              <MortgageComparison quotesWithCalcs={quotesWithCalcs} />
            </CollapsibleSection>
          )}

          {/* Exit Scenarios */}
          <CollapsibleSection
            title="Exit Scenarios"
            icon={<DoorOpen className="w-4 h-4 text-theme-accent" />}
            defaultOpen={true}
          >
            <ExitComparison quotesWithCalcs={quotesWithCalcs} currency={currency} exchangeRate={rate} />
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
};

export const PresentationPreview = ({
  items,
  selectedIndex,
  onSelectIndex,
  quotes,
  currency = 'AED',
  language = 'en',
  rate,
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
          const floorPlan = imagesData?.find(img => img.image_type === 'floor_plan');

          // Extract mortgage inputs from quote inputs (they're stored in the JSON)
          const savedMortgage = (quote.inputs as unknown as { _mortgageInputs?: Partial<MortgageInputs> })?._mortgageInputs;
          const mortgageInputs: MortgageInputs = savedMortgage ? {
            ...DEFAULT_MORTGAGE_INPUTS,
            ...savedMortgage,
          } : DEFAULT_MORTGAGE_INPUTS;

          // Extract zone info from inputs
          const inputsWithZone = quote.inputs as unknown as { 
            zoneName?: string; 
            zoneId?: string; 
            developerId?: string; 
            projectId?: string;
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
          };

          // Build clientUnitData from quote
          const savedClients = inputsWithZone._clients;
          const savedClientInfo = inputsWithZone._clientInfo;
          const clients = savedClients && savedClients.length > 0
            ? savedClients
            : quote.client_name 
              ? [{ id: '1', name: quote.client_name, country: quote.client_country || '' }]
              : [];

          const clientUnitData: ClientUnitData = {
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

          setQuoteData({
            inputs: quote.inputs,
            mortgageInputs,
            heroImageUrl: heroImage?.image_url || null,
            buildingRenderUrl: buildingRender?.image_url || null,
            floorPlanUrl: floorPlan?.image_url || null,
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
            clientUnitData,
            developerId: inputsWithZone?.developerId,
            projectId: inputsWithZone?.projectId,
            exitScenarios: inputsWithZone?._exitScenarios,
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
      <div className="flex-1 overflow-auto bg-theme-bg">
        {currentItem?.type === 'quote' && quoteData && (
          <QuotePreview 
            quoteData={quoteData} 
            viewMode="snapshot"
            currency={currency}
            language={language}
            rate={rate}
          />
        )}
        {(currentItem?.type === 'comparison' || currentItem?.type === 'inline_comparison') && comparisonData && (
          <ComparisonPreview 
            comparisonData={comparisonData} 
            currency={currency}
            language={language}
            rate={rate}
          />
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