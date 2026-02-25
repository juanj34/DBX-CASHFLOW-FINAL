import { OIInputs, PaymentMilestone, ShortTermRentalConfig, quarterToMonth } from './useOICalculations';

// Schema version tracking
export const CURRENT_SCHEMA_VERSION = 3;

// Dynamic date helpers
const getCurrentMonth = () => new Date().getMonth() + 1;
const getCurrentYear = () => new Date().getFullYear();

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
  bookingMonth: getCurrentMonth(),
  bookingYear: getCurrentYear(),
  handoverMonth: 11, // November (was Q4)
  handoverYear: getCurrentYear() + 2,
  downpaymentPercent: 20,
  preHandoverPercent: 20,
  additionalPayments: [],
  // Post-handover payment plan defaults
  hasPostHandoverPlan: false,
  onHandoverPercent: 0,
  postHandoverPercent: 0,
  postHandoverPayments: [],
  postHandoverEndMonth: 11, // November
  postHandoverEndYear: new Date().getFullYear() + 4,
  // Entry costs
  eoiFee: 50000,
  oqoodFee: 5000,
  minimumExitThreshold: 30,
  resellEligiblePercent: 30,
  mortgageEligiblePercent: 50,
  exitAgentCommissionEnabled: false,
  exitNocFee: 5000,
  showAirbnbComparison: false,
  shortTermRental: DEFAULT_SHORT_TERM_RENTAL,
  zoneMaturityLevel: 60,
  useZoneDefaults: true,
  constructionAppreciation: 12,
  growthAppreciation: 8,
  matureAppreciation: 4,
  growthPeriodYears: 3, // Matches balanced profile
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
    merged.growthPeriodYears ??= 3; // Matches balanced profile
    merged.rentGrowthRate ??= 4;
    merged.serviceChargePerSqft ??= 18;
    merged.adrGrowthRate ??= 3;
    merged.zoneMaturityLevel ??= 60;
    merged.useZoneDefaults ??= true;
    merged.showAirbnbComparison ??= false;
    merged.minimumExitThreshold ??= 30;
    merged.resellEligiblePercent ??= 30;
    merged.mortgageEligiblePercent ??= 50;
    merged.exitAgentCommissionEnabled ??= false;
    merged.exitNocFee ??= 5000;
    merged.valueDifferentiators ??= [];

    // Handle legacy rentalMode field
    if (saved.rentalMode === 'short-term' && !saved.showAirbnbComparison) {
      merged.showAirbnbComparison = true;
    }

    console.log('[inputMigration] Migrated quote from v1 to v2');
  }

  // Post-handover payment plan fields (added across v2-v3)
  merged.hasPostHandoverPlan ??= false;
  merged.onHandoverPercent ??= 0;
  merged.postHandoverPercent ??= 0;
  merged.postHandoverPayments ??= [];
  merged.postHandoverEndYear ??= new Date().getFullYear() + 4;

  // V2 → V3 migration: quarter-based → month-based handover timing
  if (version < 3) {
    // Derive handoverMonth from legacy handoverQuarter if not already set
    const legacyQuarter = (saved as any).handoverQuarter;
    if (!saved.handoverMonth && legacyQuarter) {
      merged.handoverMonth = quarterToMonth(legacyQuarter);
    }
    merged.handoverMonth ??= 11; // default November

    // Derive postHandoverEndMonth from legacy postHandoverEndQuarter
    const legacyEndQuarter = (saved as any).postHandoverEndQuarter;
    if (!(merged as any).postHandoverEndMonth && legacyEndQuarter) {
      merged.postHandoverEndMonth = quarterToMonth(legacyEndQuarter);
    }
    merged.postHandoverEndMonth ??= 11; // default November

    console.log('[inputMigration] Migrated quote from v2 to v3 (quarter → month)');
  }

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

  // Ensure constructionSchedule is valid if present
  if (merged.constructionSchedule && !Array.isArray(merged.constructionSchedule)) {
    merged.constructionSchedule = undefined;
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
