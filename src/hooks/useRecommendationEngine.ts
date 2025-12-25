import { useMemo } from 'react';
import { QuoteWithCalculations } from '@/hooks/useQuotesComparison';

export type InvestmentFocus = 'roi' | 'safety' | 'cashflow';

export interface RecommendationScores {
  roi: number;      // 0-100
  safety: number;   // 0-100
  cashflow: number; // 0-100
}

export interface QuoteRecommendation {
  quoteId: string;
  scores: RecommendationScores;
  winner: {
    roi: boolean;
    safety: boolean;
    cashflow: boolean;
  };
  highlights: string[];
}

export interface RecommendationResult {
  recommendations: QuoteRecommendation[];
  winners: {
    roi: string | null;
    safety: string | null;
    cashflow: string | null;
  };
  explanation: {
    roi: string;
    safety: string;
    cashflow: string;
  };
}

// Normalize a value to 0-100 scale based on min/max in the set
const normalize = (value: number, min: number, max: number, invert = false): number => {
  if (max === min) return 50;
  const normalized = ((value - min) / (max - min)) * 100;
  return invert ? 100 - normalized : normalized;
};

// Calculate weighted score from multiple factors
const weightedScore = (factors: { value: number; weight: number }[]): number => {
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedSum = factors.reduce((sum, f) => sum + f.value * f.weight, 0);
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

export const useRecommendationEngine = (
  quotesWithCalcs: QuoteWithCalculations[]
): RecommendationResult | null => {
  return useMemo(() => {
    if (quotesWithCalcs.length < 2) return null;

    // Extract all relevant metrics
    const metrics = quotesWithCalcs.map(q => {
      const scenario36 = q.calculations.scenarios.find(s => s.exitMonths === 36);
      const scenario60 = q.calculations.scenarios.find(s => s.exitMonths === 60);
      
      // Calculate volatility as the difference between construction and mature appreciation
      const volatility = Math.abs(
        q.quote.inputs.constructionAppreciation - q.quote.inputs.matureAppreciation
      );

      return {
        quoteId: q.quote.id,
        quoteName: q.quote.title || q.quote.projectName || 'Quote',
        // ROI metrics
        annualizedROE36: scenario36?.annualizedROE ?? 0,
        totalProfit60: scenario60?.profit ?? 0,
        avgAppreciation: (
          q.quote.inputs.constructionAppreciation + 
          q.quote.inputs.growthAppreciation + 
          q.quote.inputs.matureAppreciation
        ) / 3,
        // Safety metrics
        zoneMaturity: q.quote.inputs.zoneMaturityLevel,
        volatility,
        preHandoverPercent: q.quote.inputs.downpaymentPercent + q.quote.inputs.preHandoverPercent,
        growthPeriodYears: q.quote.inputs.growthPeriodYears,
        // Cashflow metrics
        rentalYield: q.calculations.holdAnalysis.rentalYieldOnInvestment,
        netAnnualRent: q.calculations.holdAnalysis.netAnnualRent,
        yearsToBreakEven: q.calculations.holdAnalysis.yearsToBreakEven,
      };
    });

    // Calculate min/max for normalization
    const minMax = {
      annualizedROE36: { min: Math.min(...metrics.map(m => m.annualizedROE36)), max: Math.max(...metrics.map(m => m.annualizedROE36)) },
      totalProfit60: { min: Math.min(...metrics.map(m => m.totalProfit60)), max: Math.max(...metrics.map(m => m.totalProfit60)) },
      avgAppreciation: { min: Math.min(...metrics.map(m => m.avgAppreciation)), max: Math.max(...metrics.map(m => m.avgAppreciation)) },
      zoneMaturity: { min: Math.min(...metrics.map(m => m.zoneMaturity)), max: Math.max(...metrics.map(m => m.zoneMaturity)) },
      volatility: { min: Math.min(...metrics.map(m => m.volatility)), max: Math.max(...metrics.map(m => m.volatility)) },
      preHandoverPercent: { min: Math.min(...metrics.map(m => m.preHandoverPercent)), max: Math.max(...metrics.map(m => m.preHandoverPercent)) },
      rentalYield: { min: Math.min(...metrics.map(m => m.rentalYield)), max: Math.max(...metrics.map(m => m.rentalYield)) },
      netAnnualRent: { min: Math.min(...metrics.map(m => m.netAnnualRent)), max: Math.max(...metrics.map(m => m.netAnnualRent)) },
      yearsToBreakEven: { min: Math.min(...metrics.map(m => m.yearsToBreakEven)), max: Math.max(...metrics.map(m => m.yearsToBreakEven)) },
    };

    // Calculate scores for each quote
    const recommendations: QuoteRecommendation[] = metrics.map(m => {
      // ROI Score: Higher ROE, profit, appreciation = better
      const roiScore = weightedScore([
        { value: normalize(m.annualizedROE36, minMax.annualizedROE36.min, minMax.annualizedROE36.max), weight: 0.4 },
        { value: normalize(m.totalProfit60, minMax.totalProfit60.min, minMax.totalProfit60.max), weight: 0.3 },
        { value: normalize(m.avgAppreciation, minMax.avgAppreciation.min, minMax.avgAppreciation.max), weight: 0.3 },
      ]);

      // Safety Score: Higher maturity, lower volatility, lower pre-handover = better
      const safetyScore = weightedScore([
        { value: normalize(m.zoneMaturity, minMax.zoneMaturity.min, minMax.zoneMaturity.max), weight: 0.4 },
        { value: normalize(m.volatility, minMax.volatility.min, minMax.volatility.max, true), weight: 0.3 },
        { value: normalize(m.preHandoverPercent, minMax.preHandoverPercent.min, minMax.preHandoverPercent.max, true), weight: 0.3 },
      ]);

      // Cashflow Score: Higher yield, rent, lower break-even = better
      const cashflowScore = weightedScore([
        { value: normalize(m.rentalYield, minMax.rentalYield.min, minMax.rentalYield.max), weight: 0.4 },
        { value: normalize(m.netAnnualRent, minMax.netAnnualRent.min, minMax.netAnnualRent.max), weight: 0.3 },
        { value: normalize(m.yearsToBreakEven, minMax.yearsToBreakEven.min, minMax.yearsToBreakEven.max, true), weight: 0.3 },
      ]);

      // Generate highlights
      const highlights: string[] = [];
      if (m.annualizedROE36 === Math.max(...metrics.map(x => x.annualizedROE36))) {
        highlights.push('Highest ROE');
      }
      if (m.zoneMaturity === Math.max(...metrics.map(x => x.zoneMaturity))) {
        highlights.push('Most Mature Zone');
      }
      if (m.rentalYield === Math.max(...metrics.map(x => x.rentalYield))) {
        highlights.push('Best Yield');
      }
      if (m.volatility === Math.min(...metrics.map(x => x.volatility))) {
        highlights.push('Lowest Risk');
      }

      return {
        quoteId: m.quoteId,
        scores: {
          roi: Math.round(roiScore),
          safety: Math.round(safetyScore),
          cashflow: Math.round(cashflowScore),
        },
        winner: { roi: false, safety: false, cashflow: false },
        highlights,
      };
    });

    // Determine winners for each focus
    const maxRoi = Math.max(...recommendations.map(r => r.scores.roi));
    const maxSafety = Math.max(...recommendations.map(r => r.scores.safety));
    const maxCashflow = Math.max(...recommendations.map(r => r.scores.cashflow));

    let roiWinner: string | null = null;
    let safetyWinner: string | null = null;
    let cashflowWinner: string | null = null;

    recommendations.forEach(r => {
      if (r.scores.roi === maxRoi) {
        r.winner.roi = true;
        roiWinner = r.quoteId;
      }
      if (r.scores.safety === maxSafety) {
        r.winner.safety = true;
        safetyWinner = r.quoteId;
      }
      if (r.scores.cashflow === maxCashflow) {
        r.winner.cashflow = true;
        cashflowWinner = r.quoteId;
      }
    });

    // Generate explanations
    const roiWinnerData = metrics.find(m => m.quoteId === roiWinner);
    const safetyWinnerData = metrics.find(m => m.quoteId === safetyWinner);
    const cashflowWinnerData = metrics.find(m => m.quoteId === cashflowWinner);

    const explanation = {
      roi: roiWinnerData 
        ? `${roiWinnerData.quoteName} offers the highest return potential with ${roiWinnerData.annualizedROE36.toFixed(1)}% annualized ROE at 36 months.`
        : '',
      safety: safetyWinnerData
        ? `${safetyWinnerData.quoteName} provides the most stability with ${safetyWinnerData.zoneMaturity}% zone maturity and lower payment risk.`
        : '',
      cashflow: cashflowWinnerData
        ? `${cashflowWinnerData.quoteName} delivers the strongest rental income at ${cashflowWinnerData.rentalYield.toFixed(1)}% yield.`
        : '',
    };

    return {
      recommendations,
      winners: {
        roi: roiWinner,
        safety: safetyWinner,
        cashflow: cashflowWinner,
      },
      explanation,
    };
  }, [quotesWithCalcs]);
};
