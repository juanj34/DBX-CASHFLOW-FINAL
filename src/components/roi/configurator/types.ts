import { OIInputs, PaymentMilestone } from "../useOICalculations";
import { Currency } from "../currencyUtils";

export type ConfiguratorSection = 'property' | 'payment' | 'value' | 'appreciation' | 'exits' | 'rent';

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

export const years = Array.from({ length: 12 }, (_, i) => 2024 + i);

export const presetSplits = ['20/80', '30/70', '40/60', '50/50', '60/40', '80/20'];

export const DEFAULT_SHORT_TERM_RENTAL = {
  averageDailyRate: 800,
  occupancyPercent: 70,
  operatingExpensePercent: 25,
  managementFeePercent: 15,
};

export const DEFAULT_OI_INPUTS: OIInputs = {
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
  valueDifferentiators: [],
};
