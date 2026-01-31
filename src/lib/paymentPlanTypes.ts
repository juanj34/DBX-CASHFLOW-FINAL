// Types for AI Payment Plan Extraction

export interface ExtractedProperty {
  developer?: string;
  projectName?: string;
  unitNumber?: string;
  unitType?: 'studio' | '1br' | '2br' | '3br' | '4br' | 'penthouse' | 'townhouse' | 'villa' | string;
  unitSizeSqft?: number;
  basePrice?: number;
  currency?: 'AED' | 'USD' | 'EUR' | 'GBP';
}

export interface ExtractedPaymentStructure {
  paymentSplit?: string; // e.g., '40/60', '50/50'
  hasPostHandover: boolean;
  handoverQuarter?: 1 | 2 | 3 | 4;
  handoverYear?: number;
  handoverMonthFromBooking?: number; // Month number from booking when handover occurs (e.g., 26)
  onHandoverPercent?: number;
  postHandoverPercent?: number;
}

export interface ExtractedInstallment {
  id: string;
  type: 'time' | 'construction' | 'handover' | 'post-handover';
  triggerValue: number; // Months from booking (for time) or construction % (for construction)
  paymentPercent: number;
  label?: string;
  confidence: number; // 0-100
  isPostHandover?: boolean;
}

export interface ExtractedPaymentPlan {
  property?: ExtractedProperty;
  paymentStructure: ExtractedPaymentStructure;
  installments: ExtractedInstallment[];
  overallConfidence: number;
  warnings: string[];
}

export interface BookingDateOption {
  type: 'today' | 'existing' | 'custom';
  month?: number;
  year?: number;
}

// Response from the edge function
export interface ExtractionResponse {
  success: boolean;
  data?: ExtractedPaymentPlan;
  error?: string;
}
