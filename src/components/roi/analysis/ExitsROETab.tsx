import { useState, useMemo } from "react";
import { ExitScenariosCards } from "@/components/roi/ExitScenariosCards";
import { OIGrowthCurve } from "@/components/roi/OIGrowthCurve";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";
import { calculateExitScenario } from "@/components/roi/constructionProgress";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
  const [highlightedExit, setHighlightedExit] = useState<number | null>(null);

  // Unified exit calculations using the canonical calculateExitScenario (Path B)
  const scenarioResults = useMemo(() =>
    exitScenarios.map(months =>
      calculateExitScenario(months, calculations.basePrice, calculations.totalMonths, inputs, calculations.totalEntryCosts)
    ), [exitScenarios, calculations.basePrice, calculations.totalMonths, calculations.totalEntryCosts, inputs]
  );

  return (
    <div className="space-y-6">
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

      {/* Growth Curve — correct props matching OIGrowthCurve interface */}
      <OIGrowthCurve
        calculations={calculations}
        inputs={inputs}
        currency={currency}
        rate={rate}
        exitScenarios={exitScenarios}
        highlightedExit={highlightedExit}
        onExitHover={setHighlightedExit}
      />

      {/* ROE Table — uses canonical calculateExitScenario */}
      {scenarioResults.length > 0 && (
        <div className="p-4 bg-theme-card rounded-xl border border-theme-border overflow-x-auto">
          <h4 className="text-sm font-semibold text-theme-text mb-3">{t('exitScenariosROETitle')}</h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-theme-border">
                <th className="text-left py-2 text-theme-text-muted font-medium">{t('monthLabel')}</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">{t('exitPriceLabel')}</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">{t('equityInLabel')}</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">{t('profitLabel')}</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">Total ROE</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">/yr</th>
              </tr>
            </thead>
            <tbody>
              {scenarioResults.map((s, i) => (
                <tr key={i} className="border-b border-theme-border/50 hover:bg-theme-bg/30">
                  <td className="py-2 text-theme-text font-mono">{exitScenarios[i]}</td>
                  <td className="py-2 text-right text-theme-text font-mono">{formatCurrency(s.exitPrice, currency, rate)}</td>
                  <td className="py-2 text-right text-theme-text font-mono">{formatCurrency(s.totalCapital, currency, rate)}</td>
                  <td className={`py-2 text-right font-mono ${s.trueProfit >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                    {formatCurrency(s.trueProfit, currency, rate)}
                  </td>
                  <td className={`py-2 text-right font-mono font-semibold ${s.trueROE >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                    {s.trueROE.toFixed(1)}%
                  </td>
                  <td className="py-2 text-right text-theme-text-muted font-mono text-[10px]">{s.annualizedROE.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
