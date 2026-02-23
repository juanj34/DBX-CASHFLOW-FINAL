import { RentSnapshot } from "@/components/roi/RentSnapshot";
import { OIYearlyProjectionTable } from "@/components/roi/OIYearlyProjectionTable";
import { WealthSummaryCard } from "@/components/roi/WealthSummaryCard";
import { InvestmentJourneyCards } from "@/components/roi/InvestmentJourneyCards";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { Currency } from "@/components/roi/currencyUtils";
import { useState } from "react";
import { ChevronDown, ChevronUp, Table } from "lucide-react";
import { ProjectionDisclaimer } from "@/components/roi/ProjectionDisclaimer";

interface ROIReturnsTabProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
  unitSizeSqf?: number;
}

export const ROIReturnsTab = ({ inputs, calculations, currency, rate, unitSizeSqf }: ROIReturnsTabProps) => {
  const totalCapitalInvested = calculations.basePrice + calculations.totalEntryCosts;
  const [showDetailedTable, setShowDetailedTable] = useState(false);
  const year7Projection = calculations.yearlyProjections[6] || calculations.yearlyProjections[calculations.yearlyProjections.length - 1];

  // Calculate key return metrics
  const firstRentalYear = calculations.yearlyProjections.find(p => !p.isConstruction && !p.isHandover && p.netRent && p.netRent > 0);
  const yieldOnCost = firstRentalYear ? ((firstRentalYear.netRent || 0) / totalCapitalInvested * 100) : 0;
  const totalRent10yr = calculations.yearlyProjections.reduce((sum, p) => sum + (p.netRent || 0), 0);
  const lastProjection = calculations.yearlyProjections[calculations.yearlyProjections.length - 1];
  const totalAppreciation = lastProjection ? lastProjection.propertyValue - calculations.basePrice : 0;
  const total10yrReturn = ((totalAppreciation + totalRent10yr) / totalCapitalInvested * 100);

  // Break-even year
  let breakEvenYear: number | null = null;
  let cumulativeRent = 0;
  for (const p of calculations.yearlyProjections) {
    cumulativeRent += (p.netRent || 0);
    if (cumulativeRent >= totalCapitalInvested && !breakEvenYear) {
      breakEvenYear = p.year;
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Yield on Cost" value={`${yieldOnCost.toFixed(1)}%`} subtitle="Year 1 net rent / total capital" />
        <MetricCard label="10yr Total Return" value={`${total10yrReturn.toFixed(0)}%`} subtitle="Appreciation + rent / capital" />
        <MetricCard label="Break-Even Year" value={breakEvenYear ? String(breakEvenYear) : "N/A"} subtitle="Rent covers total investment" />
        <MetricCard label="Rental Yield" value={`${inputs.rentalYieldPercent}%`} subtitle="Initial gross yield on price" />
      </div>

      {/* Rent Snapshot */}
      <RentSnapshot
        inputs={inputs}
        currency={currency}
        rate={rate}
        holdAnalysis={calculations.holdAnalysis}
      />

      {/* Investment Journey */}
      <InvestmentJourneyCards
        inputs={inputs}
        calculations={calculations}
        currency={currency}
        rate={rate}
        totalCapitalInvested={totalCapitalInvested}
      />

      {/* Wealth Summary */}
      {year7Projection && (
        <WealthSummaryCard
          inputs={inputs}
          calculations={calculations}
          currency={currency}
          rate={rate}
          totalCapitalInvested={totalCapitalInvested}
          unitSizeSqf={unitSizeSqf}
        />
      )}

      {/* Detailed Table Toggle */}
      <button
        onClick={() => setShowDetailedTable(!showDetailedTable)}
        className="w-full flex items-center justify-between p-3 bg-theme-card rounded-xl border border-theme-border hover:bg-theme-bg/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-theme-text-muted">
          <Table className="w-4 h-4" />
          <span className="text-sm font-medium">Year-by-Year Projection Table</span>
        </div>
        {showDetailedTable ? <ChevronUp className="w-4 h-4 text-theme-text-muted" /> : <ChevronDown className="w-4 h-4 text-theme-text-muted" />}
      </button>

      {showDetailedTable && (
        <OIYearlyProjectionTable
          yearlyProjections={calculations.yearlyProjections}
          currency={currency}
          rate={rate}
        />
      )}

      <ProjectionDisclaimer />
    </div>
  );
};

const MetricCard = ({ label, value, subtitle }: { label: string; value: string; subtitle: string }) => (
  <div className="p-3 bg-theme-card rounded-xl border border-theme-border">
    <div className="text-[10px] text-theme-text-muted uppercase tracking-wide">{label}</div>
    <div className="text-lg font-mono font-semibold text-theme-accent mt-1">{value}</div>
    <div className="text-[10px] text-theme-text-muted mt-0.5">{subtitle}</div>
  </div>
);
