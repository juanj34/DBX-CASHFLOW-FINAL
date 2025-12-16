import { YearlyProjection } from "./useROICalculations";

interface YearlyProjectionTableProps {
  projections: YearlyProjection[];
}

const formatAED = (value: number) => {
  return new Intl.NumberFormat('en-AE', { 
    style: 'currency', 
    currency: 'AED',
    maximumFractionDigits: 0 
  }).format(value);
};

export const YearlyProjectionTable = ({ projections }: YearlyProjectionTableProps) => {
  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#2a3142]">
        <h3 className="font-semibold text-white">10-Year Projection</h3>
        <p className="text-xs text-gray-400 mt-1">Property value & rental income year by year</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0d1117]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Year</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Property Value</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Annual Rent</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Event</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a3142]">
            {projections.map((p) => (
              <tr 
                key={p.year}
                className={
                  p.isHandover 
                    ? "bg-[#CCFF00]/10" 
                    : p.isSIExit 
                      ? "bg-[#00EAFF]/10" 
                      : ""
                }
              >
                <td className="px-4 py-3 text-sm font-mono text-white">
                  {p.year}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono text-white">
                  {formatAED(p.propertyValue)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono text-white">
                  {formatAED(p.annualRent)}
                </td>
                <td className="px-4 py-3 text-center">
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
