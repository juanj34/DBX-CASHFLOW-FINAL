/**
 * AI Payment Plan Extraction — types shared between edge functions and client.
 * These map directly to OIInputs fields, eliminating the need for complex transformation.
 */

export interface AIExtractedMilestone {
  type: 'time' | 'construction' | 'post-handover';
  triggerValue: number; // time: months from booking; construction: % complete; post-handover: months after handover (relative)
  paymentPercent: number;
  label?: string;
  isHandover?: boolean; // true for the completion milestone in standard (non-post-handover) plans
}

export interface AIPaymentPlanResult {
  // Property info
  purchasePrice?: number;
  currency?: 'AED' | 'USD' | 'EUR' | 'GBP';
  developer?: string;
  projectName?: string;
  unitNumber?: string;
  unitType?: 'studio' | '1br' | '2br' | '3br' | '4br' | 'penthouse' | 'townhouse' | 'villa';
  sizeSqFt?: number;

  // Payment structure
  downpaymentPercent: number;
  handoverMonthFromBooking?: number;
  handoverMonth?: number; // 1-12 calendar month
  handoverYear?: number;
  hasPostHandover: boolean;
  onHandoverPercent?: number;
  postHandoverPercent?: number;
  oqoodFee?: number; // Admin/oqood fee in AED (typically 5,000–5,250)

  // Milestones (excludes downpayment at month 0; may include handover with isHandover flag for standard plans)
  milestones: AIExtractedMilestone[];

  // Meta
  confidence: number;
  warnings: string[];
}

/** Upload response from edge function */
export interface AIUploadResponse {
  success: boolean;
  data?: AIPaymentPlanResult;
  error?: string;
}
