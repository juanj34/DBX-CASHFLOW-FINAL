export interface PaymentMilestone {
  id: string;
  type: 'time' | 'construction';
  triggerValue: number; // months if time, % if construction
  paymentPercent: number;
  label?: string;
}

export interface ShortTermRentalConfig {
  averageDailyRate: number;       // ADR in AED
  occupancyPercent: number;        // Annual occupancy % (e.g., 70)
  operatingExpensePercent: number; // Operating expenses % of gross (e.g., 25)
  managementFeePercent: number;    // Management fee % of gross (e.g., 15)
}

export interface OIInputs {
  basePrice: number;
  rentalYieldPercent: number; // Now: Initial Rental Yield at Handover
  appreciationRate: number; // Legacy - kept for backward compatibility
  bookingMonth: number; // 1-12
  bookingYear: number;
  handoverQuarter: number; // 1, 2, 3, 4 (Q1, Q2, Q3, Q4)
  handoverYear: number;
  
  // NEW: Restructured Payment Plan
  downpaymentPercent: number;       // Fixed downpayment at booking (default 20%)
  preHandoverPercent: number;       // Total pre-handover % from preset (e.g., 30 in 30/70)
  additionalPayments: PaymentMilestone[]; // Additional payments between downpayment and handover
  
  // Entry Costs (simplified - DLD fixed at 4%)
  eoiFee: number; // EOI / Booking fee (default 50000), part of downpayment
  oqoodFee: number; // Fixed amount
  
  // Exit Threshold
  minimumExitThreshold: number; // % mínimo requerido por developer para permitir reventa (default 30)
  
  // Rental Strategy - NEW: Long-term always + optional Airbnb comparison
  showAirbnbComparison?: boolean; // Toggle to show Airbnb comparison
  shortTermRental?: ShortTermRentalConfig;
  
  // Legacy field for backward compatibility
  rentalMode?: 'long-term' | 'short-term';
  
  // NEW: Zone-based appreciation
  zoneId?: string;
  zoneMaturityLevel: number; // 0-100
  useZoneDefaults: boolean; // If true, use zone-based appreciation profile
  
  // NEW: Phased appreciation rates
  constructionAppreciation: number; // Default 12% (during construction)
  growthAppreciation: number;       // Default 8% (first growthPeriodYears post-handover)
  matureAppreciation: number;       // Default 4% (after growth period)
  growthPeriodYears: number;        // Default 5 years
  
  // NEW: Independent rent growth
  rentGrowthRate: number; // Annual rent growth % (default 4%)
  
  // NEW: Service charges
  serviceChargePerSqft: number; // AED/sqft/year (default 18)
  unitSizeSqf?: number; // Pass from clientInfo for service charge calculation
  
  // NEW: ADR growth for Airbnb
  adrGrowthRate: number; // Annual ADR growth % (default 3%)
}

export interface OIExitScenario {
  exitMonths: number;
  exitPrice: number;
  equityDeployed: number;
  profit: number;
  roe: number;
  annualizedROE: number;
  amountPaidSoFar: number;
  entryCosts: number;
  totalCapitalDeployed: number;
  trueProfit: number;
  trueROE: number;
}

export interface OIHoldAnalysis {
  totalCapitalInvested: number;
  propertyValueAtHandover: number;
  annualRent: number;
  rentalYieldOnInvestment: number;
  yearsToBreakEven: number;
  yearsToPayOff: number; // basePrice / annualNetRent
  // Airbnb comparison
  airbnbAnnualRent?: number;
  airbnbYearsToBreakEven?: number;
  airbnbYearsToPayOff?: number;
  // NEW: Service charges
  annualServiceCharges: number;
  netAnnualRent: number;
}

export interface OIYearlyProjection {
  year: number;
  calendarYear: number;
  propertyValue: number;
  // Long-term rental (always calculated)
  annualRent: number | null;
  grossIncome: number | null;
  operatingExpenses: number | null;
  serviceCharges: number | null; // NEW
  managementFee: number | null;
  netIncome: number | null;
  cumulativeNetIncome: number;
  // Airbnb comparison (when showAirbnbComparison = true)
  airbnbGrossIncome: number | null;
  airbnbExpenses: number | null;
  airbnbNetIncome: number | null;
  airbnbCumulativeNetIncome: number;
  // Status flags
  isConstruction: boolean;
  isHandover: boolean;
  isBreakEven: boolean;
  isAirbnbBreakEven: boolean;
  // NEW: Phase info
  appreciationRate: number; // Rate used this year
  effectiveYield: number | null; // Actual yield (rent/property value)
  phase: 'construction' | 'growth' | 'mature';
}

export interface OICalculations {
  scenarios: OIExitScenario[];
  yearlyProjections: OIYearlyProjection[];
  totalMonths: number;
  basePrice: number;
  holdAnalysis: OIHoldAnalysis;
  totalEntryCosts: number;
  showAirbnbComparison: boolean;
}

// DLD Fee is always 4%
const DLD_FEE_PERCENT = 4;

// Default short-term rental config for backward compatibility
const DEFAULT_SHORT_TERM_RENTAL: ShortTermRentalConfig = {
  averageDailyRate: 800,
  occupancyPercent: 70,
  operatingExpensePercent: 25,
  managementFeePercent: 15,
};

// Convert quarter to mid-month for calculations
export const quarterToMonth = (quarter: number): number => {
  const quarterMidMonths: Record<number, number> = {
    1: 2,  // Q1 → February
    2: 5,  // Q2 → May
    3: 8,  // Q3 → August
    4: 11  // Q4 → November
  };
  return quarterMidMonths[quarter] || 2;
};

// NEW: Get appreciation profile based on zone maturity level
export interface ZoneAppreciationProfile {
  constructionAppreciation: number;
  growthAppreciation: number;
  matureAppreciation: number;
  growthPeriodYears: number;
  riskLevel: 'low' | 'low-medium' | 'medium' | 'medium-high' | 'high';
  description: string;
}

export const getZoneAppreciationProfile = (maturityLevel: number): ZoneAppreciationProfile => {
  // Zona muy nueva (0-25): Dubai South, nuevos masterplans
  if (maturityLevel <= 25) {
    return {
      constructionAppreciation: 15,
      growthAppreciation: 12,
      matureAppreciation: 6,
      growthPeriodYears: 7,
      riskLevel: 'high',
      description: 'High potential, higher risk'
    };
  }
  
  // Zona en desarrollo (26-50): Creek Harbour, Maritime City
  if (maturityLevel <= 50) {
    return {
      constructionAppreciation: 13,
      growthAppreciation: 10,
      matureAppreciation: 5,
      growthPeriodYears: 6,
      riskLevel: 'medium-high',
      description: 'Good growth potential'
    };
  }
  
  // Zona creciendo (51-75): JVC, Emaar Beachfront, Dubai Hills
  if (maturityLevel <= 75) {
    return {
      constructionAppreciation: 12,
      growthAppreciation: 8,
      matureAppreciation: 4,
      growthPeriodYears: 5,
      riskLevel: 'medium',
      description: 'Balanced growth/stability'
    };
  }
  
  // Zona madura (76-90): Business Bay, Sobha Hartland
  if (maturityLevel <= 90) {
    return {
      constructionAppreciation: 10,
      growthAppreciation: 6,
      matureAppreciation: 3,
      growthPeriodYears: 3,
      riskLevel: 'low-medium',
      description: 'Stable, moderate growth'
    };
  }
  
  // Zona saturada (91-100): Downtown, Marina, Palm, JBR
  return {
    constructionAppreciation: 8,
    growthAppreciation: 4,
    matureAppreciation: 2,
    growthPeriodYears: 2,
    riskLevel: 'low',
    description: 'Capital preservation, low growth'
  };
};

// Calculate equity deployed at exit based on new payment structure
const calculateEquityAtExit = (
  exitPercent: number,
  inputs: OIInputs,
  totalMonths: number,
  basePrice: number
): { equity: number; installmentsPaid: number } => {
  const exitMonth = (exitPercent / 100) * totalMonths;
  const handoverPercent = 100 - inputs.preHandoverPercent;
  
  let equity = 0;
  let installmentsPaid = 0;
  
  // 1. Downpayment - always triggered at month 0
  equity += basePrice * inputs.downpaymentPercent / 100;
  installmentsPaid++;
  
  // 2. Additional payments (between downpayment and handover)
  inputs.additionalPayments.forEach(m => {
    let triggered = false;
    
    if (m.type === 'time') {
      // Time-based: triggered if we've passed that month (absolute from booking)
      triggered = m.triggerValue <= exitMonth;
    } else {
      // Construction-based: triggered if construction reached that %
      triggered = m.triggerValue <= exitPercent;
    }
    
    if (triggered && m.paymentPercent > 0) {
      equity += basePrice * m.paymentPercent / 100;
      installmentsPaid++;
    }
  });
  
  // 3. Handover payment - only if exiting at 100%
  if (exitPercent >= 100) {
    equity += basePrice * handoverPercent / 100;
    installmentsPaid++;
  }
  
  return { equity, installmentsPaid };
};

// Count total installments
const countTotalInstallments = (inputs: OIInputs): number => {
  // Downpayment + additional payments with amount > 0 + handover
  const additionalCount = inputs.additionalPayments.filter(m => m.paymentPercent > 0).length;
  return 1 + additionalCount + 1; // 1 for downpayment + additionals + 1 for handover
};

export const useOICalculations = (inputs: OIInputs): OICalculations => {
  const { 
    basePrice, 
    rentalYieldPercent, 
    bookingMonth, 
    bookingYear, 
    handoverQuarter, 
    handoverYear, 
    oqoodFee,
    eoiFee,
  } = inputs;

  // Get appreciation rates (zone-based or manual)
  const constructionAppreciation = inputs.constructionAppreciation ?? 12;
  const growthAppreciation = inputs.growthAppreciation ?? 8;
  const matureAppreciation = inputs.matureAppreciation ?? 4;
  const growthPeriodYears = inputs.growthPeriodYears ?? 5;
  const rentGrowthRate = inputs.rentGrowthRate ?? 4;
  const serviceChargePerSqft = inputs.serviceChargePerSqft ?? 18;
  const unitSizeSqf = inputs.unitSizeSqf ?? 0;
  const adrGrowthRate = inputs.adrGrowthRate ?? 3;

  // Calculate entry costs (paid at booking) - DLD fixed at 4%
  const dldFeeAmount = basePrice * DLD_FEE_PERCENT / 100;
  const totalEntryCosts = dldFeeAmount + oqoodFee;

  // Convert handover quarter to month for calculations
  const handoverMonth = quarterToMonth(handoverQuarter);

  // Calculate total construction period from booking to handover
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const handoverDate = new Date(handoverYear, handoverMonth - 1);
  const totalMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  // Calculate handover year index (1-indexed)
  const handoverYearIndex = Math.ceil(totalMonths / 12);

  // Helper: Get appreciation rate for a given year
  const getAppreciationRate = (year: number): { rate: number; phase: 'construction' | 'growth' | 'mature' } => {
    if (year <= handoverYearIndex) {
      return { rate: constructionAppreciation, phase: 'construction' };
    } else if (year <= handoverYearIndex + growthPeriodYears) {
      return { rate: growthAppreciation, phase: 'growth' };
    } else {
      return { rate: matureAppreciation, phase: 'mature' };
    }
  };

  // Calculate property values year by year with phased appreciation
  const propertyValues: number[] = [basePrice]; // Year 0 = booking
  for (let i = 1; i <= 10; i++) {
    const { rate } = getAppreciationRate(i);
    const prevValue = propertyValues[i - 1];
    propertyValues.push(prevValue * (1 + rate / 100));
  }

  // Generate scenarios at key time points (every 6 months + handover)
  const exitMonthsOptions: number[] = [];
  for (let m = 6; m <= totalMonths; m += 6) {
    exitMonthsOptions.push(m);
  }
  if (!exitMonthsOptions.includes(totalMonths)) {
    exitMonthsOptions.push(totalMonths);
  }

  const scenarios: OIExitScenario[] = exitMonthsOptions.map(exitMonths => {
    const exitPercent = (exitMonths / totalMonths) * 100;
    const exitYears = exitMonths / 12;
    const exitYearIndex = Math.ceil(exitYears);

    // Property value at exit (from our calculated array, interpolated)
    const lowerYear = Math.floor(exitYears);
    const upperYear = Math.ceil(exitYears);
    const fraction = exitYears - lowerYear;
    const lowerValue = propertyValues[lowerYear] || basePrice;
    const upperValue = propertyValues[upperYear] || propertyValues[lowerYear] || basePrice;
    const exitPrice = lowerValue + (upperValue - lowerValue) * fraction;

    // Equity deployed using new calculation
    const { equity: equityDeployed } = calculateEquityAtExit(
      exitPercent, 
      inputs, 
      totalMonths, 
      basePrice
    );

    // Payment status
    const amountPaidSoFar = equityDeployed;

    // Entry costs (already paid)
    const entryCosts = totalEntryCosts;

    // Profit is appreciation
    const profit = exitPrice - basePrice;

    // True profit after entry costs only (no exit costs)
    const trueProfit = profit - entryCosts;

    // Total capital deployed = equity + entry costs
    const totalCapitalDeployed = equityDeployed + entryCosts;

    // ROE based on equity actually deployed
    const roe = equityDeployed > 0 ? (profit / equityDeployed) * 100 : 0;

    // True ROE based on total capital deployed
    const trueROE = totalCapitalDeployed > 0 ? (trueProfit / totalCapitalDeployed) * 100 : 0;

    // Annualized ROE
    const yearsHeld = exitMonths / 12;
    const annualizedROE = yearsHeld > 0 ? trueROE / yearsHeld : 0;

    return {
      exitMonths,
      exitPrice,
      equityDeployed,
      profit,
      roe,
      annualizedROE,
      amountPaidSoFar,
      entryCosts,
      totalCapitalDeployed,
      trueProfit,
      trueROE,
    };
  });

  // Short-term rental calculations with fallback for backward compatibility
  const shortTermRental = inputs.shortTermRental || DEFAULT_SHORT_TERM_RENTAL;
  const showAirbnbComparison = inputs.showAirbnbComparison || false;
  
  // Calculate property value at handover for initial rent calculation
  const propertyValueAtHandover = propertyValues[handoverYearIndex] || basePrice;
  
  // Initial rent based on handover value (not property value each year)
  const initialAnnualRent = propertyValueAtHandover * (rentalYieldPercent / 100);
  
  // Annual service charges
  const annualServiceCharges = unitSizeSqf * serviceChargePerSqft;
  
  const yearlyProjections: OIYearlyProjection[] = [];
  let cumulativeNetIncome = 0;
  let airbnbCumulativeNetIncome = 0;
  let breakEvenYear: number | null = null;
  let airbnbBreakEvenYear: number | null = null;
  
  // Track rent growth (independent of property value)
  let currentRent = initialAnnualRent;
  let currentADR = shortTermRental.averageDailyRate;
  
  for (let i = 1; i <= 10; i++) {
    const calendarYear = bookingYear + i - 1;
    const propertyValue = propertyValues[i];
    const { rate: appreciationRate, phase } = getAppreciationRate(i);
    const isConstruction = i <= handoverYearIndex;
    const isHandover = i === handoverYearIndex;
    
    // Long-term rental (always calculated)
    let annualRent: number | null = null;
    let grossIncome: number | null = null;
    let operatingExpenses: number | null = null;
    let serviceCharges: number | null = null;
    let managementFee: number | null = null;
    let netIncome: number | null = null;
    let effectiveYield: number | null = null;
    
    // Airbnb rental (only when comparison enabled)
    let airbnbGrossIncome: number | null = null;
    let airbnbExpenses: number | null = null;
    let airbnbNetIncome: number | null = null;
    
    if (!isConstruction) {
      // Years since handover (1 = first year after handover)
      const yearsSinceHandover = i - handoverYearIndex;
      
      // Rent grows independently each year after the first
      if (yearsSinceHandover > 1) {
        currentRent = currentRent * (1 + rentGrowthRate / 100);
      }
      
      // Long-term rental calculation
      annualRent = currentRent;
      grossIncome = annualRent;
      operatingExpenses = 0; // Long-term has minimal operating expenses
      serviceCharges = annualServiceCharges;
      managementFee = 0;
      netIncome = annualRent - annualServiceCharges;
      effectiveYield = (annualRent / propertyValue) * 100;
      cumulativeNetIncome += netIncome;
      
      // Airbnb rental calculation (when comparison enabled)
      if (showAirbnbComparison) {
        // ADR grows each year
        if (yearsSinceHandover > 1) {
          currentADR = currentADR * (1 + adrGrowthRate / 100);
        }
        
        airbnbGrossIncome = currentADR * 365 * (shortTermRental.occupancyPercent / 100);
        // Airbnb expenses include operating expenses + management + service charges
        const airbnbOperatingExpenses = airbnbGrossIncome * ((shortTermRental.operatingExpensePercent + shortTermRental.managementFeePercent) / 100);
        airbnbExpenses = airbnbOperatingExpenses + annualServiceCharges;
        airbnbNetIncome = airbnbGrossIncome - airbnbExpenses;
        airbnbCumulativeNetIncome += airbnbNetIncome;
      }
    }
    
    // Check for break-even (cumulative net income >= total capital invested)
    const totalCapitalInvested = basePrice + totalEntryCosts;
    const isBreakEven = !isConstruction && breakEvenYear === null && cumulativeNetIncome >= totalCapitalInvested;
    if (isBreakEven) {
      breakEvenYear = i;
    }
    
    const isAirbnbBreakEven = showAirbnbComparison && !isConstruction && airbnbBreakEvenYear === null && airbnbCumulativeNetIncome >= totalCapitalInvested;
    if (isAirbnbBreakEven) {
      airbnbBreakEvenYear = i;
    }
    
    yearlyProjections.push({
      year: i,
      calendarYear,
      propertyValue,
      annualRent,
      grossIncome,
      operatingExpenses,
      serviceCharges,
      managementFee,
      netIncome,
      cumulativeNetIncome,
      airbnbGrossIncome,
      airbnbExpenses,
      airbnbNetIncome,
      airbnbCumulativeNetIncome,
      isConstruction,
      isHandover,
      isBreakEven,
      isAirbnbBreakEven,
      appreciationRate,
      effectiveYield,
      phase,
    });
  }

  // Hold Analysis - always calculate long-term, optionally calculate Airbnb
  const totalCapitalInvested = basePrice + totalEntryCosts;
  
  // Long-term rent at handover (first year net)
  const netAnnualRent = initialAnnualRent - annualServiceCharges;
  const rentalYieldOnInvestment = (netAnnualRent / totalCapitalInvested) * 100;
  const yearsToBreakEven = netAnnualRent > 0 ? totalCapitalInvested / netAnnualRent : 999;
  const yearsToPayOff = netAnnualRent > 0 ? basePrice / netAnnualRent : 999;
  
  // Airbnb rent (optional)
  let airbnbAnnualRent: number | undefined;
  let airbnbYearsToBreakEven: number | undefined;
  let airbnbYearsToPayOff: number | undefined;
  
  if (showAirbnbComparison) {
    const airbnbGross = shortTermRental.averageDailyRate * 365 * (shortTermRental.occupancyPercent / 100);
    const airbnbOperatingExpenses = airbnbGross * ((shortTermRental.operatingExpensePercent + shortTermRental.managementFeePercent) / 100);
    airbnbAnnualRent = airbnbGross - airbnbOperatingExpenses - annualServiceCharges;
    airbnbYearsToBreakEven = airbnbAnnualRent > 0 ? totalCapitalInvested / airbnbAnnualRent : 999;
    airbnbYearsToPayOff = airbnbAnnualRent > 0 ? basePrice / airbnbAnnualRent : 999;
  }

  const holdAnalysis: OIHoldAnalysis = {
    totalCapitalInvested,
    propertyValueAtHandover,
    annualRent: initialAnnualRent,
    rentalYieldOnInvestment,
    yearsToBreakEven,
    yearsToPayOff,
    airbnbAnnualRent,
    airbnbYearsToBreakEven,
    airbnbYearsToPayOff,
    annualServiceCharges,
    netAnnualRent,
  };

  return {
    scenarios,
    yearlyProjections,
    totalMonths,
    basePrice,
    holdAnalysis,
    totalEntryCosts,
    showAirbnbComparison,
  };
};
