export interface OIInputs {
  basePrice: number;
  rentalYieldPercent: number;
  appreciationRate: number;
  bookingMonth: number;
  bookingYear: number;
  handoverMonth: number;
  handoverYear: number;
  paymentPlanPercent: number; // What OI pays by handover (e.g., 30 for 30/70)
}

export interface OIExitScenario {
  exitPercent: number;       // 50%, 60%, 70%, 80%, 90%, 100%
  exitMonths: number;        // Months held from booking
  exitPrice: number;         // Property value at exit
  equityDeployed: number;    // Based on payment plan progression
  profit: number;            // Exit price - Entry price
  roe: number;               // Profit / Equity * 100
  rentalYield: number;       // Rent at exit / Entry price
  yearsToPay: number;        // Entry price / Annual rent
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
}

export const useOICalculations = (inputs: OIInputs): OICalculations => {
  const { 
    basePrice, 
    rentalYieldPercent, 
    appreciationRate, 
    bookingMonth, 
    bookingYear, 
    handoverMonth, 
    handoverYear, 
    paymentPlanPercent 
  } = inputs;

  // Calculate total construction period from booking to handover
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const handoverDate = new Date(handoverYear, handoverMonth - 1);
  const totalMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  // Exit percentages to calculate
  const exitPercentages = [50, 60, 70, 80, 90, 100];

  const scenarios: OIExitScenario[] = exitPercentages.map(exitPercent => {
    // Months held at this exit point
    const exitMonths = Math.round((exitPercent / 100) * totalMonths);
    const exitYears = exitMonths / 12;

    // Property value at exit (appreciated)
    const exitPrice = basePrice * Math.pow(1 + appreciationRate / 100, exitYears);

    // Equity deployed: proportional to how much of the payment plan is done
    // If exitPercent is 50% of construction, OI has paid 50% of the paymentPlanPercent
    // e.g., 30/70 plan at 50% construction = 15% of base price paid
    const paymentProgress = exitPercent / 100;
    const equityDeployed = basePrice * (paymentPlanPercent / 100) * paymentProgress;

    // Profit is appreciation
    const profit = exitPrice - basePrice;

    // ROE based on equity actually deployed
    const roe = equityDeployed > 0 ? (profit / equityDeployed) * 100 : 0;

    // Rental yield based on rent at exit time relative to base price
    const rentAtExit = exitPrice * (rentalYieldPercent / 100);
    const rentalYield = (rentAtExit / basePrice) * 100;
    const yearsToPay = basePrice / rentAtExit;

    return {
      exitPercent,
      exitMonths,
      exitPrice,
      equityDeployed,
      profit,
      roe,
      rentalYield,
      yearsToPay,
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

  return {
    scenarios,
    yearlyProjections,
    totalMonths,
    basePrice,
  };
};
