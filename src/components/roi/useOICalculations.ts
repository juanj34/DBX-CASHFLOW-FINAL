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
  bookingMonth: number;
  bookingYear: number;
  handoverMonth: number;
  handoverYear: number;
  minimumExitThreshold: number;
  paymentMilestones: PaymentMilestone[];
  // Entry Costs (simplified)
  dldFeePercent: number;
  oqoodFee: number; // Fixed amount
  // Exit Costs (simplified)
  nocFee: number;
}

export interface OIExitScenario {
  exitPercent: number;
  exitMonths: number;
  exitPrice: number;
  equityDeployed: number;
  profit: number;
  roe: number;
  annualizedROE: number;
  profitPerMonth: number;
  amountPaidSoFar: number;
  amountLeftToPay: number;
  installmentsPaid: number;
  installmentsLeft: number;
  entryCosts: number;
  exitCosts: number;
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

// Calculate equity deployed at exit based on flexible milestones
const calculateEquityAtExit = (
  exitPercent: number,
  milestones: PaymentMilestone[],
  totalMonths: number,
  basePrice: number
): { equity: number; installmentsPaid: number } => {
  const exitMonth = (exitPercent / 100) * totalMonths;
  
  let equity = 0;
  let installmentsPaid = 0;
  
  milestones.forEach(m => {
    let triggered = false;
    
    if (m.type === 'time') {
      // Time-based: triggered if we've passed that month
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
  
  return { equity, installmentsPaid };
};

// Count total installments with payments
const countTotalInstallments = (milestones: PaymentMilestone[]): number => {
  return milestones.filter(m => m.paymentPercent > 0).length;
};

export const useOICalculations = (inputs: OIInputs): OICalculations => {
  const { 
    basePrice, 
    rentalYieldPercent, 
    appreciationRate, 
    bookingMonth, 
    bookingYear, 
    handoverMonth, 
    handoverYear, 
    minimumExitThreshold,
    paymentMilestones,
    dldFeePercent,
    oqoodFee,
    nocFee,
  } = inputs;

  // Calculate entry costs (paid at booking)
  const totalEntryCosts = (basePrice * dldFeePercent / 100) + oqoodFee;

  // Calculate total construction period from booking to handover
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const handoverDate = new Date(handoverYear, handoverMonth - 1);
  const totalMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  // Total installments with payments
  const totalInstallments = countTotalInstallments(paymentMilestones);

  // Exit percentages: 10% increments, filtered by minimum threshold
  const allExitPercentages = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const validExitPercentages = allExitPercentages.filter(p => p >= minimumExitThreshold);

  const scenarios: OIExitScenario[] = validExitPercentages.map(exitPercent => {
    const exitMonths = Math.round((exitPercent / 100) * totalMonths);
    const exitYears = exitMonths / 12;

    // Property value at exit (appreciated)
    const exitPrice = basePrice * Math.pow(1 + appreciationRate / 100, exitYears);

    // Equity deployed using flexible milestone calculation
    const { equity: equityDeployed, installmentsPaid } = calculateEquityAtExit(
      exitPercent, 
      paymentMilestones, 
      totalMonths, 
      basePrice
    );

    // Payment status
    const amountPaidSoFar = equityDeployed;
    const amountLeftToPay = basePrice - equityDeployed;
    const installmentsLeft = totalInstallments - installmentsPaid;

    // Entry costs (already paid)
    const entryCosts = totalEntryCosts;

    // Exit costs (simplified - only NOC fee)
    const exitCosts = nocFee;

    // Profit is appreciation
    const profit = exitPrice - basePrice;

    // True profit after all costs
    const trueProfit = profit - entryCosts - exitCosts;

    // Total capital deployed = equity + entry costs
    const totalCapitalDeployed = equityDeployed + entryCosts;

    // ROE based on equity actually deployed
    const roe = equityDeployed > 0 ? (profit / equityDeployed) * 100 : 0;

    // True ROE based on total capital deployed
    const trueROE = totalCapitalDeployed > 0 ? (trueProfit / totalCapitalDeployed) * 100 : 0;

    // Annualized ROE
    const yearsHeld = exitMonths / 12;
    const annualizedROE = yearsHeld > 0 ? roe / yearsHeld : 0;

    // Profit per month
    const profitPerMonth = exitMonths > 0 ? profit / exitMonths : 0;

    return {
      exitPercent,
      exitMonths,
      exitPrice,
      equityDeployed,
      profit,
      roe,
      annualizedROE,
      profitPerMonth,
      amountPaidSoFar,
      amountLeftToPay,
      installmentsPaid,
      installmentsLeft,
      entryCosts,
      exitCosts,
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
