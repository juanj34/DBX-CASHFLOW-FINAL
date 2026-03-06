/**
 * Single utility to convert AIPaymentPlanResult → partial OIInputs.
 * Replaces all duplicated handleAIExtraction functions.
 */

import type { AIPaymentPlanResult } from './aiExtractionTypes';
import type { OIInputs, PaymentMilestone } from '@/components/roi/useOICalculations';

const SQF_TO_M2 = 0.092903;
const sqfToM2 = (sqf: number) => Math.round(sqf * SQF_TO_M2 * 10) / 10;

// Strip trailing dates and replace "Payment" → "Installment" in AI-extracted labels
// "1st Payment February 2026" → "1st Installment"
// "3rd Installment March 2027" → "3rd Installment"
const MONTH_NAMES = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/i;
const cleanLabel = (label?: string): string | undefined => {
  if (!label) return label;
  let cleaned = label.replace(/Payment/gi, 'Installment');
  // Remove trailing month+year patterns like "February 2026" or "Mar 2027"
  cleaned = cleaned.replace(/\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\s*$/i, '');
  // Remove standalone year at end like "2026"
  cleaned = cleaned.replace(/\s+\d{4}\s*$/, '');
  return cleaned.trim() || label;
};

interface ClientInfo {
  developer?: string;
  projectName?: string;
  unit?: string;
  unitType?: string;
  unitSizeSqf?: number;
  unitSizeM2?: number;
  [key: string]: unknown;
}

interface ApplyResult {
  /** Partial OIInputs to spread into setInputs */
  inputs: Partial<OIInputs>;
  /** Partial ClientInfo updates */
  clientInfo: Partial<ClientInfo>;
}

export function applyExtractedPlan(
  plan: AIPaymentPlanResult,
  bookingDate: { month: number; year: number },
  currentInputs: OIInputs
): ApplyResult {
  const clientInfo: Partial<ClientInfo> = {};

  // Property info → ClientInfo
  if (plan.developer) clientInfo.developer = plan.developer;
  if (plan.projectName) clientInfo.projectName = plan.projectName;
  if (plan.unitNumber) clientInfo.unit = plan.unitNumber;
  if (plan.unitType) clientInfo.unitType = plan.unitType;
  if (plan.sizeSqFt) {
    clientInfo.unitSizeSqf = plan.sizeSqFt;
    clientInfo.unitSizeM2 = sqfToM2(plan.sizeSqFt);
  }

  // Handover date calculation
  let handoverMonth = currentInputs.handoverMonth;
  let handoverYear = currentInputs.handoverYear;

  if (plan.handoverMonthFromBooking) {
    const d = new Date(bookingDate.year, bookingDate.month - 1);
    d.setMonth(d.getMonth() + plan.handoverMonthFromBooking);
    handoverMonth = d.getMonth() + 1;
    handoverYear = d.getFullYear();
  } else if (plan.handoverMonth && plan.handoverYear) {
    handoverMonth = plan.handoverMonth;
    handoverYear = plan.handoverYear;
  }

  // Compute months from booking to handover — needed to convert construction
  // milestones (which use % as triggerValue) to month-based triggerValues.
  const handoverMonthsFromBooking = (handoverYear - bookingDate.year) * 12
    + (handoverMonth - bookingDate.month);

  // Safety net: detect completion payments that slipped through as milestones.
  let effectiveOnHandoverPercent = plan.onHandoverPercent || 0;
  const milestones = [...plan.milestones];

  if (effectiveOnHandoverPercent < 5) {
    // Strategy 1: label-based detection
    let completionIdx = milestones.findIndex(m => {
      if (m.type === 'post-handover') return false;
      const label = (m.label || '').toLowerCase();
      return (
        label.includes('completion') ||
        label.includes('handover') ||
        label.includes('balance') ||
        label.includes('remaining')
      ) && m.paymentPercent >= 20;
    });

    // Strategy 2: statistical outlier (e.g., 70% among [2.5, 2.5, 2.5, 2.5])
    if (completionIdx === -1 && milestones.length >= 2) {
      const indexed = milestones
        .map((m, i) => ({ pct: m.paymentPercent, idx: i, type: m.type }))
        .filter(m => m.type !== 'post-handover');
      if (indexed.length >= 2) {
        const sorted = [...indexed].sort((a, b) => b.pct - a.pct);
        const largest = sorted[0];
        const median = sorted[Math.floor(sorted.length / 2)].pct;
        if (largest.pct >= 30 && median > 0 && largest.pct >= median * 3) {
          completionIdx = largest.idx;
        }
      }
    }

    if (completionIdx !== -1) {
      effectiveOnHandoverPercent += milestones[completionIdx].paymentPercent;
      milestones.splice(completionIdx, 1);
      console.warn('[applyExtractedPlan] Moved completion payment from milestones to onHandoverPercent');
    }
  }

  // Pre-handover percent: sum of downpayment + construction milestones (excludes handover and post-handover)
  const preHandoverMilestones = milestones.filter(m =>
    (m.type === 'time' || m.type === 'construction') && !m.isHandover
  );
  const preHandoverPercent = plan.downpaymentPercent + preHandoverMilestones.reduce((s, m) => s + m.paymentPercent, 0);

  // Additional payments (pre-handover milestones, excluding downpayment)
  // CRITICAL: Convert construction milestones from % to months-from-booking.
  // Construction milestones use completion % as triggerValue (e.g., 50 = 50% built),
  // but the PaymentPlanStep sorts/classifies ALL milestones by triggerValue as months.
  // Without conversion, a "50% construction" milestone (triggerValue=50) would appear
  // AFTER a completion at month 29, causing it to be misclassified as post-handover.
  const additionalPayments: PaymentMilestone[] = milestones
    .filter(m => m.type !== 'post-handover')
    .map((m, idx) => {
      let triggerValue = m.triggerValue;

      // Convert construction % → estimated months from booking
      if (m.type === 'construction' && handoverMonthsFromBooking > 0) {
        triggerValue = Math.max(1, Math.round((m.triggerValue / 100) * handoverMonthsFromBooking));
      }

      return {
        id: `ai-${Date.now()}-${idx}`,
        type: 'time' as const, // normalize all to time-based
        triggerValue,
        paymentPercent: m.paymentPercent,
        label: cleanLabel(m.label),
        ...(m.isHandover && { isHandover: true }),
      };
    });

  // Post-handover payments (triggerValue is already relative months after handover)
  const postHandoverPayments: PaymentMilestone[] = plan.hasPostHandover
    ? milestones
        .filter(m => m.type === 'post-handover')
        .map((m, idx) => ({
          id: `ai-post-${Date.now()}-${idx}`,
          type: 'post-handover' as const,
          triggerValue: m.triggerValue,
          paymentPercent: m.paymentPercent,
          label: cleanLabel(m.label),
        }))
        .sort((a, b) => a.triggerValue - b.triggerValue)
    : [];

  const postHandoverPercent = plan.postHandoverPercent
    || postHandoverPayments.reduce((s, p) => s + p.paymentPercent, 0);

  const inputs: Partial<OIInputs> = {
    bookingMonth: bookingDate.month,
    bookingYear: bookingDate.year,
    downpaymentPercent: plan.downpaymentPercent,
    preHandoverPercent,
    additionalPayments,
    handoverMonth,
    handoverYear,
    hasPostHandoverPlan: plan.hasPostHandover,
    onHandoverPercent: effectiveOnHandoverPercent,
    postHandoverPercent,
    postHandoverPayments,
    ...(plan.purchasePrice && { basePrice: plan.purchasePrice }),
    ...(plan.sizeSqFt && { unitSizeSqf: plan.sizeSqFt }),
    ...(plan.oqoodFee != null && plan.oqoodFee > 0 && { oqoodFee: plan.oqoodFee }),
  };

  return { inputs, clientInfo };
}
