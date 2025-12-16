import { OIExitScenario } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";

interface OIExitScenariosTableProps {
  scenarios: OIExitScenario[];
  currency: Currency;
}

export const OIExitScenariosTable = ({ scenarios, currency }: OIExitScenariosTableProps) => {
  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#2a3142]">
        <h3 className="font-semibold text-white">Exit Scenarios Comparison</h3>
        <p className="text-xs text-gray-400 mt-1">ROE at different exit points during construction</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0d1117]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Metric</th>
              {scenarios.map(s => (
                <th 
                  key={s.exitPercent} 
                  className="px-4 py-3 text-center text-xs font-medium text-[#CCFF00] uppercase tracking-wider"
                >
                  {s.exitPercent}%
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a3142]">
            <tr>
              <td className="px-4 py-3 text-sm text-gray-400">Months Held</td>
              {scenarios.map(s => (
                <td key={s.exitPercent} className="px-4 py-3 text-sm text-center text-white font-mono">
                  {s.exitMonths}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-400">Amount Paid</td>
              {scenarios.map(s => (
                <td key={s.exitPercent} className="px-4 py-3 text-sm text-center text-white font-mono">
                  {formatCurrency(s.amountPaidSoFar, currency)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-400">Amount Left</td>
              {scenarios.map(s => (
                <td key={s.exitPercent} className="px-4 py-3 text-sm text-center text-gray-400 font-mono">
                  {formatCurrency(s.amountLeftToPay, currency)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-400">Exit Price</td>
              {scenarios.map(s => (
                <td key={s.exitPercent} className="px-4 py-3 text-sm text-center text-white font-mono">
                  {formatCurrency(s.exitPrice, currency)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-400">Entry Costs</td>
              {scenarios.map(s => (
                <td key={s.exitPercent} className="px-4 py-3 text-sm text-center text-red-400 font-mono">
                  -{formatCurrency(s.entryCosts, currency)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-400">Exit Costs</td>
              {scenarios.map(s => (
                <td key={s.exitPercent} className="px-4 py-3 text-sm text-center text-red-400 font-mono">
                  -{formatCurrency(s.exitCosts, currency)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-400">Gross Profit</td>
              {scenarios.map(s => (
                <td key={s.exitPercent} className="px-4 py-3 text-sm text-center font-mono text-[#CCFF00]">
                  +{formatCurrency(s.profit, currency)}
                </td>
              ))}
            </tr>
            <tr className="bg-[#CCFF00]/5">
              <td className="px-4 py-3 text-sm font-medium text-[#CCFF00]">True Profit</td>
              {scenarios.map(s => (
                <td key={s.exitPercent} className="px-4 py-3 text-sm text-center font-mono font-bold text-[#CCFF00]">
                  {s.trueProfit >= 0 ? '+' : ''}{formatCurrency(s.trueProfit, currency)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-400">Gross ROE</td>
              {scenarios.map(s => (
                <td key={s.exitPercent} className="px-4 py-3 text-sm text-center text-white font-mono">
                  {s.roe.toFixed(1)}%
                </td>
              ))}
            </tr>
            <tr className="bg-[#CCFF00]/10">
              <td className="px-4 py-3 text-sm font-medium text-[#CCFF00]">True ROE</td>
              {scenarios.map(s => (
                <td key={s.exitPercent} className="px-4 py-3 text-sm text-center font-mono font-bold text-[#CCFF00]">
                  {s.trueROE.toFixed(1)}%
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-400">ROE Anualizado</td>
              {scenarios.map(s => (
                <td key={s.exitPercent} className="px-4 py-3 text-sm text-center text-white font-mono">
                  {s.annualizedROE.toFixed(1)}%/yr
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-400">Profit/Mes</td>
              {scenarios.map(s => (
                <td key={s.exitPercent} className="px-4 py-3 text-sm text-center text-white font-mono">
                  {formatCurrency(s.profitPerMonth, currency)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};