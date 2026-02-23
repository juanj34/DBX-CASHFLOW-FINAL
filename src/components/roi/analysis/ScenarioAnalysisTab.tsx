import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { calculateExitPrice } from "@/components/roi/constructionProgress";
import { getEffectiveAppreciationRates } from "@/components/roi/constructionProgress";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";

interface ScenarioAnalysisTabProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
}

interface ScenarioResult {
  label: string;
  color: string;
  propertyValue5yr: number;
  propertyValue10yr: number;
  totalRent5yr: number;
  totalRent10yr: number;
  totalReturn5yr: number;
  totalReturn10yr: number;
  annualized5yr: number;
  annualized10yr: number;
}

export const ScenarioAnalysisTab = ({ inputs, calculations, currency, rate }: ScenarioAnalysisTabProps) => {
  const { basePrice, totalMonths, totalEntryCosts } = calculations;
  const totalCapital = basePrice + totalEntryCosts;

  // Custom scenario sliders
  const [customAppreciation, setCustomAppreciation] = useState(0); // % adjustment
  const [customRentalYield, setCustomRentalYield] = useState(0); // % adjustment

  const effectiveRates = getEffectiveAppreciationRates(inputs);

  // Calculate scenario results
  const scenarios = useMemo((): ScenarioResult[] => {
    const calcScenario = (label: string, color: string, appreciationMod: number, rentalMod: number): ScenarioResult => {
      // Modified rates
      const modRates = {
        constructionAppreciation: effectiveRates.constructionAppreciation * (1 + appreciationMod / 100),
        growthAppreciation: effectiveRates.growthAppreciation * (1 + appreciationMod / 100),
        matureAppreciation: effectiveRates.matureAppreciation * (1 + appreciationMod / 100),
        growthPeriodYears: effectiveRates.growthPeriodYears,
      };

      const modYield = inputs.rentalYieldPercent * (1 + rentalMod / 100);
      const rentGrowth = (inputs.rentGrowthRate || 4) * (1 + rentalMod / 100);
      const serviceCharges = (inputs.serviceChargePerSqft || 18) * (inputs.unitSizeSqf || 0);

      // 5yr and 10yr property values
      const monthsRemainingY1 = 13 - inputs.bookingMonth;
      const months5yr = monthsRemainingY1 + 4 * 12;
      const months10yr = monthsRemainingY1 + 9 * 12;
      const pv5 = calculateExitPrice(months5yr, basePrice, totalMonths, modRates);
      const pv10 = calculateExitPrice(months10yr, basePrice, totalMonths, modRates);

      // Rent projections
      const initialRent = basePrice * modYield / 100;
      const handoverYearIndex = inputs.handoverYear - inputs.bookingYear + 1;
      let totalRent5yr = 0;
      let totalRent10yr = 0;
      for (let y = 1; y <= 10; y++) {
        if (y < handoverYearIndex) continue; // no rent during construction
        const yearsRenting = y - handoverYearIndex;
        const annualRent = initialRent * Math.pow(1 + rentGrowth / 100, yearsRenting);
        const netRent = Math.max(0, annualRent - serviceCharges);
        if (y <= 5) totalRent5yr += netRent;
        totalRent10yr += netRent;
      }

      const totalReturn5yr = ((pv5 - basePrice + totalRent5yr - totalEntryCosts) / totalCapital) * 100;
      const totalReturn10yr = ((pv10 - basePrice + totalRent10yr - totalEntryCosts) / totalCapital) * 100;

      return {
        label,
        color,
        propertyValue5yr: pv5,
        propertyValue10yr: pv10,
        totalRent5yr,
        totalRent10yr,
        totalReturn5yr,
        totalReturn10yr,
        annualized5yr: totalReturn5yr / 5,
        annualized10yr: totalReturn10yr / 10,
      };
    };

    return [
      calcScenario('Conservative', 'text-red-400', -30, -20),
      calcScenario('Base', 'text-theme-accent', 0, 0),
      calcScenario('Optimistic', 'text-green-400', 30, 20),
      ...(customAppreciation !== 0 || customRentalYield !== 0
        ? [calcScenario('Custom', 'text-purple-400', customAppreciation, customRentalYield)]
        : []),
    ];
  }, [inputs, effectiveRates, basePrice, totalMonths, totalEntryCosts, totalCapital, customAppreciation, customRentalYield]);

  const formatValue = (value: number) => formatCurrency(value, currency, rate);

  return (
    <div className="space-y-6">
      {/* Scenarios Comparison Table */}
      <div className="p-4 bg-theme-card rounded-xl border border-theme-border overflow-x-auto">
        <h4 className="text-sm font-semibold text-theme-text mb-4">Scenario Comparison</h4>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-theme-border">
              <th className="text-left py-2 text-theme-text-muted font-medium">Metric</th>
              {scenarios.map(s => (
                <th key={s.label} className={`text-right py-2 font-medium ${s.color}`}>{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SectionRow label="5-Year Outlook" />
            <DataRow label="Property Value" values={scenarios.map(s => formatValue(s.propertyValue5yr))} colors={scenarios.map(s => s.color)} />
            <DataRow label="Total Net Rent" values={scenarios.map(s => formatValue(s.totalRent5yr))} colors={scenarios.map(s => s.color)} />
            <DataRow label="Total Return" values={scenarios.map(s => `${s.totalReturn5yr.toFixed(1)}%`)} colors={scenarios.map(s => s.color)} bold />
            <DataRow label="Annualized" values={scenarios.map(s => `${s.annualized5yr.toFixed(1)}%/yr`)} colors={scenarios.map(s => s.color)} />

            <SectionRow label="10-Year Outlook" />
            <DataRow label="Property Value" values={scenarios.map(s => formatValue(s.propertyValue10yr))} colors={scenarios.map(s => s.color)} />
            <DataRow label="Total Net Rent" values={scenarios.map(s => formatValue(s.totalRent10yr))} colors={scenarios.map(s => s.color)} />
            <DataRow label="Total Return" values={scenarios.map(s => `${s.totalReturn10yr.toFixed(1)}%`)} colors={scenarios.map(s => s.color)} bold />
            <DataRow label="Annualized" values={scenarios.map(s => `${s.annualized10yr.toFixed(1)}%/yr`)} colors={scenarios.map(s => s.color)} />
          </tbody>
        </table>
      </div>

      {/* Custom Scenario Sliders */}
      <div className="p-4 bg-theme-card rounded-xl border border-purple-500/30">
        <h4 className="text-sm font-semibold text-purple-400 mb-4">Custom Scenario</h4>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-theme-text-muted">Appreciation Adjustment</span>
              <span className={`text-xs font-mono font-semibold ${customAppreciation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {customAppreciation >= 0 ? '+' : ''}{customAppreciation}%
              </span>
            </div>
            <Slider
              value={[customAppreciation]}
              onValueChange={([v]) => setCustomAppreciation(v)}
              min={-50}
              max={50}
              step={5}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-theme-text-muted">Rental Yield Adjustment</span>
              <span className={`text-xs font-mono font-semibold ${customRentalYield >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {customRentalYield >= 0 ? '+' : ''}{customRentalYield}%
              </span>
            </div>
            <Slider
              value={[customRentalYield]}
              onValueChange={([v]) => setCustomRentalYield(v)}
              min={-50}
              max={50}
              step={5}
            />
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div className="p-3 bg-theme-bg/50 rounded-xl text-xs text-theme-text-muted">
        <p className="font-medium mb-1">Assumptions:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Conservative: Appreciation -30%, Rental -20% from base rates</li>
          <li>Optimistic: Appreciation +30%, Rental +20% from base rates</li>
          <li>All scenarios use the same 3-phase appreciation model</li>
          <li>Service charges constant across scenarios</li>
        </ul>
      </div>
    </div>
  );
};

const SectionRow = ({ label }: { label: string }) => (
  <tr>
    <td colSpan={99} className="pt-4 pb-1 text-[10px] text-theme-text-muted uppercase tracking-wider font-semibold border-b border-theme-border">
      {label}
    </td>
  </tr>
);

const DataRow = ({ label, values, colors, bold }: { label: string; values: string[]; colors: string[]; bold?: boolean }) => (
  <tr className="border-b border-theme-border/30 hover:bg-theme-bg/20">
    <td className="py-2 text-theme-text-muted">{label}</td>
    {values.map((v, i) => (
      <td key={i} className={`py-2 text-right font-mono ${colors[i]} ${bold ? 'font-semibold' : ''}`}>{v}</td>
    ))}
  </tr>
);
