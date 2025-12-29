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

// S-curve parameters based on typical Dubai construction patterns
// Key milestones:
// - 20% construction at ~15% of timeline (fast start for escrow)
// - 50% construction at ~45% of timeline
// - 70% construction at ~65% of timeline  
// - 90% construction at ~85% of timeline
// - 100% at handover

/**
 * Convert timeline percentage to construction progress percentage
 * Uses a modified sigmoid/logistic function tuned to Dubai patterns
 */
export const timelineToConstruction = (timelinePercent: number): number => {
  if (timelinePercent <= 0) return 0;
  if (timelinePercent >= 100) return 100;
  
  // Use piecewise linear approximation for predictability
  // This matches observed Dubai construction patterns
  const segments: [number, number][] = [
    [0, 0],      // Start
    [15, 20],    // 15% timeline = 20% construction (fast start for escrow)
    [35, 40],    // 35% timeline = 40% construction
    [50, 55],    // 50% timeline = 55% construction
    [65, 70],    // 65% timeline = 70% construction
    [80, 85],    // 80% timeline = 85% construction
    [90, 93],    // 90% timeline = 93% construction
    [100, 100],  // End
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
 * Inverse of timelineToConstruction
 */
export const constructionToTimeline = (constructionPercent: number): number => {
  if (constructionPercent <= 0) return 0;
  if (constructionPercent >= 100) return 100;
  
  // Same segments, but interpolate the other direction
  const segments: [number, number][] = [
    [0, 0],      // construction -> timeline
    [20, 15],    // 20% construction = 15% timeline
    [40, 35],    // 40% construction = 35% timeline
    [55, 50],    // 55% construction = 50% timeline
    [70, 65],    // 70% construction = 65% timeline
    [85, 80],    // 85% construction = 80% timeline
    [93, 90],    // 93% construction = 90% timeline
    [100, 100],  // End
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
 */
export const calculateEquityAtExitWithDetails = (
  exitMonths: number,
  inputs: OIInputs,
  totalMonths: number,
  basePrice: number
): EquityAtExitResult => {
  const exitTimelinePercent = (exitMonths / totalMonths) * 100;
  const exitConstructionPercent = timelineToConstruction(exitTimelinePercent);
  
  let planEquity = 0;
  const advancedPayments: EquityAtExitResult['advancedPayments'] = [];
  
  // 1. Downpayment - always paid at month 0
  planEquity += basePrice * inputs.downpaymentPercent / 100;
  
  // 2. Additional payments - check each one
  inputs.additionalPayments.forEach(m => {
    if (m.paymentPercent <= 0) return;
    
    let triggered = false;
    let monthTriggered = 0;
    
    if (m.type === 'time') {
      // Time-based: triggered if we've passed that month
      triggered = m.triggerValue <= exitMonths;
      monthTriggered = m.triggerValue;
    } else {
      // Construction-based: use S-curve to determine when triggered
      // Calculate what month this construction % corresponds to
      monthTriggered = constructionToMonth(m.triggerValue, totalMonths);
      triggered = exitConstructionPercent >= m.triggerValue;
    }
    
    if (triggered) {
      planEquity += basePrice * m.paymentPercent / 100;
    }
  });
  
  // 3. Handover payment - only if at or after handover
  if (exitMonths >= totalMonths) {
    const handoverPercent = 100 - inputs.preHandoverPercent;
    planEquity += basePrice * handoverPercent / 100;
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
        } else {
          return exitConstructionPercent < m.triggerValue;
        }
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
    
    // If still not enough, might need handover payment
    if (accumulatedEquity < thresholdEquity && exitMonths < totalMonths) {
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
  const handoverPercent = 100 - inputs.preHandoverPercent;
  paymentEvents.push({
    month: totalMonths,
    amount: basePrice * handoverPercent / 100,
  });
  
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
