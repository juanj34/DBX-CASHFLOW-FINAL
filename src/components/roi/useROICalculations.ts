export interface ROIInputs {
  basePrice: number;
  rentalYieldPercent: number;
  appreciationRate: number;
  bookingMonth: number;
  bookingYear: number;
  handoverMonth: number;
  handoverYear: number;
  resaleThresholdPercent: number;
  oiHoldingMonths: number; // How long OI holds before selling to SI
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
  oiHoldingMonths: number;
  siHoldingMonths: number;
  totalMonths: number;
}

export const useROICalculations = (inputs: ROIInputs): ROICalculations => {
  const { basePrice, rentalYieldPercent, appreciationRate, bookingMonth, bookingYear, handoverMonth, handoverYear, resaleThresholdPercent, oiHoldingMonths } = inputs;

  // Calculate total investment period from booking to handover
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const handoverDate = new Date(handoverYear, handoverMonth - 1);
  const totalMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  
  // SI holds from OI exit to handover
  const siHoldingMonths = Math.max(1, totalMonths - oiHoldingMonths);

  const oiHoldingYears = oiHoldingMonths / 12;
  const siHoldingYears = siHoldingMonths / 12;

  // OI (Opportunity Investor) - Buys off-plan early
  const oiEntryPrice = basePrice;
  const oiEquity = basePrice * (resaleThresholdPercent / 100);
  const oiExitPrice = basePrice * Math.pow(1 + appreciationRate / 100, oiHoldingYears);
  const oiProfit = oiExitPrice - oiEntryPrice;
  const oiROE = (oiProfit / oiEquity) * 100;
  
  // OI rental yield: rent at exit / OI entry price
  const rentAtOIExit = oiExitPrice * (rentalYieldPercent / 100);
  const oiRentalYield = (rentAtOIExit / oiEntryPrice) * 100;
  const oiYearsToPay = oiEntryPrice / rentAtOIExit;

  // SI (Security Investor) - Buys from OI
  const siEntryPrice = oiExitPrice;
  const siEquity = siEntryPrice; // 100% cash
  const siExitPrice = siEntryPrice * Math.pow(1 + appreciationRate / 100, siHoldingYears);
  const siProfit = siExitPrice - siEntryPrice;
  const siROE = (siProfit / siEquity) * 100;
  
  // SI rental yield: market rate
  const siAnnualRent = siEntryPrice * (rentalYieldPercent / 100);
  const siRentalYield = rentalYieldPercent;
  const siYearsToPay = siEntryPrice / siAnnualRent;

  // HO (Home Owner) - End user buying at handover
  const hoEntryPrice = siExitPrice;
  const hoEquity = hoEntryPrice;
  const hoExitPrice = hoEntryPrice;
  const hoProfit = 0;
  const hoROE = 0;
  
  const hoAnnualRent = hoEntryPrice * (rentalYieldPercent / 100);
  const hoRentalYield = rentalYieldPercent;
  const hoYearsToPay = hoEntryPrice / hoAnnualRent;

  // Calculate 10-year projections from booking year
  const oiExitYearIndex = Math.ceil(oiHoldingMonths / 12);
  const siExitYearIndex = Math.ceil(totalMonths / 12);
  
  const yearlyProjections: YearlyProjection[] = [];
  for (let i = 1; i <= 10; i++) {
    const calendarYear = bookingYear + i - 1;
    const propertyValue = basePrice * Math.pow(1 + appreciationRate / 100, i);
    const isConstruction = i < oiExitYearIndex;
    const annualRent = isConstruction ? null : propertyValue * (rentalYieldPercent / 100);
    
    yearlyProjections.push({
      year: i,
      calendarYear,
      propertyValue,
      annualRent,
      isConstruction,
      isHandover: i === oiExitYearIndex,
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
    oiHoldingMonths,
    siHoldingMonths,
    totalMonths,
  };
};
