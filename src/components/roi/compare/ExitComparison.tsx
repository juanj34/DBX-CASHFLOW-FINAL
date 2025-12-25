import { QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { formatCurrency } from '@/components/roi/currencyUtils';
import { Trophy } from 'lucide-react';

interface ExitComparisonProps {
  quotesWithCalcs: QuoteWithCalculations[];
}

export const ExitComparison = ({ quotesWithCalcs }: ExitComparisonProps) => {
  const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500'];
  
  // Common exit points
  const exitPoints = [24, 36, 48, 60];

  // Get data for each exit point
  const exitData = exitPoints.map(months => {
    const scenarios = quotesWithCalcs.map(item => {
      const scenario = item.calculations.scenarios.find(s => s.exitMonths === months);
      return {
        quote: item.quote,
        profit: scenario?.profit ?? null,
        roe: scenario?.annualizedROE ?? null,
        available: !!scenario,
      };
    });

    // Find best ROE
    const validRoes = scenarios.filter(s => s.roe !== null).map(s => s.roe as number);
    const maxRoe = validRoes.length > 0 ? Math.max(...validRoes) : null;

    return {
      months,
      scenarios: scenarios.map(s => ({
        ...s,
        isBest: s.roe !== null && maxRoe !== null && s.roe === maxRoe,
      })),
    };
  });

  const formatMonths = (months: number) => {
    const years = months / 12;
    if (years === Math.floor(years)) return `${years} Year${years > 1 ? 's' : ''}`;
    return `${months} Months`;
  };

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-xl p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Exit Scenarios Comparison</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a3142]">
              <th className="text-left py-3 px-2 text-gray-500 text-sm font-medium">Exit Point</th>
              {quotesWithCalcs.map((item, idx) => (
                <th 
                  key={item.quote.id} 
                  className="text-left py-3 px-2 text-sm font-medium"
                  style={{ color: colors[idx % colors.length] }}
                >
                  {item.quote.title || item.quote.projectName || `Quote ${idx + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exitData.map(({ months, scenarios }) => (
              <tr key={months} className="border-b border-[#2a3142]/50">
                <td className="py-4 px-2 text-gray-400 text-sm">
                  {formatMonths(months)}
                </td>
                {scenarios.map((scenario, idx) => (
                  <td key={idx} className="py-4 px-2">
                    {scenario.available ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${scenario.isBest ? 'text-emerald-400' : 'text-white'}`}>
                            {formatCurrency(scenario.profit || 0, 'AED', 1)}
                          </span>
                          {scenario.isBest && <Trophy className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <div className="text-xs text-gray-500">
                          {scenario.roe !== null ? `${scenario.roe.toFixed(1)}% ROE/yr` : 'N/A'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">Not available</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        💡 Exit availability depends on minimum threshold requirements and handover timing.
      </p>
    </div>
  );
};
