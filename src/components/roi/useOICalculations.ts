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
  minimumExitThreshold: number; // % construction when developer allows resale
  paymentMilestones: PaymentMilestone[];
}

export interface OIExitScenario {
  exitPercent: number;       // 10%, 20%, ..., 100%
  exitMonths: number;        // Months held from booking
  exitPrice: number;         // Property value at exit
  equityDeployed: number;    // Based on cumulative milestone payments
  profit: number;            // Exit price - Entry price
  roe: number;               // Profit / Equity * 100
  annualizedROE: number;     // ROE / years held
  profitPerMonth: number;    // Profit / months held
}

export interface OIHoldAnalysis {
  totalCapitalInvested: number;  // 100% of base price
  propertyValueAtHandover: number;
  annualRent: number;
  rentalYieldOnInvestment: number; // rent / capital invested * 100
  yearsToBreakEven: number;  // capital / annual rent
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
    paymentMilestones
  } = inputs;

  // Calculate total construction period from booking to handover
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const handoverDate = new Date(handoverYear, handoverMonth - 1);
  const totalMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

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

    // Profit is appreciation
    const profit = exitPrice - basePrice;

    // ROE based on equity actually deployed
    const roe = equityDeployed > 0 ? (profit / equityDeployed) * 100 : 0;

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
  const totalCapitalInvested = basePrice; // 100% paid at handover
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
  };
};
