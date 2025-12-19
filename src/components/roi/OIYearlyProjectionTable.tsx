import { OIYearlyProjection } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { Home, Building, TrendingUp, Star } from "lucide-react";

interface OIYearlyProjectionTableProps {
  projections: OIYearlyProjection[];
  currency: Currency;
  rate: number;
  rentalMode: 'long-term' | 'short-term';
}

export const OIYearlyProjectionTable = ({ projections, currency, rate, rentalMode }: OIYearlyProjectionTableProps) => {
  const isShortTerm = rentalMode === 'short-term';
  
  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#2a3142] flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#CCFF00]" />
            10-Year Hold Simulation
          </h3>
          <p className="text-xs text-gray-400 mt-1">Property value and rental income projection</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isShortTerm 
            ? 'bg-purple-500/20 text-purple-400' 
            : 'bg-blue-500/20 text-blue-400'
        }`}>
          {isShortTerm ? '🏠 Short-Term (Airbnb)' : '🏢 Long-Term Rental'}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0d1117]">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Year</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Property Value</th>
              {isShortTerm ? (
                <>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Gross Income</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Expenses</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Net Income</th>
                </>
              ) : (
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Annual Rent</th>
              )}
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Cumulative</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a3142]">
            {projections.map((proj) => {
              const totalExpenses = (proj.operatingExpenses || 0) + (proj.managementFee || 0);
              
              return (
                <tr 
                  key={proj.year}
                  className={
                    proj.isBreakEven 
                      ? 'bg-green-500/10' 
                      : proj.isHandover 
                        ? 'bg-[#CCFF00]/10' 
                        : ''
                  }
                >
                  <td className="px-3 py-3 text-sm text-white font-medium">
                    {proj.calendarYear}
                  </td>
                  <td className="px-3 py-3 text-sm text-right text-white font-mono">
                    {formatCurrency(proj.propertyValue, currency, rate)}
                  </td>
                  {isShortTerm ? (
                    <>
                      <td className="px-3 py-3 text-sm text-right font-mono">
                        {proj.grossIncome ? (
                          <span className="text-gray-300">{formatCurrency(proj.grossIncome, currency, rate)}</span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-right font-mono">
                        {totalExpenses > 0 ? (
                          <span className="text-red-400">-{formatCurrency(totalExpenses, currency, rate)}</span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-right font-mono">
                        {proj.netIncome ? (
                          <span className="text-[#CCFF00]">{formatCurrency(proj.netIncome, currency, rate)}</span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    </>
                  ) : (
                    <td className="px-3 py-3 text-sm text-right font-mono">
                      {proj.annualRent ? (
                        <span className="text-[#CCFF00]">{formatCurrency(proj.annualRent, currency, rate)}</span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-3 py-3 text-sm text-right font-mono">
                    {proj.cumulativeNetIncome > 0 ? (
                      <span className="text-green-400">{formatCurrency(proj.cumulativeNetIncome, currency, rate)}</span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm text-center">
                    {proj.isConstruction && (
                      <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400 inline-flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        Construction
                      </span>
                    )}
                    {proj.isHandover && (
                      <span className="px-2 py-1 rounded-full text-xs bg-[#CCFF00]/20 text-[#CCFF00] inline-flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        Handover
                      </span>
                    )}
                    {proj.isBreakEven && (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 inline-flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Break-Even
                      </span>
                    )}
                    {!proj.isConstruction && !proj.isHandover && !proj.isBreakEven && (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                        Operational
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Summary Footer */}
      <div className="p-4 border-t border-[#2a3142] bg-[#0d1117]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Total Cumulative Net Income (10 Years)</span>
          <span className="text-[#CCFF00] font-mono font-bold">
            {formatCurrency(projections[projections.length - 1]?.cumulativeNetIncome || 0, currency, rate)}
          </span>
        </div>
      </div>
    </div>
  );
};
