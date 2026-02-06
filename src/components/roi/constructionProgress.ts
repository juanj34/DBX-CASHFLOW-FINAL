/**
 * Dubai Construction Progress S-Curve Utility
 * 
 * Construction progress is NOT linear. In Dubai:
 * - 20% construction must be completed before escrow sales begin
 * - Early phases (foundations, structure) take longer per % point
 * - Middle phases (main construction) are fastest
 * - Final phases (finishing, handover prep) slow down again
 * 
 * This creates an S-curve relationship between timeline and construction progress.
 */

import { OIInputs, PaymentMilestone } from "./useOICalculations";

/**
 * Inputs required for exit price calculation
 */
export interface ExitPriceInputs {
  constructionAppreciation?: number;
  growthAppreciation?: number;
  matureAppreciation?: number;
  growthPeriodYears?: number;
  entryCosts?: number;
}

/**
 * CALIBRACIÓN DUBAI - Torres 30-40 pisos (36 meses estándar)
 * 
 * Fase Lenta (0-9 meses): Cimientos y Podio
 *   - Excavación, pilotaje, shoring, impermeabilización
 *   - Mes 9 → 15-18% construcción
 * 
 * Fase Rápida (10-24 meses): Superestructura  
 *   - Un piso cada 1-2 semanas
 *   - Mes 15 → ~35% (inicio superestructura)
 *   - Mes 18 → 35-40% (terminando podio) ← CRÍTICO
 *   - Mes 21 → 50% (HITO CLAVE - media altura)
 *   - Mes 24 → 65-70% (topping out cercano)
 * 
 * Fase Final (25-36 meses): Acabados y MEP
 *   - Fachada, instalaciones eléctricas/agua, interiores
 *   - Mes 32 → ~90%
 *   - Mes 36 → 100% (handover)
 */

/**
 * Convert timeline percentage to construction progress percentage
 * Calibrated to real Dubai construction S-curve patterns
 */
export const timelineToConstruction = (timelinePercent: number): number => {
  if (timelinePercent <= 0) return 0;
  if (timelinePercent >= 100) return 100;
  
  // Piecewise linear approximation calibrated to Dubai reality
  // timeline% -> construction%
  const segments: [number, number][] = [
    [0, 0],       // Start
    [25, 18],     // Mes 9 = 18% (fin cimientos) - Fase Lenta
    [42, 35],     // Mes 15 = 35% (inicio superestructura)
    [50, 40],     // Mes 18 = 40% (terminando podio) ← CRÍTICO
    [58, 50],     // Mes 21 = 50% (media altura) ← HITO 50%
    [67, 65],     // Mes 24 = 65% (topping out cercano)
    [75, 75],     // Mes 27 = 75% (inicio acabados)
    [89, 90],     // Mes 32 = 90% (MEP/interiores)
    [100, 100],   // Handover
  ];
  
  // Find the segment we're in and interpolate
  for (let i = 1; i < segments.length; i++) {
    const [prevTime, prevConst] = segments[i - 1];
    const [currTime, currConst] = segments[i];
    
    if (timelinePercent <= currTime) {
      const segmentProgress = (timelinePercent - prevTime) / (currTime - prevTime);
      return prevConst + segmentProgress * (currConst - prevConst);
    }
  }
  
  return 100;
};

/**
 * Convert construction progress percentage to timeline percentage
 * Inverse of timelineToConstruction - calibrated to Dubai S-curve
 */
export const constructionToTimeline = (constructionPercent: number): number => {
  if (constructionPercent <= 0) return 0;
  if (constructionPercent >= 100) return 100;
  
  // Inverse of timelineToConstruction segments
  // construction% -> timeline%
  const segments: [number, number][] = [
    [0, 0],       // Start
    [18, 25],     // 18% construction = 25% timeline (Mes 9)
    [35, 42],     // 35% construction = 42% timeline (Mes 15)
    [40, 50],     // 40% construction = 50% timeline (Mes 18)
    [50, 58],     // 50% construction = 58% timeline (Mes 21) ← HITO
    [65, 67],     // 65% construction = 67% timeline (Mes 24)
    [75, 75],     // 75% construction = 75% timeline (Mes 27)
    [90, 89],     // 90% construction = 89% timeline (Mes 32)
    [100, 100],   // End
  ];
  
  for (let i = 1; i < segments.length; i++) {
    const [prevConst, prevTime] = segments[i - 1];
    const [currConst, currTime] = segments[i];
    
    if (constructionPercent <= currConst) {
      const segmentProgress = (constructionPercent - prevConst) / (currConst - prevConst);
      return prevTime + segmentProgress * (currTime - prevTime);
    }
  }
  
  return 100;
};

/**
 * Convert construction percentage to estimated month
 */
export const constructionToMonth = (constructionPercent: number, totalMonths: number): number => {
  const timelinePercent = constructionToTimeline(constructionPercent);
  return Math.round((timelinePercent / 100) * totalMonths);
};

/**
 * Convert month to construction percentage
 */
export const monthToConstruction = (month: number, totalMonths: number): number => {
  const timelinePercent = (month / totalMonths) * 100;
  return timelineToConstruction(timelinePercent);
};

/**
 * Check if an exit scenario is at the handover date
 * Returns true if within 1 month tolerance of handover
 */
export const isHandoverExit = (
  exitMonths: number, 
  totalMonths: number
): boolean => {
  return Math.abs(exitMonths - totalMonths) <= 1;
};

/**
 * Result of calculating equity at exit with threshold consideration
 */
export interface EquityAtExitResult {
  /** Equity paid according to payment plan at this exit point */
  planEquity: number;
  /** Equity required by minimum threshold for NOC */
  thresholdEquity: number;
  /** Final equity deployed (max of plan vs threshold) */
  finalEquity: number;
  /** Additional payment required to meet threshold (0 if already met) */
  advanceRequired: number;
  /** Payments that need to be advanced (with amounts) */
  advancedPayments: {
    milestone: PaymentMilestone;
    monthTriggered: number; // When it would normally be triggered
    amountAdvanced: number;
  }[];
  /** Whether threshold is naturally met by payment plan */
  isThresholdMet: boolean;
  /** Percent of property paid at exit */
  planEquityPercent: number;
}

/**
 * Calculate equity deployed at exit with full breakdown
 * Uses S-curve for construction-based payment triggers
 * Now supports post-handover payment plans
 */
export const calculateEquityAtExitWithDetails = (
  exitMonths: number,
  inputs: OIInputs,
  totalMonths: number,
  basePrice: number
): EquityAtExitResult => {
  const isPostHandover = exitMonths > totalMonths;
  const monthsAfterHandover = isPostHandover ? exitMonths - totalMonths : 0;
  
  const exitTimelinePercent = Math.min(100, (exitMonths / totalMonths) * 100);
  const exitConstructionPercent = isPostHandover ? 100 : timelineToConstruction(exitTimelinePercent);
  
  let planEquity = 0;
  const advancedPayments: EquityAtExitResult['advancedPayments'] = [];
  
  // 1. Downpayment - always paid at month 0
  planEquity += basePrice * inputs.downpaymentPercent / 100;
  
  // 2. Additional pre-handover payments - check each one
  inputs.additionalPayments.forEach(m => {
    if (m.paymentPercent <= 0) return;
    
    let triggered = false;
    let monthTriggered = 0;
    
    if (m.type === 'time') {
      // Time-based: triggered if we've passed that month
      triggered = m.triggerValue <= exitMonths;
      monthTriggered = m.triggerValue;
    } else if (m.type === 'construction') {
      // Construction-based: use S-curve to determine when triggered
      // Calculate what month this construction % corresponds to
      monthTriggered = constructionToMonth(m.triggerValue, totalMonths);
      triggered = exitConstructionPercent >= m.triggerValue;
    }
    
    if (triggered) {
      planEquity += basePrice * m.paymentPercent / 100;
    }
  });
  
  // 3. Handover payment logic
  // Calculate if payments already sum to 100% (no separate handover payment needed)
  const totalAdditionalPercent = inputs.additionalPayments.reduce((sum, p) => sum + p.paymentPercent, 0);
  const totalAllocatedPercent = inputs.downpaymentPercent + totalAdditionalPercent;
  const paymentsAlreadyComplete = Math.abs(totalAllocatedPercent - 100) < 0.5;
  
  if (inputs.hasPostHandoverPlan) {
    // With post-handover plan: on-handover is a specific percentage
    // BUT only add it if payments don't already sum to 100%
    if (exitMonths >= totalMonths && !paymentsAlreadyComplete) {
      planEquity += basePrice * (inputs.onHandoverPercent || 0) / 100;
    }
    
    // 4. Post-handover payments - check each one
    if (isPostHandover && inputs.postHandoverPayments) {
      inputs.postHandoverPayments.forEach(m => {
        if (m.paymentPercent <= 0) return;
        
        // Post-handover payments are triggered by months AFTER handover
        if (m.triggerValue <= monthsAfterHandover) {
          planEquity += basePrice * m.paymentPercent / 100;
        }
      });
    }
  } else {
    // Standard plan: handover payment is the remaining balance
    if (exitMonths >= totalMonths) {
      const handoverPercent = 100 - inputs.preHandoverPercent;
      planEquity += basePrice * handoverPercent / 100;
    }
  }
  
  // Calculate threshold requirement
  const thresholdPercent = inputs.minimumExitThreshold || 30;
  const thresholdEquity = basePrice * thresholdPercent / 100;
  
  // Determine if we need to advance payments
  const planEquityPercent = (planEquity / basePrice) * 100;
  const isThresholdMet = planEquityPercent >= thresholdPercent;
  const advanceRequired = isThresholdMet ? 0 : thresholdEquity - planEquity;
  
  // If not met, identify which payments would need to be advanced
  if (!isThresholdMet) {
    let accumulatedEquity = planEquity;
    
    // Sort remaining payments by when they would trigger
    const remainingPayments = inputs.additionalPayments
      .filter(m => {
        if (m.paymentPercent <= 0) return false;
        if (m.type === 'time') {
          return m.triggerValue > exitMonths;
        } else if (m.type === 'construction') {
          return exitConstructionPercent < m.triggerValue;
        }
        return false;
      })
      .map(m => ({
        milestone: m,
        monthTriggered: m.type === 'time' ? m.triggerValue : constructionToMonth(m.triggerValue, totalMonths),
        amount: basePrice * m.paymentPercent / 100,
      }))
      .sort((a, b) => a.monthTriggered - b.monthTriggered);
    
    // Add payments until threshold is met
    for (const payment of remainingPayments) {
      if (accumulatedEquity >= thresholdEquity) break;
      
      const amountNeeded = thresholdEquity - accumulatedEquity;
      const amountAdvanced = Math.min(payment.amount, amountNeeded);
      
      advancedPayments.push({
        milestone: payment.milestone,
        monthTriggered: payment.monthTriggered,
        amountAdvanced,
      });
      
      accumulatedEquity += payment.amount;
    }
    
    // If still not enough, might need handover payment (for non-post-handover plans)
    if (accumulatedEquity < thresholdEquity && exitMonths < totalMonths && !inputs.hasPostHandoverPlan) {
      const handoverPercent = 100 - inputs.preHandoverPercent;
      const handoverAmount = basePrice * handoverPercent / 100;
      const amountNeeded = thresholdEquity - accumulatedEquity;
      
      if (amountNeeded > 0) {
        advancedPayments.push({
          milestone: {
            id: 'handover',
            type: 'time',
            triggerValue: totalMonths,
            paymentPercent: handoverPercent,
            label: 'Handover',
          },
          monthTriggered: totalMonths,
          amountAdvanced: Math.min(handoverAmount, amountNeeded),
        });
      }
    }
  }
  
  const finalEquity = Math.max(planEquity, thresholdEquity);
  
  return {
    planEquity,
    thresholdEquity,
    finalEquity,
    advanceRequired,
    advancedPayments,
    isThresholdMet,
    planEquityPercent,
  };
};

/**
 * Calculate the month when payment plan naturally reaches threshold
 * Now supports post-handover payment plans
 */
export const getMonthWhenThresholdMet = (
  inputs: OIInputs,
  totalMonths: number,
  basePrice: number
): number => {
  const thresholdPercent = inputs.minimumExitThreshold || 30;
  const thresholdEquity = basePrice * thresholdPercent / 100;
  
  // Start with downpayment
  let accumulatedEquity = basePrice * inputs.downpaymentPercent / 100;
  
  if (accumulatedEquity >= thresholdEquity) return 0;
  
  // Collect all payment events with their trigger months
  const paymentEvents: { month: number; amount: number }[] = [];
  
  // Pre-handover payments
  inputs.additionalPayments.forEach(m => {
    if (m.paymentPercent <= 0) return;
    
    const triggerMonth = m.type === 'time' 
      ? m.triggerValue 
      : constructionToMonth(m.triggerValue, totalMonths);
    
    paymentEvents.push({
      month: triggerMonth,
      amount: basePrice * m.paymentPercent / 100,
    });
  });
  
  // Add handover payment
  // Calculate if payments already sum to 100% (no separate handover payment needed)
  const totalAdditionalPercent = inputs.additionalPayments.reduce((sum, p) => sum + p.paymentPercent, 0);
  const totalAllocatedPercent = inputs.downpaymentPercent + totalAdditionalPercent;
  const paymentsAlreadyComplete = Math.abs(totalAllocatedPercent - 100) < 0.5;
  
  if (inputs.hasPostHandoverPlan) {
    // On-handover payment - only add if payments don't already sum to 100%
    if (!paymentsAlreadyComplete) {
      paymentEvents.push({
        month: totalMonths,
        amount: basePrice * (inputs.onHandoverPercent || 0) / 100,
      });
    }
    
    // Post-handover payments
    if (inputs.postHandoverPayments) {
      inputs.postHandoverPayments.forEach(m => {
        if (m.paymentPercent <= 0) return;
        paymentEvents.push({
          month: totalMonths + m.triggerValue, // months after handover
          amount: basePrice * m.paymentPercent / 100,
        });
      });
    }
  } else {
    const handoverPercent = 100 - inputs.preHandoverPercent;
    paymentEvents.push({
      month: totalMonths,
      amount: basePrice * handoverPercent / 100,
    });
  }
  
  // Sort by month
  paymentEvents.sort((a, b) => a.month - b.month);
  
  // Find when threshold is met
  for (const event of paymentEvents) {
    accumulatedEquity += event.amount;
    if (accumulatedEquity >= thresholdEquity) {
      return event.month;
    }
  }
  
  return totalMonths;
};

/**
 * Calculate exit price using phased appreciation with monthly compounding
 * This is the canonical exit price calculation used across the app
 */
export const calculateExitPrice = (
  months: number,
  basePrice: number,
  totalMonths: number,
  inputs: ExitPriceInputs
): number => {
  const { 
    constructionAppreciation = 12, 
    growthAppreciation = 8, 
    matureAppreciation = 4, 
    growthPeriodYears = 5 
  } = inputs;
  
  let currentValue = basePrice;
  
  // Phase 1: Construction period (using constructionAppreciation)
  const constructionMonths = Math.min(months, totalMonths);
  if (constructionMonths > 0) {
    const monthlyConstructionRate = Math.pow(1 + constructionAppreciation / 100, 1/12) - 1;
    currentValue *= Math.pow(1 + monthlyConstructionRate, constructionMonths);
  }
  
  // If exit is during construction, return here
  if (months <= totalMonths) {
    return currentValue;
  }
  
  // Phase 2: Growth period (post-handover, first growthPeriodYears years)
  const postHandoverMonths = months - totalMonths;
  const growthMonths = Math.min(postHandoverMonths, growthPeriodYears * 12);
  if (growthMonths > 0) {
    const monthlyGrowthRate = Math.pow(1 + growthAppreciation / 100, 1/12) - 1;
    currentValue *= Math.pow(1 + monthlyGrowthRate, growthMonths);
  }
  
  // Phase 3: Mature period (after growthPeriodYears)
  const matureMonths = Math.max(0, postHandoverMonths - growthPeriodYears * 12);
  if (matureMonths > 0) {
    const monthlyMatureRate = Math.pow(1 + matureAppreciation / 100, 1/12) - 1;
    currentValue *= Math.pow(1 + monthlyMatureRate, matureMonths);
  }
  
  return currentValue;
};

/**
 * Full exit scenario result with ROE breakdown for tooltips
 */
export interface ExitScenarioResult {
  exitPrice: number;
  basePrice: number;
  appreciation: number;
  appreciationPercent: number;
  equityDeployed: number;
  equityPercent: number;
  planEquityPercent: number;
  entryCosts: number;
  exitCosts: number; // NEW: Agent commission + NOC fee
  agentCommission: number; // NEW
  nocFee: number; // NEW
  totalCapital: number;
  profit: number;
  trueProfit: number;
  netProfit: number; // NEW: After exit costs
  roe: number;
  trueROE: number;
  netROE: number; // NEW: After exit costs
  annualizedROE: number;
  netAnnualizedROE: number; // NEW
  advanceRequired: number;
  advancedPayments: EquityAtExitResult['advancedPayments'];
  isThresholdMet: boolean;
}

/**
 * Calculate complete exit scenario with all metrics
 * Unified calculation used by both configurator and quote analysis
 */
export const calculateExitScenario = (
  monthsFromBooking: number,
  basePrice: number,
  totalMonths: number,
  inputs: OIInputs,
  entryCosts: number = 0
): ExitScenarioResult => {
  // Calculate exit price using phased appreciation
  const exitPrice = calculateExitPrice(monthsFromBooking, basePrice, totalMonths, inputs);
  const appreciation = exitPrice - basePrice;
  const appreciationPercent = (appreciation / basePrice) * 100;
  
  // Calculate equity using S-curve and threshold logic
  const equityResult = calculateEquityAtExitWithDetails(monthsFromBooking, inputs, totalMonths, basePrice);
  const equityDeployed = equityResult.finalEquity;
  const equityPercent = (equityDeployed / basePrice) * 100;
  
  // Calculate exit costs
  const agentCommission = inputs.exitAgentCommissionEnabled ? exitPrice * 0.02 : 0; // 2% of exit price
  const nocFee = inputs.exitNocFee || 0;
  const exitCosts = agentCommission + nocFee;
  
  // Calculate profits
  // Profit = Appreciation (what you gain from the property value increase)
  const totalCapital = equityDeployed + entryCosts;
  const profit = appreciation; // Pure appreciation gain
  const trueProfit = appreciation; // Keep same as profit - appreciation IS the profit
  const netProfit = appreciation - exitCosts; // After exit costs only
  
  // Calculate ROE - Profit divided by Equity Deployed (money put in)
  // This shows the true leverage effect: how much your invested capital multiplied
  const roe = equityDeployed > 0 ? (appreciation / equityDeployed) * 100 : 0;
  const trueROE = totalCapital > 0 ? (appreciation / totalCapital) * 100 : 0;
  const netROE = totalCapital > 0 ? (netProfit / totalCapital) * 100 : 0;
  const annualizedROE = monthsFromBooking > 0 ? (trueROE / (monthsFromBooking / 12)) : 0;
  const netAnnualizedROE = monthsFromBooking > 0 ? (netROE / (monthsFromBooking / 12)) : 0;
  
  return {
    exitPrice,
    basePrice,
    appreciation,
    appreciationPercent,
    equityDeployed,
    equityPercent,
    planEquityPercent: equityResult.planEquityPercent,
    entryCosts,
    exitCosts,
    agentCommission,
    nocFee,
    totalCapital,
    profit,
    trueProfit,
    netProfit,
    roe,
    trueROE,
    netROE,
    annualizedROE,
    netAnnualizedROE,
    advanceRequired: equityResult.advanceRequired,
    advancedPayments: equityResult.advancedPayments,
    isThresholdMet: equityResult.isThresholdMet,
  };
};
