import { OIYearlyProjection } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { Home, Building, TrendingUp, Star } from "lucide-react";

interface OIYearlyProjectionTableProps {
  projections: OIYearlyProjection[];
  currency: Currency;
  rate: number;
  showAirbnbComparison: boolean;
}

export const OIYearlyProjectionTable = ({ projections, currency, rate, showAirbnbComparison }: OIYearlyProjectionTableProps) => {
  const lastProjection = projections[projections.length - 1];
  const longTermTotal = lastProjection?.cumulativeNetIncome || 0;
  const airbnbTotal = lastProjection?.airbnbCumulativeNetIncome || 0;
  const winner = airbnbTotal > longTermTotal ? 'airbnb' : 'long-term';
  const difference = Math.abs(airbnbTotal - longTermTotal);
  
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
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
            🏢 Long-Term
          </span>
          {showAirbnbComparison && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
              🏠 Airbnb
            </span>
          )}
        </div>
      </div>
      
      {/* Comparison Summary Header */}
      {showAirbnbComparison && (
        <div className="p-4 border-b border-[#2a3142] grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <div className="text-xs text-gray-400">Long-Term (10Y)</div>
            <div className="text-lg font-bold text-blue-400">{formatCurrency(longTermTotal, currency, rate)}</div>
          </div>
          <div className="text-center p-3 bg-[#CCFF00]/10 rounded-lg border border-[#CCFF00]/30">
            <div className="text-xs text-gray-400">Difference</div>
            <div className={`text-lg font-bold ${winner === 'airbnb' ? 'text-purple-400' : 'text-blue-400'}`}>
              +{formatCurrency(difference, currency, rate)}
            </div>
            <div className="text-xs text-gray-500">
              {winner === 'airbnb' ? 'Airbnb wins' : 'Long-Term wins'}
            </div>
          </div>
          <div className="text-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
            <div className="text-xs text-gray-400">Airbnb (10Y)</div>
            <div className="text-lg font-bold text-purple-400">{formatCurrency(airbnbTotal, currency, rate)}</div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0d1117]">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Year</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Property Value</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-blue-400 uppercase tracking-wider">LT Rent</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-blue-400 uppercase tracking-wider">LT Cumulative</th>
              {showAirbnbComparison && (
                <>
                  <th className="px-3 py-3 text-right text-xs font-medium text-purple-400 uppercase tracking-wider">Airbnb Net</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-purple-400 uppercase tracking-wider">Airbnb Cumulative</th>
                </>
              )}
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a3142]">
            {projections.map((proj) => {
              const yearWinner = (proj.airbnbNetIncome || 0) > (proj.netIncome || 0) ? 'airbnb' : 'long-term';
              
              return (
                <tr 
                  key={proj.year}
                  className={
                    proj.isBreakEven || proj.isAirbnbBreakEven
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
                  <td className="px-3 py-3 text-sm text-right font-mono">
                    {proj.annualRent ? (
                      <span className="text-blue-400">{formatCurrency(proj.annualRent, currency, rate)}</span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm text-right font-mono">
                    {proj.cumulativeNetIncome > 0 ? (
                      <span className="text-blue-300">{formatCurrency(proj.cumulativeNetIncome, currency, rate)}</span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  {showAirbnbComparison && (
                    <>
                      <td className="px-3 py-3 text-sm text-right font-mono">
                        {proj.airbnbNetIncome ? (
                          <span className="text-purple-400">{formatCurrency(proj.airbnbNetIncome, currency, rate)}</span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-right font-mono">
                        {proj.airbnbCumulativeNetIncome > 0 ? (
                          <span className="text-purple-300">{formatCurrency(proj.airbnbCumulativeNetIncome, currency, rate)}</span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    </>
                  )}
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
          <div className="flex items-center gap-4">
            <span className="text-blue-400 font-mono font-bold">
              LT: {formatCurrency(longTermTotal, currency, rate)}
            </span>
            {showAirbnbComparison && (
              <span className="text-purple-400 font-mono font-bold">
                Airbnb: {formatCurrency(airbnbTotal, currency, rate)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
