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
  eoiFee: 50000,
  oqoodFee: 5000,
  minimumExitThreshold: 30,
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
    
    // Handle legacy rentalMode field
    if (saved.rentalMode === 'short-term' && !saved.showAirbnbComparison) {
      merged.showAirbnbComparison = true;
    }
    
    console.log('[inputMigration] Migrated quote from v1 to v2');
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
