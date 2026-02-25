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

  // Pre-handover percent: sum of downpayment + construction milestones (excludes handover and post-handover)
  const preHandoverMilestones = plan.milestones.filter(m =>
    (m.type === 'time' || m.type === 'construction') && !m.isHandover
  );
  const preHandoverPercent = plan.downpaymentPercent + preHandoverMilestones.reduce((s, m) => s + m.paymentPercent, 0);

  // Additional payments (pre-handover milestones, excluding downpayment)
  // Include isHandover milestones with flag preserved — the new PaymentPlanStep
  // shows all installments in one flat list and splits them on save.
  const additionalPayments: PaymentMilestone[] = plan.milestones
    .filter(m => m.type !== 'post-handover')
    .map((m, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      type: m.type === 'construction' ? 'construction' as const : 'time' as const,
      triggerValue: m.triggerValue,
      paymentPercent: m.paymentPercent,
      label: cleanLabel(m.label),
      ...(m.isHandover && { isHandover: true }),
    }));

  // Post-handover payments (triggerValue is already relative months after handover)
  const postHandoverPayments: PaymentMilestone[] = plan.hasPostHandover
    ? plan.milestones
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
    onHandoverPercent: plan.onHandoverPercent || 0,
    postHandoverPercent,
    postHandoverPayments,
    ...(plan.purchasePrice && { basePrice: plan.purchasePrice }),
    ...(plan.sizeSqFt && { unitSizeSqf: plan.sizeSqFt }),
  };

  return { inputs, clientInfo };
}
