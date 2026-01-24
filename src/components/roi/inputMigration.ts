import { OIInputs, PaymentMilestone, ShortTermRentalConfig } from './useOICalculations';

// Schema version tracking
export const CURRENT_SCHEMA_VERSION = 2;

// Default values for all fields (used for migration fallbacks)
const DEFAULT_SHORT_TERM_RENTAL: ShortTermRentalConfig = {
  averageDailyRate: 800,
  occupancyPercent: 70,
  operatingExpensePercent: 25,
  managementFeePercent: 15,
};

const DEFAULT_INPUT_VALUES: OIInputs = {
  basePrice: 800000,
  rentalYieldPercent: 8.5,
  appreciationRate: 10,
  bookingMonth: 1,
  bookingYear: 2025,
  handoverQuarter: 4,
  handoverYear: 2027,
  downpaymentPercent: 20,
  preHandoverPercent: 20,
  additionalPayments: [],
  // Post-handover payment plan defaults
  hasPostHandoverPlan: false,
  onHandoverPercent: 0,
  postHandoverPercent: 0,
  postHandoverPayments: [],
  postHandoverEndQuarter: 4,
  postHandoverEndYear: new Date().getFullYear() + 4,
  // Entry costs
  eoiFee: 50000,
  oqoodFee: 5000,
  minimumExitThreshold: 30,
  exitAgentCommissionEnabled: false,
  exitNocFee: 5000,
  showAirbnbComparison: false,
  shortTermRental: DEFAULT_SHORT_TERM_RENTAL,
  zoneMaturityLevel: 60,
  useZoneDefaults: true,
  constructionAppreciation: 12,
  growthAppreciation: 8,
  matureAppreciation: 4,
  growthPeriodYears: 5,
  rentGrowthRate: 4,
  serviceChargePerSqft: 18,
  adrGrowthRate: 3,
  valueDifferentiators: [],
};

/**
 * Migrates and merges saved inputs with current defaults.
 * This ensures old quotes work with new schema versions by:
 * 1. Filling in missing fields with defaults
 * 2. Handling version-specific migrations
 * 3. Stamping the current schema version
 */
export function migrateInputs(saved: Partial<OIInputs> | null | undefined): OIInputs {
  if (!saved) {
    return { ...DEFAULT_INPUT_VALUES, schemaVersion: CURRENT_SCHEMA_VERSION };
  }

  const version = (saved as any).schemaVersion || 1;

  // Start with defaults, then overlay saved values
  const merged: OIInputs = {
    ...DEFAULT_INPUT_VALUES,
    ...saved,
    // Ensure nested objects are properly merged
    shortTermRental: {
      ...DEFAULT_SHORT_TERM_RENTAL,
      ...(saved.shortTermRental || {}),
    },
    // Don't carry over internal metadata
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };

  // V1 → V2 migrations (fields added in v2)
  if (version < 2) {
    // These fields were added in later versions - ensure they have defaults
    merged.constructionAppreciation ??= 12;
    merged.growthAppreciation ??= 8;
    merged.matureAppreciation ??= 4;
    merged.growthPeriodYears ??= 5;
    merged.rentGrowthRate ??= 4;
    merged.serviceChargePerSqft ??= 18;
    merged.adrGrowthRate ??= 3;
    merged.zoneMaturityLevel ??= 60;
    merged.useZoneDefaults ??= true;
    merged.showAirbnbComparison ??= false;
    merged.minimumExitThreshold ??= 30;
    merged.exitAgentCommissionEnabled ??= false;
    merged.exitNocFee ??= 5000;
    merged.valueDifferentiators ??= [];
    
    // Handle legacy rentalMode field
    if (saved.rentalMode === 'short-term' && !saved.showAirbnbComparison) {
      merged.showAirbnbComparison = true;
    }
    
    console.log('[inputMigration] Migrated quote from v1 to v2');
  }
  
  // V2 → V3 migrations (post-handover payment plan)
  merged.hasPostHandoverPlan ??= false;
  merged.onHandoverPercent ??= 0;
  merged.postHandoverPercent ??= 0;
  merged.postHandoverPayments ??= [];
  merged.postHandoverEndQuarter ??= 4;
  merged.postHandoverEndYear ??= new Date().getFullYear() + 4;
  
  // Ensure post-handover payments array is valid
  if (!Array.isArray(merged.postHandoverPayments)) {
    merged.postHandoverPayments = [];
  }
  
  // Validate post-handover payment milestones
  merged.postHandoverPayments = merged.postHandoverPayments.map((payment, index) => ({
    id: payment.id || `post-payment-${index}`,
    type: 'post-handover' as const,
    triggerValue: payment.triggerValue ?? 0,
    paymentPercent: payment.paymentPercent ?? 0,
    label: payment.label || '',
  }));
  
  // Ensure valueDifferentiators is always an array
  if (!Array.isArray(merged.valueDifferentiators)) {
    merged.valueDifferentiators = [];
  }

  // Validate additionalPayments array
  if (!Array.isArray(merged.additionalPayments)) {
    merged.additionalPayments = [];
  }

  // Ensure all payment milestones have required fields
  merged.additionalPayments = merged.additionalPayments.map((payment, index) => ({
    id: payment.id || `payment-${index}`,
    type: payment.type || 'time',
    triggerValue: payment.triggerValue ?? 0,
    paymentPercent: payment.paymentPercent ?? 0,
    label: payment.label || '',
  }));

  return merged;
}

/**
 * Adds schema version to inputs before saving
 */
export function stampSchemaVersion(inputs: OIInputs): OIInputs {
  return {
    ...inputs,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}
