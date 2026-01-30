// Types for Secondary Property Simulator

export interface SecondaryInputs {
  // Property
  purchasePrice: number;
  unitSizeSqf: number;
  closingCostsPercent: number; // Default 6% (DLD 4% + Agent 2%)
  
  // Rental (Long-Term)
  rentalYieldPercent: number; // Default 7% for secondary
  rentGrowthRate: number; // Default 3%
  
  // Rental (Short-Term/Airbnb)
  showAirbnbComparison: boolean;
  averageDailyRate: number; // ADR
  occupancyPercent: number; // Default 70%
  operatingExpensePercent: number; // Default 25%
  managementFeePercent: number; // Default 15%
  adrGrowthRate: number; // Default 3%
  
  // Appreciation (Conservative for secondary)
  appreciationRate: number; // Default 3%
  
  // Mortgage (Optional)
  useMortgage: boolean;
  mortgageFinancingPercent: number; // Default 60%
  mortgageInterestRate: number; // Default 4.5%
  mortgageLoanTermYears: number; // Default 25
  
  // Operating Costs
  serviceChargePerSqft: number; // Default 22 (secondary usually higher)
}

export interface SecondaryYearlyProjection {
  year: number;
  calendarYear: number;
  propertyValue: number;
  // Long-Term rental
  annualRentLT: number;
  serviceCharges: number;
  netRentLT: number;
  cumulativeRentLT: number;
  // Airbnb
  grossRentST: number;
  expensesST: number;
  netRentST: number;
  cumulativeRentST: number;
  // Mortgage (if enabled)
  annualMortgagePayment: number;
  cashflowLT: number; // Net rent - mortgage
  cashflowST: number;
  mortgageBalance: number;
  principalPaid: number;
  // Wealth metrics
  equityBuildup: number; // Property value - mortgage balance
  totalWealthLT: number; // Equity + cumulative rent - capital invested
  totalWealthST: number;
}

export interface SecondaryCalculations {
  // Capital
  closingCosts: number;
  equityRequired: number;
  totalCapitalDay1: number;
  
  // Long-Term Rental (Year 1)
  grossAnnualRentLT: number;
  serviceCharges: number;
  netAnnualRentLT: number;
  monthlyRentLT: number;
  
  // Short-Term Rental (Year 1)
  grossAnnualRentST: number;
  operatingExpenses: number;
  managementFees: number;
  netAnnualRentST: number;
  monthlyRentST: number;
  
  // Mortgage Analysis
  loanAmount: number;
  monthlyMortgagePayment: number;
  totalAnnualMortgagePayment: number;
  
  // DSCR (Debt Service Coverage Ratio)
  dscrLongTerm: number;
  dscrAirbnb: number;
  
  // Monthly Cashflow (after mortgage)
  monthlyCashflowLT: number;
  monthlyCashflowST: number;
  
  // Coverage Status
  coversLongTerm: boolean;
  coversAirbnb: boolean;
  
  // Yields
  grossYieldLT: number;
  netYieldLT: number;
  grossYieldST: number;
  netYieldST: number;
  cashOnCashReturnLT: number;
  cashOnCashReturnST: number;
  
  // 10-Year Projections
  yearlyProjections: SecondaryYearlyProjection[];
  wealthYear5LT: number;
  wealthYear5ST: number;
  wealthYear10LT: number;
  wealthYear10ST: number;
  cumulativeRentLT10Y: number;
  cumulativeRentST10Y: number;
}

export interface ComparisonMetrics {
  // Capital
  offPlanCapitalDay1: number;
  secondaryCapitalDay1: number;
  offPlanTotalCapitalAtHandover: number;
  
  // Out of Pocket (Off-Plan during construction)
  offPlanOutOfPocket: number;
  offPlanMonthsNoIncome: number;
  
  // Wealth at Year 5
  offPlanWealthYear5: number;
  secondaryWealthYear5LT: number;
  secondaryWealthYear5ST: number;
  
  // Wealth at Year 10
  offPlanWealthYear10: number;
  secondaryWealthYear10LT: number;
  secondaryWealthYear10ST: number;
  
  // Cashflow Year 1
  offPlanCashflowYear1: number;
  secondaryCashflowYear1LT: number;
  secondaryCashflowYear1ST: number;
  
  // DSCR
  offPlanDSCRLT: number;
  offPlanDSCRST: number;
  secondaryDSCRLT: number;
  secondaryDSCRST: number;
  
  // ROE
  offPlanROEYear10: number;
  secondaryROEYear10LT: number;
  secondaryROEYear10ST: number;
  
  // Crossover point (year when off-plan wealth > secondary)
  crossoverYearLT: number | null;
  crossoverYearST: number | null;
}

export const DEFAULT_SECONDARY_INPUTS: SecondaryInputs = {
  purchasePrice: 1200000,
  unitSizeSqf: 650,
  closingCostsPercent: 6,
  
  rentalYieldPercent: 7,
  rentGrowthRate: 3,
  
  showAirbnbComparison: true,
  averageDailyRate: 600,
  occupancyPercent: 70,
  operatingExpensePercent: 25,
  managementFeePercent: 15,
  adrGrowthRate: 3,
  
  appreciationRate: 3,
  
  useMortgage: true,
  mortgageFinancingPercent: 60,
  mortgageInterestRate: 4.5,
  mortgageLoanTermYears: 25,
  
  serviceChargePerSqft: 22,
};
