export interface ROIInputs {
  basePrice: number;
  rentalYieldPercent: number;
  appreciationRate: number;
  bookingMonth: number;      // 1-12
  bookingYear: number;       // e.g., 2025
  handoverMonth: number;     // 1-12
  handoverYear: number;      // e.g., 2027
  resaleThresholdPercent: number;
  siHoldingMonths: number;
}

export interface InvestorMetrics {
  entryPrice: number;
  exitPrice: number;
  propertyValue: number;
  equityInvested: number;
  projectedProfit: number;
  roe: number;
  rentalYield: number;
  yearsToPay: number;
}

export interface YearlyProjection {
  year: number;
  calendarYear: number;
  propertyValue: number;
  annualRent: number | null;
  isConstruction: boolean;
  isHandover: boolean;
  isSIExit: boolean;
}

export interface ROICalculations {
  oi: InvestorMetrics;
  si: InvestorMetrics;
  ho: InvestorMetrics;
  yearlyProjections: YearlyProjection[];
  holdingPeriodMonths: number;
}

export const useROICalculations = (inputs: ROIInputs): ROICalculations => {
  const { basePrice, rentalYieldPercent, appreciationRate, bookingMonth, bookingYear, handoverMonth, handoverYear, resaleThresholdPercent, siHoldingMonths } = inputs;

  // Calculate holding period from dates
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const handoverDate = new Date(handoverYear, handoverMonth - 1);
  const holdingPeriodMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const holdingYears = holdingPeriodMonths / 12;

  // OI (Opportunity Investor) - Buys off-plan early
  const oiEntryPrice = basePrice;
  const oiEquity = basePrice * (resaleThresholdPercent / 100);
  const oiExitPrice = basePrice * Math.pow(1 + appreciationRate / 100, holdingYears);
  const oiProfit = oiExitPrice - oiEntryPrice;
  const oiROE = (oiProfit / oiEquity) * 100;
  
  // OI rental yield: rent at handover / OI entry price (higher yield due to buying early!)
  const rentAtHandover = oiExitPrice * (rentalYieldPercent / 100);
  const oiRentalYield = (rentAtHandover / oiEntryPrice) * 100;
  const oiYearsToPay = oiEntryPrice / rentAtHandover;

  // SI (Security Investor) - Buys from OI at handover
  const siEntryPrice = oiExitPrice;
  const siEquity = siEntryPrice; // 100% cash
  const siHoldingYears = siHoldingMonths / 12;
  const siExitPrice = siEntryPrice * Math.pow(1 + appreciationRate / 100, siHoldingYears);
  const siProfit = siExitPrice - siEntryPrice;
  const siROE = (siProfit / siEquity) * 100;
  
  // SI rental yield: rent at SI entry / SI entry price (market rate)
  const siAnnualRent = siEntryPrice * (rentalYieldPercent / 100);
  const siRentalYield = rentalYieldPercent; // Market rate
  const siYearsToPay = siEntryPrice / siAnnualRent;

  // HO (Home Owner) - End user buying from SI
  const hoEntryPrice = siExitPrice;
  const hoEquity = hoEntryPrice;
  const hoExitPrice = hoEntryPrice; // Not selling
  const hoProfit = 0;
  const hoROE = 0;
  
  // HO rental yield: rent at HO entry / HO entry price (market rate)
  const hoAnnualRent = hoEntryPrice * (rentalYieldPercent / 100);
  const hoRentalYield = rentalYieldPercent; // Market rate
  const hoYearsToPay = hoEntryPrice / hoAnnualRent;

  // Calculate 10-year projections from booking year
  const handoverYearIndex = Math.ceil(holdingPeriodMonths / 12);
  const siExitYearIndex = handoverYearIndex + Math.ceil(siHoldingMonths / 12);
  
  const yearlyProjections: YearlyProjection[] = [];
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
      isSIExit: i === siExitYearIndex,
    });
  }

  return {
    oi: {
      entryPrice: oiEntryPrice,
      exitPrice: oiExitPrice,
      propertyValue: oiExitPrice,
      equityInvested: oiEquity,
      projectedProfit: oiProfit,
      roe: oiROE,
      rentalYield: oiRentalYield,
      yearsToPay: oiYearsToPay,
    },
    si: {
      entryPrice: siEntryPrice,
      exitPrice: siExitPrice,
      propertyValue: siExitPrice,
      equityInvested: siEquity,
      projectedProfit: siProfit,
      roe: siROE,
      rentalYield: siRentalYield,
      yearsToPay: siYearsToPay,
    },
    ho: {
      entryPrice: hoEntryPrice,
      exitPrice: hoExitPrice,
      propertyValue: hoEntryPrice,
      equityInvested: hoEquity,
      projectedProfit: hoProfit,
      roe: hoROE,
      rentalYield: hoRentalYield,
      yearsToPay: hoYearsToPay,
    },
    yearlyProjections,
    holdingPeriodMonths,
  };
};
