export interface ROIInputs {
  basePrice: number;
  rentalYieldPercent: number;
  equityPercent: number;
  appreciationRate: number;
  holdingPeriodMonths: number;
  resaleThresholdPercent: number;
  siHoldingYears: number;
}

export interface InvestorMetrics {
  propertyValue: number;
  equityInvested: number;
  projectedProfit: number;
  roe: number;
  rentalYield: number;
  yearsToPay: number;
}

export interface ROICalculations {
  oi: InvestorMetrics;
  si: InvestorMetrics;
  ho: InvestorMetrics;
}

export const useROICalculations = (inputs: ROIInputs): ROICalculations => {
  const { basePrice, rentalYieldPercent, equityPercent, appreciationRate, holdingPeriodMonths, siHoldingYears } = inputs;

  // Calculate annual rent from rental yield percentage
  const annualRent = basePrice * (rentalYieldPercent / 100);

  // OI (Opportunity Investor) - Buys off-plan early
  const oiEntryPrice = basePrice;
  const oiEquity = basePrice * (equityPercent / 100);
  const holdingYears = holdingPeriodMonths / 12;
  const oiExitPrice = basePrice * Math.pow(1 + appreciationRate / 100, holdingYears);
  const oiProfit = oiExitPrice - oiEntryPrice;
  const oiROE = (oiProfit / oiEquity) * 100;
  const oiRentalYield = (annualRent / oiEntryPrice) * 100;
  const oiYearsToPay = oiEntryPrice / annualRent;

  // SI (Security Investor) - Buys from OI
  const siEntryPrice = oiExitPrice;
  const siEquity = siEntryPrice; // 100% cash
  const siExitPrice = siEntryPrice * Math.pow(1 + appreciationRate / 100, siHoldingYears);
  const siProfit = siExitPrice - siEntryPrice;
  const siROE = (siProfit / siEquity) * 100;
  const siRentalYield = (annualRent / siEntryPrice) * 100;
  const siYearsToPay = siEntryPrice / annualRent;

  // HO (Home Owner) - End user buying later
  const hoEntryPrice = siExitPrice;
  const hoEquity = hoEntryPrice;
  const hoProfit = 0; // Not selling
  const hoROE = 0;
  const hoRentalYield = (annualRent / hoEntryPrice) * 100;
  const hoYearsToPay = hoEntryPrice / annualRent;

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
  };
};
