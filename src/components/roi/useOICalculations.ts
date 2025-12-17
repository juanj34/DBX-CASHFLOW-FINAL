export interface PaymentMilestone {
  id: string;
  type: 'time' | 'construction';
  triggerValue: number; // months if time, % if construction
  paymentPercent: number;
  label?: string;
}

export interface OIInputs {
  basePrice: number;
  rentalYieldPercent: number;
  appreciationRate: number;
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
}

export interface OIYearlyProjection {
  year: number;
  calendarYear: number;
  propertyValue: number;
  annualRent: number | null;
  isConstruction: boolean;
  isHandover: boolean;
}

export interface OICalculations {
  scenarios: OIExitScenario[];
  yearlyProjections: OIYearlyProjection[];
  totalMonths: number;
  basePrice: number;
  holdAnalysis: OIHoldAnalysis;
  totalEntryCosts: number;
}

// DLD Fee is always 4%
const DLD_FEE_PERCENT = 4;

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
    appreciationRate, 
    bookingMonth, 
    bookingYear, 
    handoverQuarter, 
    handoverYear, 
    oqoodFee,
    eoiFee,
  } = inputs;

  // Calculate entry costs (paid at booking) - DLD fixed at 4%
  const dldFeeAmount = basePrice * DLD_FEE_PERCENT / 100;
  const totalEntryCosts = dldFeeAmount + oqoodFee;

  // Convert handover quarter to month for calculations
  const handoverMonth = quarterToMonth(handoverQuarter);

  // Calculate total construction period from booking to handover
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const handoverDate = new Date(handoverYear, handoverMonth - 1);
  const totalMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

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

    // Property value at exit (appreciated)
    const exitPrice = basePrice * Math.pow(1 + appreciationRate / 100, exitYears);

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

  // Calculate 10-year projections from booking year
  const handoverYearIndex = Math.ceil(totalMonths / 12);
  
  const yearlyProjections: OIYearlyProjection[] = [];
  for (let i = 1; i <= 10; i++) {
    const calendarYear = bookingYear + i - 1;
    const propertyValue = basePrice * Math.pow(1 + appreciationRate / 100, i);
    const isConstruction = i < handoverYearIndex;
    const annualRent = isConstruction ? null : propertyValue * (rentalYieldPercent / 100);
    
    yearlyProjections.push({
      year: i,
      calendarYear,
      propertyValue,
      annualRent,
      isConstruction,
      isHandover: i === handoverYearIndex,
    });
  }

  // Hold Analysis
  const handoverYears = totalMonths / 12;
  const propertyValueAtHandover = basePrice * Math.pow(1 + appreciationRate / 100, handoverYears);
  const totalCapitalInvested = basePrice + totalEntryCosts;
  const annualRent = propertyValueAtHandover * (rentalYieldPercent / 100);
  const rentalYieldOnInvestment = (annualRent / totalCapitalInvested) * 100;
  const yearsToBreakEven = totalCapitalInvested / annualRent;

  const holdAnalysis: OIHoldAnalysis = {
    totalCapitalInvested,
    propertyValueAtHandover,
    annualRent,
    rentalYieldOnInvestment,
    yearsToBreakEven,
  };

  return {
    scenarios,
    yearlyProjections,
    totalMonths,
    basePrice,
    holdAnalysis,
    totalEntryCosts,
  };
};
