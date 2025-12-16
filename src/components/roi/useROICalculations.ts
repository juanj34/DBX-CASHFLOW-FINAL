export interface ROIInputs {
  basePrice: number;
  rentalYieldPercent: number;
  appreciationRate: number;
  holdingPeriodMonths: number;
  resaleThresholdPercent: number; // This IS the OI equity deployed
  siHoldingMonths: number;
}

export interface InvestorMetrics {
  propertyValue: number;
  equityInvested: number;
  projectedProfit: number;
  roe: number;
  rentalYield: number;
  yearsToPay: number;
}

export interface YearlyProjection {
  year: number;
  propertyValue: number;
  annualRent: number;
  isHandover: boolean;
  isSIExit: boolean;
}

export interface ROICalculations {
  oi: InvestorMetrics;
  si: InvestorMetrics;
  ho: InvestorMetrics;
  yearlyProjections: YearlyProjection[];
}

export const useROICalculations = (inputs: ROIInputs): ROICalculations => {
  const { basePrice, rentalYieldPercent, appreciationRate, holdingPeriodMonths, resaleThresholdPercent, siHoldingMonths } = inputs;

  // OI (Opportunity Investor) - Buys off-plan early
  const oiEntryPrice = basePrice;
  const oiEquity = basePrice * (resaleThresholdPercent / 100); // Equity = resale threshold
  const holdingYears = holdingPeriodMonths / 12;
  const oiExitPrice = basePrice * Math.pow(1 + appreciationRate / 100, holdingYears);
  const oiProfit = oiExitPrice - oiEntryPrice;
  const oiROE = (oiProfit / oiEquity) * 100;
  const oiAnnualRent = oiEntryPrice * (rentalYieldPercent / 100);
  const oiRentalYield = rentalYieldPercent; // Same as input since rent is % of value
  const oiYearsToPay = oiEntryPrice / oiAnnualRent;

  // SI (Security Investor) - Buys from OI
  const siEntryPrice = oiExitPrice;
  const siEquity = siEntryPrice; // 100% cash
  const siHoldingYears = siHoldingMonths / 12;
  const siExitPrice = siEntryPrice * Math.pow(1 + appreciationRate / 100, siHoldingYears);
  const siProfit = siExitPrice - siEntryPrice;
  const siROE = (siProfit / siEquity) * 100;
  const siAnnualRent = siEntryPrice * (rentalYieldPercent / 100);
  const siRentalYield = rentalYieldPercent;
  const siYearsToPay = siEntryPrice / siAnnualRent;

  // HO (Home Owner) - End user buying later
  const hoEntryPrice = siExitPrice;
  const hoEquity = hoEntryPrice;
  const hoProfit = 0; // Not selling
  const hoROE = 0;
  const hoAnnualRent = hoEntryPrice * (rentalYieldPercent / 100);
  const hoRentalYield = rentalYieldPercent;
  const hoYearsToPay = hoEntryPrice / hoAnnualRent;

  // Calculate 10-year projections
  const handoverYear = Math.ceil(holdingPeriodMonths / 12);
  const siExitYear = handoverYear + Math.ceil(siHoldingMonths / 12);
  
  const yearlyProjections: YearlyProjection[] = [];
  for (let year = 1; year <= 10; year++) {
    const propertyValue = basePrice * Math.pow(1 + appreciationRate / 100, year);
    const annualRent = propertyValue * (rentalYieldPercent / 100); // Rent is % of current value
    yearlyProjections.push({
      year,
      propertyValue,
      annualRent,
      isHandover: year === handoverYear,
      isSIExit: year === siExitYear,
    });
  }

  return {
    oi: {
      propertyValue: oiExitPrice,
      equityInvested: oiEquity,
      projectedProfit: oiProfit,
      roe: oiROE,
      rentalYield: oiRentalYield,
      yearsToPay: oiYearsToPay,
    },
    si: {
      propertyValue: siExitPrice,
      equityInvested: siEquity,
      projectedProfit: siProfit,
      roe: siROE,
      rentalYield: siRentalYield,
      yearsToPay: siYearsToPay,
    },
    ho: {
      propertyValue: hoEntryPrice,
      equityInvested: hoEquity,
      projectedProfit: hoProfit,
      roe: hoROE,
      rentalYield: hoRentalYield,
      yearsToPay: hoYearsToPay,
    },
    yearlyProjections,
  };
};
