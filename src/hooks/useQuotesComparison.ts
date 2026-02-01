import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { OIInputs, OICalculations, useOICalculations } from '@/components/roi/useOICalculations';
import { migrateInputs } from '@/components/roi/inputMigration';

export interface ComparisonQuote {
  id: string;
  title: string | null;
  clientName: string | null;
  projectName: string | null;
  developer: string | null;
  unit: string | null;
  unitType: string | null;
  unitSizeSqf: number | null;
  inputs: OIInputs;
  updatedAt: string;
}

export interface QuoteWithCalculations {
  quote: ComparisonQuote;
  calculations: OICalculations;
}

export interface ComparisonMetrics {
  basePrice: { value: number }[];
  pricePerSqft: { value: number | null }[];
  totalInvestment: { value: number }[];
  handoverMonths: { value: number }[];
  preHandoverPercent: { value: number }[];
  rentalYieldY1: { value: number | null }[];
  roiAt36Months: { value: number | null }[];
}

export const useQuotesComparison = (quoteIds: string[]) => {
  const [quotes, setQuotes] = useState<ComparisonQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Use a ref to track current quoteIds for ordering during refetch
  const currentOrderRef = useRef<string[]>(quoteIds);
  
  // Keep ref in sync with prop
  useEffect(() => {
    currentOrderRef.current = quoteIds;
  }, [quoteIds]);

  const fetchQuotes = async () => {
    // Use the current order ref, not the prop directly (for focus refetch)
    const idsToFetch = currentOrderRef.current;
    
    if (idsToFetch.length === 0) {
      setQuotes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('cashflow_quotes')
        .select(`
          id, broker_id, share_token, client_name, client_country, client_email,
          project_name, developer, unit, unit_type, unit_size_sqf, unit_size_m2,
          inputs, title, created_at, updated_at, status, status_changed_at,
          presented_at, negotiation_started_at, sold_at, view_count, first_viewed_at,
          is_archived, archived_at, last_viewed_at
        `)
        .in('id', idsToFetch);

      if (fetchError) throw fetchError;

      const mappedQuotes: ComparisonQuote[] = (data || []).map((q) => {
        const rawInputs = q.inputs as any;
        const migratedInputs = migrateInputs(rawInputs);
        
        return {
          id: q.id,
          title: q.title,
          clientName: q.client_name,
          projectName: q.project_name,
          developer: q.developer,
          unit: q.unit,
          unitType: q.unit_type,
          unitSizeSqf: q.unit_size_sqf,
          inputs: {
            ...migratedInputs,
            unitSizeSqf: q.unit_size_sqf || migratedInputs.unitSizeSqf,
          } as OIInputs,
          updatedAt: q.updated_at || '',
        };
      });

      // Maintain order from current ref (respects user reordering)
      const orderedQuotes = currentOrderRef.current
        .map(id => mappedQuotes.find(q => q.id === id))
        .filter((q): q is ComparisonQuote => q !== undefined);

      setQuotes(orderedQuotes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch when quoteIds change
  useEffect(() => {
    fetchQuotes();
  }, [quoteIds.join(',')]);

  // Refetch when window regains focus (uses currentOrderRef for correct order)
  useEffect(() => {
    const handleFocus = () => {
      if (currentOrderRef.current.length > 0) {
        fetchQuotes();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return { quotes, loading, error, refetch: fetchQuotes };
};

// Hook to calculate metrics for a single quote (for use in comparison)
export const useQuoteCalculations = (inputs: OIInputs | null): OICalculations | null => {
  const calculations = useOICalculations(inputs || {
    basePrice: 0,
    rentalYieldPercent: 0,
    appreciationRate: 0,
    bookingMonth: 1,
    bookingYear: 2024,
    handoverQuarter: 1,
    handoverYear: 2025,
    downpaymentPercent: 20,
    preHandoverPercent: 20,
    additionalPayments: [],
    // Post-handover defaults
    hasPostHandoverPlan: false,
    onHandoverPercent: 0,
    postHandoverPercent: 0,
    postHandoverPayments: [],
    postHandoverEndQuarter: 4,
    postHandoverEndYear: 2030,
    // Entry costs
    eoiFee: 0,
    oqoodFee: 0,
    minimumExitThreshold: 30,
    exitAgentCommissionEnabled: false,
    exitNocFee: 5000,
    zoneMaturityLevel: 50,
    useZoneDefaults: true,
    constructionAppreciation: 12,
    growthAppreciation: 8,
    matureAppreciation: 4,
    growthPeriodYears: 5,
    rentGrowthRate: 4,
    serviceChargePerSqft: 18,
    adrGrowthRate: 3,
  });

  if (!inputs) return null;
  return calculations;
};

// Helper to compute normalized comparison metrics
export const computeComparisonMetrics = (
  quotesWithCalcs: QuoteWithCalculations[]
): ComparisonMetrics | null => {
  if (quotesWithCalcs.length === 0) return null;

  const basePrices = quotesWithCalcs.map(q => q.quote.inputs.basePrice);

  const pricePerSqfts = quotesWithCalcs.map(q => 
    q.quote.unitSizeSqf ? q.quote.inputs.basePrice / q.quote.unitSizeSqf : null
  );

  const totalInvestments = quotesWithCalcs.map(q => 
    q.calculations.holdAnalysis.totalCapitalInvested
  );

  const handoverMonthsList = quotesWithCalcs.map(q => q.calculations.totalMonths);

  const preHandoverPercents = quotesWithCalcs.map(q => 
    q.quote.inputs.downpaymentPercent + q.quote.inputs.preHandoverPercent
  );

  const rentalYields = quotesWithCalcs.map(q => {
    const y1 = q.calculations.yearlyProjections.find(p => !p.isConstruction && p.netIncome !== null);
    return y1 ? q.calculations.holdAnalysis.rentalYieldOnInvestment : null;
  });

  const rois36 = quotesWithCalcs.map(q => {
    const scenario = q.calculations.scenarios.find(s => s.exitMonths === 36);
    return scenario?.annualizedROE ?? null;
  });

  return {
    basePrice: basePrices.map(v => ({ value: v })),
    pricePerSqft: pricePerSqfts.map(v => ({ value: v })),
    totalInvestment: totalInvestments.map(v => ({ value: v })),
    handoverMonths: handoverMonthsList.map(v => ({ value: v })),
    preHandoverPercent: preHandoverPercents.map(v => ({ value: v })),
    rentalYieldY1: rentalYields.map(v => ({ value: v })),
    roiAt36Months: rois36.map(v => ({ value: v })),
  };
};
