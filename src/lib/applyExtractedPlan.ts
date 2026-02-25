/**
 * Single utility to convert AIPaymentPlanResult → partial OIInputs.
 * Replaces all duplicated handleAIExtraction functions.
 */

import type { AIPaymentPlanResult } from './aiExtractionTypes';
import type { OIInputs, PaymentMilestone } from '@/components/roi/useOICalculations';

const SQF_TO_M2 = 0.092903;
const sqfToM2 = (sqf: number) => Math.round(sqf * SQF_TO_M2 * 10) / 10;

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
  // IMPORTANT: Exclude isHandover milestones — the handover/completion payment is NOT an
  // installment. It's the remaining balance calculated as 100% - preHandoverPercent.
  const additionalPayments: PaymentMilestone[] = plan.milestones
    .filter(m => m.type !== 'post-handover' && !m.isHandover)
    .map((m, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      type: m.type === 'construction' ? 'construction' as const : 'time' as const,
      triggerValue: m.triggerValue,
      paymentPercent: m.paymentPercent,
      label: m.label,
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
          label: m.label,
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
    onHandoverPercent: plan.hasPostHandover ? (plan.onHandoverPercent || 0) : 0,
    postHandoverPercent,
    postHandoverPayments,
    ...(plan.purchasePrice && { basePrice: plan.purchasePrice }),
    ...(plan.sizeSqFt && { unitSizeSqf: plan.sizeSqFt }),
  };

  return { inputs, clientInfo };
}
