import { useState, useEffect, useMemo } from 'react';
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
  basePrice: { value: number; best: boolean }[];
  pricePerSqft: { value: number | null; best: boolean }[];
  totalInvestment: { value: number; best: boolean }[];
  handoverMonths: { value: number; best: boolean }[];
  preHandoverPercent: { value: number; best: boolean }[];
  rentalYieldY1: { value: number | null; best: boolean }[];
  constructionAppreciation: { value: number; best: boolean }[];
  growthAppreciation: { value: number; best: boolean }[];
  roiAt36Months: { value: number | null; best: boolean }[];
}

export const useQuotesComparison = (quoteIds: string[]) => {
  const [quotes, setQuotes] = useState<ComparisonQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchQuotes = async () => {
      if (quoteIds.length === 0) {
        setQuotes([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('cashflow_quotes')
          .select('*')
          .in('id', quoteIds);

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

        // Maintain order from quoteIds
        const orderedQuotes = quoteIds
          .map(id => mappedQuotes.find(q => q.id === id))
          .filter((q): q is ComparisonQuote => q !== undefined);

        setQuotes(orderedQuotes);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch quotes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [quoteIds.join(',')]);

  return { quotes, loading, error };
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
    eoiFee: 0,
    oqoodFee: 0,
    minimumExitThreshold: 30,
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
  const minBasePrice = Math.min(...basePrices);

  const pricePerSqfts = quotesWithCalcs.map(q => 
    q.quote.unitSizeSqf ? q.quote.inputs.basePrice / q.quote.unitSizeSqf : null
  );
  const validPrices = pricePerSqfts.filter((p): p is number => p !== null);
  const minPricePerSqft = validPrices.length > 0 ? Math.min(...validPrices) : null;

  const totalInvestments = quotesWithCalcs.map(q => 
    q.calculations.holdAnalysis.totalCapitalInvested
  );
  const minTotalInvestment = Math.min(...totalInvestments);

  const handoverMonthsList = quotesWithCalcs.map(q => q.calculations.totalMonths);
  const minHandover = Math.min(...handoverMonthsList);

  const preHandoverPercents = quotesWithCalcs.map(q => 
    q.quote.inputs.downpaymentPercent + q.quote.inputs.preHandoverPercent
  );
  const minPreHandover = Math.min(...preHandoverPercents);

  const rentalYields = quotesWithCalcs.map(q => {
    const y1 = q.calculations.yearlyProjections.find(p => !p.isConstruction && p.netIncome !== null);
    return y1 ? q.calculations.holdAnalysis.rentalYieldOnInvestment : null;
  });
  const validYields = rentalYields.filter((y): y is number => y !== null);
  const maxYield = validYields.length > 0 ? Math.max(...validYields) : null;

  const constructionApps = quotesWithCalcs.map(q => q.quote.inputs.constructionAppreciation);
  const maxConstruction = Math.max(...constructionApps);

  const growthApps = quotesWithCalcs.map(q => q.quote.inputs.growthAppreciation);
  const maxGrowth = Math.max(...growthApps);

  const rois36 = quotesWithCalcs.map(q => {
    const scenario = q.calculations.scenarios.find(s => s.exitMonths === 36);
    return scenario?.annualizedROE ?? null;
  });
  const validRois = rois36.filter((r): r is number => r !== null);
  const maxRoi = validRois.length > 0 ? Math.max(...validRois) : null;

  return {
    basePrice: basePrices.map(v => ({ value: v, best: v === minBasePrice })),
    pricePerSqft: pricePerSqfts.map(v => ({ 
      value: v, 
      best: v !== null && minPricePerSqft !== null && v === minPricePerSqft 
    })),
    totalInvestment: totalInvestments.map(v => ({ value: v, best: v === minTotalInvestment })),
    handoverMonths: handoverMonthsList.map(v => ({ value: v, best: v === minHandover })),
    preHandoverPercent: preHandoverPercents.map(v => ({ value: v, best: v === minPreHandover })),
    rentalYieldY1: rentalYields.map(v => ({ 
      value: v, 
      best: v !== null && maxYield !== null && v === maxYield 
    })),
    constructionAppreciation: constructionApps.map(v => ({ value: v, best: v === maxConstruction })),
    growthAppreciation: growthApps.map(v => ({ value: v, best: v === maxGrowth })),
    roiAt36Months: rois36.map(v => ({ 
      value: v, 
      best: v !== null && maxRoi !== null && v === maxRoi 
    })),
  };
};
