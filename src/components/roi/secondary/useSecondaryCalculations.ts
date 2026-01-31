import { useMemo } from 'react';
import { SecondaryInputs, SecondaryCalculations, SecondaryYearlyProjection } from './types';

// Helper to calculate monthly mortgage payment
const calculateMonthlyPayment = (principal: number, annualRate: number, termYears: number): number => {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  
  if (monthlyRate > 0 && numPayments > 0) {
    const factor = Math.pow(1 + monthlyRate, numPayments);
    return principal * (monthlyRate * factor) / (factor - 1);
  } else if (numPayments > 0) {
    return principal / numPayments;
  }
  return 0;
};

export const useSecondaryCalculations = (inputs: SecondaryInputs): SecondaryCalculations => {
  return useMemo(() => {
    const {
      purchasePrice,
      unitSizeSqf,
      closingCostsPercent,
      rentalYieldPercent,
      rentGrowthRate,
      showAirbnbComparison,
      averageDailyRate,
      occupancyPercent,
      operatingExpensePercent,
      managementFeePercent,
      adrGrowthRate,
      appreciationRate,
      useMortgage,
      mortgageMode,
      mortgageFinancingPercent,
      mortgageFixedAmount,
      mortgageInterestRate,
      mortgageLoanTermYears,
      serviceChargePerSqft,
    } = inputs;

    // === CAPITAL CALCULATIONS ===
    const closingCosts = purchasePrice * closingCostsPercent / 100;
    // Handle both percentage and fixed amount modes
    const loanAmount = useMortgage 
      ? (mortgageMode === 'fixed' 
          ? Math.min(mortgageFixedAmount, purchasePrice * 0.80) // Cap at 80% LTV for fixed
          : purchasePrice * mortgageFinancingPercent / 100)
      : 0;
    const effectiveFinancingPercent = purchasePrice > 0 ? (loanAmount / purchasePrice) * 100 : 0;
    const equityRequired = purchasePrice - loanAmount;
    const totalCapitalDay1 = equityRequired + closingCosts;

    // === LONG-TERM RENTAL (Year 1) ===
    const grossAnnualRentLT = purchasePrice * rentalYieldPercent / 100;
    const serviceCharges = unitSizeSqf * serviceChargePerSqft;
    const netAnnualRentLT = grossAnnualRentLT - serviceCharges;
    const monthlyRentLT = netAnnualRentLT / 12;

    // === SHORT-TERM RENTAL (Year 1) ===
    const daysOccupied = 365 * occupancyPercent / 100;
    const grossAnnualRentST = averageDailyRate * daysOccupied;
    const operatingExpenses = grossAnnualRentST * operatingExpensePercent / 100;
    const managementFees = grossAnnualRentST * managementFeePercent / 100;
    const netAnnualRentST = grossAnnualRentST - operatingExpenses - managementFees - serviceCharges;
    const monthlyRentST = netAnnualRentST / 12;

    // === MORTGAGE ANALYSIS ===
    const monthlyMortgagePayment = useMortgage 
      ? calculateMonthlyPayment(loanAmount, mortgageInterestRate, mortgageLoanTermYears)
      : 0;
    const totalAnnualMortgagePayment = monthlyMortgagePayment * 12;

    // === DSCR ===
    const dscrLongTerm = monthlyMortgagePayment > 0 ? monthlyRentLT / monthlyMortgagePayment : Infinity;
    const dscrAirbnb = monthlyMortgagePayment > 0 ? monthlyRentST / monthlyMortgagePayment : Infinity;

    // === CASHFLOW ===
    const monthlyCashflowLT = monthlyRentLT - monthlyMortgagePayment;
    const monthlyCashflowST = monthlyRentST - monthlyMortgagePayment;

    // === COVERAGE ===
    const coversLongTerm = dscrLongTerm >= 1;
    const coversAirbnb = dscrAirbnb >= 1;

    // === YIELDS ===
    const grossYieldLT = (grossAnnualRentLT / purchasePrice) * 100;
    const netYieldLT = (netAnnualRentLT / purchasePrice) * 100;
    const grossYieldST = (grossAnnualRentST / purchasePrice) * 100;
    const netYieldST = (netAnnualRentST / purchasePrice) * 100;
    
    // Cash on cash = annual cashflow / equity invested
    const annualCashflowLT = monthlyCashflowLT * 12;
    const annualCashflowST = monthlyCashflowST * 12;
    const cashOnCashReturnLT = totalCapitalDay1 > 0 ? (annualCashflowLT / totalCapitalDay1) * 100 : 0;
    const cashOnCashReturnST = totalCapitalDay1 > 0 ? (annualCashflowST / totalCapitalDay1) * 100 : 0;

    // === 10-YEAR PROJECTIONS ===
    const yearlyProjections: SecondaryYearlyProjection[] = [];
    let cumulativeRentLT = 0;
    let cumulativeRentST = 0;
    let mortgageBalance = loanAmount;
    let totalPrincipalPaid = 0;
    const currentYear = new Date().getFullYear();

    for (let year = 1; year <= 10; year++) {
      // Property appreciation: Year 1 = purchase price, Year 2 = +1 year appreciation, etc.
      const propertyValue = purchasePrice * Math.pow(1 + appreciationRate / 100, year - 1);
      
      // Rent growth
      const yearRentLT = grossAnnualRentLT * Math.pow(1 + rentGrowthRate / 100, year - 1);
      const yearServiceCharges = serviceCharges * Math.pow(1.02, year - 1); // 2% inflation
      const netRentLT = yearRentLT - yearServiceCharges;
      
      // Airbnb with ADR growth
      const yearADR = averageDailyRate * Math.pow(1 + adrGrowthRate / 100, year - 1);
      const grossRentST = yearADR * daysOccupied;
      const yearOpEx = grossRentST * operatingExpensePercent / 100;
      const yearMgmt = grossRentST * managementFeePercent / 100;
      const netRentST = grossRentST - yearOpEx - yearMgmt - yearServiceCharges;
      
      // Mortgage amortization for the year
      let yearPrincipal = 0;
      let yearInterest = 0;
      const monthlyRate = mortgageInterestRate / 100 / 12;
      
      if (useMortgage && mortgageBalance > 0) {
        for (let month = 1; month <= 12; month++) {
          if (mortgageBalance <= 0) break;
          const interestPayment = mortgageBalance * monthlyRate;
          const principalPayment = Math.min(monthlyMortgagePayment - interestPayment, mortgageBalance);
          mortgageBalance -= principalPayment;
          yearPrincipal += principalPayment;
          yearInterest += interestPayment;
        }
        totalPrincipalPaid += yearPrincipal;
      }
      
      const annualMortgagePayment = useMortgage ? totalAnnualMortgagePayment : 0;
      const cashflowLT = netRentLT - annualMortgagePayment;
      const cashflowST = netRentST - annualMortgagePayment;
      
      cumulativeRentLT += netRentLT;
      cumulativeRentST += netRentST;
      
      const equityBuildup = propertyValue - Math.max(0, mortgageBalance);
      const totalWealthLT = equityBuildup + cumulativeRentLT - totalCapitalDay1;
      const totalWealthST = equityBuildup + cumulativeRentST - totalCapitalDay1;
      
      yearlyProjections.push({
        year,
        calendarYear: currentYear + year,
        propertyValue,
        annualRentLT: yearRentLT,
        serviceCharges: yearServiceCharges,
        netRentLT,
        cumulativeRentLT,
        grossRentST,
        expensesST: yearOpEx + yearMgmt + yearServiceCharges,
        netRentST,
        cumulativeRentST,
        annualMortgagePayment,
        cashflowLT,
        cashflowST,
        mortgageBalance: Math.max(0, mortgageBalance),
        principalPaid: totalPrincipalPaid,
        equityBuildup,
        totalWealthLT,
        totalWealthST,
      });
    }

    const wealthYear5LT = yearlyProjections[4]?.totalWealthLT || 0;
    const wealthYear5ST = yearlyProjections[4]?.totalWealthST || 0;
    const wealthYear10LT = yearlyProjections[9]?.totalWealthLT || 0;
    const wealthYear10ST = yearlyProjections[9]?.totalWealthST || 0;
    const cumulativeRentLT10Y = yearlyProjections[9]?.cumulativeRentLT || 0;
    const cumulativeRentST10Y = yearlyProjections[9]?.cumulativeRentST || 0;

    return {
      closingCosts,
      equityRequired,
      totalCapitalDay1,
      grossAnnualRentLT,
      serviceCharges,
      netAnnualRentLT,
      monthlyRentLT,
      grossAnnualRentST,
      operatingExpenses,
      managementFees,
      netAnnualRentST,
      monthlyRentST,
      loanAmount,
      monthlyMortgagePayment,
      totalAnnualMortgagePayment,
      dscrLongTerm,
      dscrAirbnb,
      monthlyCashflowLT,
      monthlyCashflowST,
      coversLongTerm,
      coversAirbnb,
      grossYieldLT,
      netYieldLT,
      grossYieldST,
      netYieldST,
      cashOnCashReturnLT,
      cashOnCashReturnST,
      yearlyProjections,
      wealthYear5LT,
      wealthYear5ST,
      wealthYear10LT,
      wealthYear10ST,
      cumulativeRentLT10Y,
      cumulativeRentST10Y,
    };
  }, [inputs]);
};
