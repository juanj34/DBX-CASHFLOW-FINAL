import { useMemo } from "react";

export interface MortgageInputs {
  enabled: boolean;
  financingPercent: number;      // Default 60%
  loanTermYears: number;         // Default 25 years
  interestRate: number;          // Default 4.5%
  // Fees
  processingFeePercent: number;  // Default 1%
  valuationFee: number;          // Default 3000 AED
  mortgageRegistrationPercent: number;  // Default 0.25%
  // Insurance
  lifeInsurancePercent: number;  // Default 0.4% annual of loan
  propertyInsurance: number;     // Default 1500 AED/year
}

export const DEFAULT_MORTGAGE_INPUTS: MortgageInputs = {
  enabled: false,
  financingPercent: 60,
  loanTermYears: 25,
  interestRate: 4.5,
  processingFeePercent: 1,
  valuationFee: 3000,
  mortgageRegistrationPercent: 0.25,
  lifeInsurancePercent: 0.4,
  propertyInsurance: 1500,
};

export interface AmortizationPoint {
  year: number;
  balance: number;
  principalPaid: number;
  interestPaid: number;
}

export interface StressScenario {
  rate: number;
  monthlyPayment: number;
  netCashflow: number;
  status: 'positive' | 'tight' | 'negative';
}

export interface MortgageAnalysis {
  // Gap calculation
  equityRequiredPercent: number;  // 100 - financingPercent
  preHandoverPayments: number;    // from inputs.preHandoverPercent
  gapPercent: number;             // equity required - pre-handover (if positive)
  gapAmount: number;              // gap in AED
  hasGap: boolean;                // true if gap > 0
  
  // Loan details
  loanAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalLoanPayments: number;      // principal + interest (all monthly payments)
  
  // Fees summary
  processingFee: number;
  valuationFee: number;
  mortgageRegistration: number;
  totalUpfrontFees: number;
  
  // Insurance
  annualLifeInsurance: number;
  annualPropertyInsurance: number;
  totalAnnualInsurance: number;
  totalInsuranceOverTerm: number;
  
  // Grand totals
  totalCostWithMortgage: number;  // All payments + fees + insurance over term
  totalInterestAndFees: number;   // Total extra cost vs cash purchase
  
  // NEW: DSCR (requires monthly rent to be passed in)
  // Calculated externally when rent data is available
  
  // NEW: Amortization schedule for tenant equity visualization
  amortizationSchedule: AmortizationPoint[];
  principalPaidYear5: number;
  principalPaidYear10: number;
  
  // NEW: Stress test scenarios
  stressScenarios: StressScenario[];
}

interface UseMortgageCalculationsProps {
  mortgageInputs: MortgageInputs;
  basePrice: number;
  preHandoverPercent: number;
  monthlyRent?: number; // For stress test calculations
  monthlyServiceCharges?: number; // For stress test calculations
}

// Helper to calculate monthly payment for any interest rate
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

export const useMortgageCalculations = ({
  mortgageInputs,
  basePrice,
  preHandoverPercent,
  monthlyRent = 0,
  monthlyServiceCharges = 0,
}: UseMortgageCalculationsProps): MortgageAnalysis => {
  return useMemo(() => {
    const {
      financingPercent,
      loanTermYears,
      interestRate,
      processingFeePercent,
      valuationFee,
      mortgageRegistrationPercent,
      lifeInsurancePercent,
      propertyInsurance,
    } = mortgageInputs;

    // Gap calculation
    const equityRequiredPercent = 100 - financingPercent;
    const gapPercent = Math.max(0, equityRequiredPercent - preHandoverPercent);
    const gapAmount = basePrice * gapPercent / 100;
    const hasGap = gapPercent > 0;

    // Loan amount
    const loanAmount = basePrice * financingPercent / 100;

    // Monthly payment calculation
    const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTermYears);
    const numberOfPayments = loanTermYears * 12;
    const totalLoanPayments = monthlyPayment * numberOfPayments;
    const totalInterest = totalLoanPayments - loanAmount;

    // Fees
    const processingFee = loanAmount * processingFeePercent / 100;
    const mortgageRegistration = loanAmount * mortgageRegistrationPercent / 100;
    const totalUpfrontFees = processingFee + valuationFee + mortgageRegistration;

    // Insurance
    const annualLifeInsurance = loanAmount * lifeInsurancePercent / 100;
    const annualPropertyInsurance = propertyInsurance;
    const totalAnnualInsurance = annualLifeInsurance + annualPropertyInsurance;
    const totalInsuranceOverTerm = totalAnnualInsurance * loanTermYears;

    // Grand totals
    const equityPaid = basePrice * equityRequiredPercent / 100;
    const totalCostWithMortgage = equityPaid + totalLoanPayments + totalUpfrontFees + totalInsuranceOverTerm;
    const totalInterestAndFees = totalInterest + totalUpfrontFees + totalInsuranceOverTerm;

    // ===== NEW: Amortization Schedule =====
    const amortizationSchedule: AmortizationPoint[] = [];
    let balance = loanAmount;
    let totalPrincipalPaid = 0;
    let totalInterestPaidSoFar = 0;
    const monthlyRate = interestRate / 100 / 12;
    
    for (let year = 1; year <= loanTermYears; year++) {
      // Calculate 12 months of payments for this year
      for (let month = 1; month <= 12; month++) {
        if (balance <= 0) break;
        const interestPayment = balance * monthlyRate;
        const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
        balance -= principalPayment;
        totalPrincipalPaid += principalPayment;
        totalInterestPaidSoFar += interestPayment;
      }
      
      amortizationSchedule.push({
        year,
        balance: Math.max(0, balance),
        principalPaid: totalPrincipalPaid,
        interestPaid: totalInterestPaidSoFar,
      });
    }

    const principalPaidYear5 = amortizationSchedule[4]?.principalPaid || 0;
    const principalPaidYear10 = amortizationSchedule[9]?.principalPaid || 0;

    // ===== NEW: Stress Test Scenarios =====
    const netMonthlyRent = monthlyRent - monthlyServiceCharges;
    const monthlyInsurance = totalAnnualInsurance / 12;
    
    const stressRates = [interestRate, interestRate + 1, interestRate + 2];
    const stressScenarios: StressScenario[] = stressRates.map(rate => {
      const payment = calculateMonthlyPayment(loanAmount, rate, loanTermYears);
      const totalMonthlyDebt = payment + monthlyInsurance;
      const cashflow = netMonthlyRent - totalMonthlyDebt;
      
      let status: 'positive' | 'tight' | 'negative';
      if (cashflow >= 0) {
        status = 'positive';
      } else if (cashflow >= -totalMonthlyDebt * 0.1) { // Within 10% of breakeven
        status = 'tight';
      } else {
        status = 'negative';
      }
      
      return { rate, monthlyPayment: payment, netCashflow: cashflow, status };
    });

    return {
      equityRequiredPercent,
      preHandoverPayments: preHandoverPercent,
      gapPercent,
      gapAmount,
      hasGap,
      loanAmount,
      monthlyPayment,
      totalInterest,
      totalLoanPayments,
      processingFee,
      valuationFee,
      mortgageRegistration,
      totalUpfrontFees,
      annualLifeInsurance,
      annualPropertyInsurance,
      totalAnnualInsurance,
      totalInsuranceOverTerm,
      totalCostWithMortgage,
      totalInterestAndFees,
      amortizationSchedule,
      principalPaidYear5,
      principalPaidYear10,
      stressScenarios,
    };
  }, [mortgageInputs, basePrice, preHandoverPercent, monthlyRent, monthlyServiceCharges]);
};
