import { OIYearlyProjection } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";

interface OIYearlyProjectionTableProps {
  projections: OIYearlyProjection[];
  currency: Currency;
  rate: number;
}

export const OIYearlyProjectionTable = ({ projections, currency, rate }: OIYearlyProjectionTableProps) => {
  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#2a3142]">
        <h3 className="font-semibold text-white">10-Year Property Projection</h3>
        <p className="text-xs text-gray-400 mt-1">Property value and rental income over time</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0d1117]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Year</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Property Value</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Annual Rent</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a3142]">
            {projections.map((proj) => (
              <tr 
                key={proj.year}
                className={
                  proj.isHandover 
                    ? 'bg-[#CCFF00]/10' 
                    : ''
                }
              >
                <td className="px-4 py-3 text-sm text-white font-medium">
                  {proj.calendarYear}
                </td>
                <td className="px-4 py-3 text-sm text-right text-white font-mono">
                  {formatCurrency(proj.propertyValue, currency, rate)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono">
                  {proj.annualRent ? (
                    <span className="text-[#CCFF00]">{formatCurrency(proj.annualRent, currency, rate)}</span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {proj.isConstruction && (
                    <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">
                      Construction
                    </span>
                  )}
                  {proj.isHandover && (
                    <span className="px-2 py-1 rounded-full text-xs bg-[#CCFF00]/20 text-[#CCFF00]">
                      Handover
                    </span>
                  )}
                  {!proj.isConstruction && !proj.isHandover && (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                      Operational
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
