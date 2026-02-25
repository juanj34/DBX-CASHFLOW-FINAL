import { OIInputs, PaymentMilestone } from "../useOICalculations";
import { Currency } from "../currencyUtils";
import { ClientUnitData } from "../ClientUnitInfo";
import { MortgageInputs } from "../useMortgageCalculations";

export type ConfiguratorSection = 'location' | 'property' | 'payment' | 'appreciation' | 'value' | 'rental' | 'exit' | 'mortgage';

export interface ConfiguratorSectionProps {
  inputs: OIInputs;
  setInputs: React.Dispatch<React.SetStateAction<OIInputs>>;
  currency: Currency;
}

export interface SectionStatus {
  id: ConfiguratorSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isComplete: boolean;
  hasWarning?: boolean;
}

// Shared constants
export const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const quarters = [
  { value: 1, label: 'Q1' },
  { value: 2, label: 'Q2' },
  { value: 3, label: 'Q3' },
  { value: 4, label: 'Q4' },
];

// 8 years back + 8 years forward from current year for historical quote support
const currentYearForRange = new Date().getFullYear();
export const years = Array.from({ length: 16 }, (_, i) => currentYearForRange - 8 + i);

export const presetSplits = ['20/80', '30/70', '40/60', '50/50', '60/40', '70/30', '80/20'];

export const DEFAULT_SHORT_TERM_RENTAL = {
  averageDailyRate: 800,
  occupancyPercent: 70,
  operatingExpensePercent: 25,
  managementFeePercent: 15,
};

// Helper to get current date values
const getCurrentMonth = () => new Date().getMonth() + 1;
const getCurrentYear = () => new Date().getFullYear();

// Demo defaults (used for template/sample scenarios)
export const DEFAULT_OI_INPUTS: OIInputs = {
  basePrice: 800000,
  rentalYieldPercent: 8,
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
  postHandoverEndYear: getCurrentYear() + 4,
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
  // Balanced profile values (matches APPRECIATION_PROFILES.balanced)
  constructionAppreciation: 12,
  growthAppreciation: 8,
  matureAppreciation: 4,
  growthPeriodYears: 3, // Changed from 5 to 3 to match "balanced" profile
  rentGrowthRate: 4,
  serviceChargePerSqft: 18,
  adrGrowthRate: 3,
  valueDifferentiators: ['waterfront', 'master-community', 'premium-finishes'],
  _exitScenarios: [18, 24, 30],
  unitSizeSqf: 1250,
};

// Sample client info for demo scenarios
export const SAMPLE_CLIENT_INFO: ClientUnitData = {
  developer: 'Emaar Properties',
  projectName: 'The Valley',
  clients: [
    { id: '1', name: 'John Smith', country: 'GB' },
    { id: '2', name: 'Sarah Johnson', country: 'US' }
  ],
  brokerName: 'Ahmed Hassan',
  unit: 'V-3011',
  unitSizeSqf: 1250,
  unitSizeM2: 116,
  unitType: 'apartment',
  bedrooms: 2,
  splitEnabled: true,
  clientShares: [
    { clientId: '1', sharePercent: 60 },
    { clientId: '2', sharePercent: 40 }
  ],
  zoneId: '9162ec48-761d-4e3d-a7cf-1da0551bb6ea',
  zoneName: 'Downtown Dubai',
};

// Sample mortgage inputs for demo scenarios
export const SAMPLE_MORTGAGE_INPUTS: MortgageInputs = {
  enabled: true,
  financingPercent: 60,
  loanTermYears: 25,
  interestRate: 4.5,
  processingFeePercent: 1,
  valuationFee: 3000,
  mortgageRegistrationPercent: 0.25,
  lifeInsurancePercent: 0.4,
  propertyInsurance: 1500,
};

// Defaults for NEW quotes - no property data until user configures via wizard
export const NEW_QUOTE_OI_INPUTS: OIInputs = {
  basePrice: 0,
  rentalYieldPercent: 8,
  appreciationRate: 0,
  bookingMonth: getCurrentMonth(),
  bookingYear: getCurrentYear(),
  handoverMonth: 11, // November (was Q4)
  handoverYear: getCurrentYear() + 2,
  downpaymentPercent: 20,
  preHandoverPercent: 30,
  additionalPayments: [],
  // Post-handover payment plan defaults
  hasPostHandoverPlan: false,
  onHandoverPercent: 0,
  postHandoverPercent: 0,
  postHandoverPayments: [],
  postHandoverEndMonth: 11, // November
  postHandoverEndYear: getCurrentYear() + 4,
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
  // Balanced profile preselected
  constructionAppreciation: 12,
  growthAppreciation: 8,
  matureAppreciation: 4,
  growthPeriodYears: 3,
  rentGrowthRate: 4,
  serviceChargePerSqft: 18,
  adrGrowthRate: 3,
  valueDifferentiators: [],
};
