import { useState } from "react";
import { ExitScenariosCards } from "@/components/roi/ExitScenariosCards";
import { OIGrowthCurve } from "@/components/roi/OIGrowthCurve";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";

interface ExitsROETabProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
  exitScenarios: number[];
  setExitScenarios: (scenarios: number[]) => void;
  unitSizeSqf?: number;
  readOnly?: boolean;
}

export const ExitsROETab = ({
  inputs,
  calculations,
  currency,
  rate,
  exitScenarios,
  setExitScenarios,
  unitSizeSqf,
  readOnly = false,
}: ExitsROETabProps) => {
  const [highlightedExit, setHighlightedExit] = useState<number | null>(null);

  // ROE summary from scenarios
  const scenarioData = calculations.scenarios || [];
  const bestROE = scenarioData.length > 0 ? Math.max(...scenarioData.map(s => s.trueROE)) : 0;
  const bestROEScenario = scenarioData.find(s => s.trueROE === bestROE);

  return (
    <div className="space-y-6">
      {/* ROE Summary */}
      {bestROEScenario && (
        <div className="p-4 bg-theme-card rounded-xl border border-theme-border">
          <h4 className="text-sm font-semibold text-theme-text mb-3">Return on Equity Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-[10px] text-theme-text-muted uppercase">Best ROE</div>
              <div className="text-lg font-mono font-semibold text-green-400">{bestROE.toFixed(1)}%</div>
              <div className="text-[10px] text-theme-text-muted">at month {bestROEScenario.exitMonths}</div>
            </div>
            <div>
              <div className="text-[10px] text-theme-text-muted uppercase">Profit at Best ROE</div>
              <div className="text-lg font-mono font-semibold text-theme-accent">
                {formatCurrency(bestROEScenario.trueProfit, currency, rate)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-theme-text-muted uppercase">Annualized ROE</div>
              <div className="text-lg font-mono font-semibold text-cyan-400">
                {bestROEScenario.annualizedROE.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exit Scenario Cards */}
      <ExitScenariosCards
        inputs={inputs}
        currency={currency}
        totalMonths={calculations.totalMonths}
        basePrice={calculations.basePrice}
        totalEntryCosts={calculations.totalEntryCosts}
        exitScenarios={exitScenarios}
        setExitScenarios={setExitScenarios}
        rate={rate}
        unitSizeSqf={unitSizeSqf}
        highlightedIndex={highlightedExit}
        onCardHover={setHighlightedExit}
      />

      {/* Growth Curve */}
      <OIGrowthCurve
        scenarios={calculations.scenarios}
        basePrice={calculations.basePrice}
        totalMonths={calculations.totalMonths}
        currency={currency}
        rate={rate}
        exitScenarios={exitScenarios}
        highlightedIndex={highlightedExit}
        onPointHover={setHighlightedExit}
      />

      {/* ROE Table */}
      {scenarioData.length > 0 && (
        <div className="p-4 bg-theme-card rounded-xl border border-theme-border overflow-x-auto">
          <h4 className="text-sm font-semibold text-theme-text mb-3">Exit Scenarios with ROE</h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-theme-border">
                <th className="text-left py-2 text-theme-text-muted font-medium">Month</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">Exit Price</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">Equity In</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">Profit</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">ROE</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">Annual ROE</th>
              </tr>
            </thead>
            <tbody>
              {scenarioData.map((s, i) => (
                <tr key={i} className="border-b border-theme-border/50 hover:bg-theme-bg/30">
                  <td className="py-2 text-theme-text font-mono">{s.exitMonths}</td>
                  <td className="py-2 text-right text-theme-text font-mono">{formatCurrency(s.exitPrice, currency, rate)}</td>
                  <td className="py-2 text-right text-theme-text font-mono">{formatCurrency(s.totalCapitalDeployed, currency, rate)}</td>
                  <td className={`py-2 text-right font-mono ${s.trueProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(s.trueProfit, currency, rate)}
                  </td>
                  <td className={`py-2 text-right font-mono font-semibold ${s.trueROE >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {s.trueROE.toFixed(1)}%
                  </td>
                  <td className="py-2 text-right text-theme-text-muted font-mono">{s.annualizedROE.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
