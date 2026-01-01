import { YearlyProjection } from "./useROICalculations";
import { Currency, formatCurrency } from "./currencyUtils";

interface YearlyProjectionTableProps {
  projections: YearlyProjection[];
  currency: Currency;
}

export const YearlyProjectionTable = ({ projections, currency }: YearlyProjectionTableProps) => {
  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-theme-border">
        <h3 className="font-semibold text-white">10-Year Projection</h3>
        <p className="text-xs text-theme-text-muted mt-1">Property value & rental income year by year</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-theme-bg-alt">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-muted tracking-wider">Year</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-theme-text-muted tracking-wider">Property Value</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-theme-text-muted tracking-wider">Annual Rent</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-theme-text-muted tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {projections.map((p) => (
              <tr 
                key={p.year}
                className={
                  p.isHandover 
                    ? "bg-[#CCFF00]/10" 
                    : p.isSIExit 
                      ? "bg-[#00EAFF]/10" 
                      : p.isConstruction
                        ? "bg-[#2a3142]/30"
                        : ""
                }
              >
                <td className="px-4 py-3 text-sm font-mono text-white">
                  {p.calendarYear}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono text-white">
                  {formatCurrency(p.propertyValue, currency)}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-mono ${p.isConstruction ? 'text-theme-text-muted' : 'text-white'}`}>
                  {p.annualRent !== null ? formatCurrency(p.annualRent, currency) : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  {p.isConstruction && !p.isHandover && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-theme-card-alt text-theme-text-muted">
                      Construction
                    </span>
                  )}
                  {p.isHandover && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#CCFF00]/20 text-[#CCFF00]">
                      OI → SI Handover
                    </span>
                  )}
                  {p.isSIExit && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#00EAFF]/20 text-[#00EAFF]">
                      SI → HO Exit
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
