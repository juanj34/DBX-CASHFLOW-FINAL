export interface PaymentMilestone {
  constructionPercent: number; // 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
  paymentPercent: number;      // % of base price due at this milestone
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
  // Entry Costs
  dldFeePercent: number;        // DLD Registration Fee (4%)
  oqoodFeePercent: number;      // Oqood Fee (4%)
  adminFee: number;             // Fixed admin fee in AED
  buyerAgentPercent: number;    // Buyer agent commission (optional)
  // Exit Costs
  nocFee: number;               // NOC Fee (fixed amount)
  transferFeePercent: number;   // Transfer fee on resale
  sellerAgentPercent: number;   // Seller agent commission
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
  // Payment status
  amountPaidSoFar: number;
  amountLeftToPay: number;
  installmentsPaid: number;
  installmentsLeft: number;
  // Costs
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

// Calculate cumulative equity deployed at a given construction percentage
const calculateEquityAtExit = (
  exitPercent: number,
  milestones: PaymentMilestone[],
  basePrice: number
): number => {
  return milestones
    .filter(m => m.constructionPercent <= exitPercent)
    .reduce((sum, m) => sum + (basePrice * m.paymentPercent / 100), 0);
};

// Count installments paid up to a given exit percentage
const countInstallmentsPaid = (
  exitPercent: number,
  milestones: PaymentMilestone[]
): number => {
  return milestones.filter(m => m.constructionPercent <= exitPercent && m.paymentPercent > 0).length;
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
    oqoodFeePercent,
    adminFee,
    buyerAgentPercent,
    nocFee,
    transferFeePercent,
    sellerAgentPercent,
  } = inputs;

  // Calculate entry costs (paid at booking)
  const totalEntryCosts = 
    (basePrice * dldFeePercent / 100) +
    (basePrice * oqoodFeePercent / 100) +
    adminFee +
    (basePrice * buyerAgentPercent / 100);

  // Calculate total construction period from booking to handover
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const handoverDate = new Date(handoverYear, handoverMonth - 1);
  const totalMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  // Total installments with payments
  const totalInstallments = paymentMilestones.filter(m => m.paymentPercent > 0).length;

  // Exit percentages: 10% increments, filtered by minimum threshold
  const allExitPercentages = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const validExitPercentages = allExitPercentages.filter(p => p >= minimumExitThreshold);

  const scenarios: OIExitScenario[] = validExitPercentages.map(exitPercent => {
    // Months held at this exit point
    const exitMonths = Math.round((exitPercent / 100) * totalMonths);
    const exitYears = exitMonths / 12;

    // Property value at exit (appreciated)
    const exitPrice = basePrice * Math.pow(1 + appreciationRate / 100, exitYears);

    // Equity deployed: cumulative milestone payments up to this point
    const equityDeployed = calculateEquityAtExit(exitPercent, paymentMilestones, basePrice);

    // Payment status
    const amountPaidSoFar = equityDeployed;
    const amountLeftToPay = basePrice - equityDeployed;
    const installmentsPaid = countInstallmentsPaid(exitPercent, paymentMilestones);
    const installmentsLeft = totalInstallments - installmentsPaid;

    // Entry costs (already paid)
    const entryCosts = totalEntryCosts;

    // Exit costs (paid when selling)
    const exitCosts = 
      nocFee +
      (exitPrice * transferFeePercent / 100) +
      (exitPrice * sellerAgentPercent / 100);

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

    // Annualized ROE = ROE / years held
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

  // Hold Analysis - if investor keeps the property after handover
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
