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
}

interface UseMortgageCalculationsProps {
  mortgageInputs: MortgageInputs;
  basePrice: number;
  preHandoverPercent: number;
}

export const useMortgageCalculations = ({
  mortgageInputs,
  basePrice,
  preHandoverPercent,
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
    // If plan is 30/70 and mortgage is 60%, equity required = 40%
    // Gap = 40% - 30% (pre-handover) = 10%
    const equityRequiredPercent = 100 - financingPercent;
    const gapPercent = Math.max(0, equityRequiredPercent - preHandoverPercent);
    const gapAmount = basePrice * gapPercent / 100;
    const hasGap = gapPercent > 0;

    // Loan amount
    const loanAmount = basePrice * financingPercent / 100;

    // Monthly payment calculation using French amortization formula
    // M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTermYears * 12;
    
    let monthlyPayment = 0;
    if (monthlyInterestRate > 0 && numberOfPayments > 0) {
      const factor = Math.pow(1 + monthlyInterestRate, numberOfPayments);
      monthlyPayment = loanAmount * (monthlyInterestRate * factor) / (factor - 1);
    } else if (numberOfPayments > 0) {
      monthlyPayment = loanAmount / numberOfPayments;
    }

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
    // Total paid = equity (100% - financing%) + loan payments + fees + insurance
    const equityPaid = basePrice * equityRequiredPercent / 100;
    const totalCostWithMortgage = equityPaid + totalLoanPayments + totalUpfrontFees + totalInsuranceOverTerm;
    const totalInterestAndFees = totalInterest + totalUpfrontFees + totalInsuranceOverTerm;

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
      valuationFee: valuationFee,
      mortgageRegistration,
      totalUpfrontFees,
      annualLifeInsurance,
      annualPropertyInsurance,
      totalAnnualInsurance,
      totalInsuranceOverTerm,
      totalCostWithMortgage,
      totalInterestAndFees,
    };
  }, [mortgageInputs, basePrice, preHandoverPercent]);
};
