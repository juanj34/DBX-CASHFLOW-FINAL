import { useMemo } from "react";
import { AcquiredProperty, PortfolioMetrics } from "./usePortfolio";

// Default rates
const DEFAULT_APPRECIATION_RATE = 6; // 6% annual
const DEFAULT_RENT_GROWTH_RATE = 4; // 4% annual
const PROJECTION_YEARS = 10;

export interface PortfolioProjectionPoint {
  year: number;
  date: string;
  portfolioValue: number;
  cumulativeRent: number;
  totalWealth: number; // portfolioValue + cumulativeRent
  isProjected: boolean;
  isToday?: boolean;
}

export interface ProjectionConfig {
  appreciationRate: number;
  rentGrowthRate: number;
}

/**
 * Calculate years to double investment considering both appreciation and rent
 */
export function calculateYearsToDouble(
  totalPurchaseValue: number,
  appreciationRate: number,
  annualRent: number,
  rentGrowthRate: number
): number {
  if (totalPurchaseValue <= 0) return 0;
  
  const target = 2 * totalPurchaseValue;
  let year = 0;
  let propertyValue = totalPurchaseValue;
  let cumulativeRent = 0;
  let currentAnnualRent = annualRent;
  
  while (year < 50) {
    // Check if we've doubled
    const totalWealth = propertyValue + cumulativeRent;
    if (totalWealth >= target) {
      // Interpolate for more precision
      if (year === 0) return 0;
      const prevWealth = propertyValue / (1 + appreciationRate / 100) + cumulativeRent - currentAnnualRent;
      const fraction = (target - prevWealth) / (totalWealth - prevWealth);
      return Math.max(0, year - 1 + fraction);
    }
    
    year++;
    // Property appreciates
    propertyValue *= (1 + appreciationRate / 100);
    // Add rent
    cumulativeRent += currentAnnualRent;
    // Rent grows
    currentAnnualRent *= (1 + rentGrowthRate / 100);
  }
  
  return 50; // Cap at 50 years
}

export interface UsePortfolioProjectionsResult {
  projections: PortfolioProjectionPoint[];
  yearsToDouble: number;
  targetWealth: number;
  currentProgress: number; // 0-100%
  config: ProjectionConfig;
  projectedValueAtDouble: number;
  projectedRentAtDouble: number;
}

export const usePortfolioProjections = (
  properties: AcquiredProperty[],
  metrics: PortfolioMetrics,
  config?: Partial<ProjectionConfig>
): UsePortfolioProjectionsResult => {
  const effectiveConfig: ProjectionConfig = {
    appreciationRate: config?.appreciationRate ?? DEFAULT_APPRECIATION_RATE,
    rentGrowthRate: config?.rentGrowthRate ?? DEFAULT_RENT_GROWTH_RATE,
  };

  return useMemo(() => {
    if (properties.length === 0) {
      return {
        projections: [],
        yearsToDouble: 0,
        targetWealth: 0,
        currentProgress: 0,
        config: effectiveConfig,
        projectedValueAtDouble: 0,
        projectedRentAtDouble: 0,
      };
    }

    const { appreciationRate, rentGrowthRate } = effectiveConfig;
    const currentYear = new Date().getFullYear();
    
    // Find earliest purchase date
    const purchaseDates = properties.map(p => new Date(p.purchase_date).getFullYear());
    const startYear = Math.min(...purchaseDates);
    
    // Annual rent (using monthly rent from metrics)
    const annualRent = metrics.totalMonthlyRent * 12;
    
    // Calculate years to double
    const yearsToDouble = calculateYearsToDouble(
      metrics.totalPurchaseValue,
      appreciationRate,
      annualRent,
      rentGrowthRate
    );
    
    const targetWealth = metrics.totalPurchaseValue * 2;
    
    // Build projection timeline
    const projections: PortfolioProjectionPoint[] = [];
    
    // Historical + Current + Projected points
    const endYear = currentYear + PROJECTION_YEARS;
    
    let cumulativeRent = 0;
    let currentAnnualRent = annualRent;
    
    for (let year = startYear; year <= endYear; year++) {
      const yearsFromStart = year - startYear;
      const isProjected = year > currentYear;
      const isToday = year === currentYear;
      
      // Calculate portfolio value with appreciation
      let portfolioValue: number;
      if (year === startYear) {
        portfolioValue = metrics.totalPurchaseValue;
      } else if (year <= currentYear) {
        // For past years, interpolate between purchase and current value
        const yearsOwned = currentYear - startYear;
        if (yearsOwned > 0) {
          const annualGrowth = (metrics.totalCurrentValue / metrics.totalPurchaseValue) ** (1 / yearsOwned) - 1;
          portfolioValue = metrics.totalPurchaseValue * Math.pow(1 + annualGrowth, yearsFromStart);
        } else {
          portfolioValue = metrics.totalCurrentValue;
        }
      } else {
        // Future projections use appreciation rate
        const yearsFromNow = year - currentYear;
        portfolioValue = metrics.totalCurrentValue * Math.pow(1 + appreciationRate / 100, yearsFromNow);
      }
      
      // Cumulative rent (simplified - adds full year's rent each year)
      if (year > startYear) {
        cumulativeRent += currentAnnualRent;
        currentAnnualRent *= (1 + rentGrowthRate / 100);
      }
      
      projections.push({
        year,
        date: `${year}`,
        portfolioValue,
        cumulativeRent,
        totalWealth: portfolioValue + cumulativeRent,
        isProjected,
        isToday,
      });
    }
    
    // Calculate current progress toward doubling
    const currentWealth = metrics.totalCurrentValue + cumulativeRent;
    const currentProgress = Math.min(100, ((currentWealth - metrics.totalPurchaseValue) / metrics.totalPurchaseValue) * 100);
    
    // Find projected values at double point
    const doubleYearIndex = Math.min(
      Math.ceil(yearsToDouble) + (currentYear - startYear),
      projections.length - 1
    );
    const projectedAtDouble = projections[doubleYearIndex] || projections[projections.length - 1];
    
    return {
      projections,
      yearsToDouble,
      targetWealth,
      currentProgress,
      config: effectiveConfig,
      projectedValueAtDouble: projectedAtDouble?.portfolioValue || 0,
      projectedRentAtDouble: projectedAtDouble?.cumulativeRent || 0,
    };
  }, [properties, metrics, effectiveConfig.appreciationRate, effectiveConfig.rentGrowthRate]);
};
