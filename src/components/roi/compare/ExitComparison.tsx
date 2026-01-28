import { QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { formatCurrency, Currency } from '@/components/roi/currencyUtils';
import { calculateExitScenario } from '@/components/roi/constructionProgress';

interface ExitComparisonProps {
  quotesWithCalcs: QuoteWithCalculations[];
  currency?: Currency;
  exchangeRate?: number;
}

export const ExitComparison = ({ 
  quotesWithCalcs,
  currency = 'AED',
  exchangeRate = 1,
}: ExitComparisonProps) => {
  const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500', '#FF6B6B', '#4ECDC4'];
  
  // Common exit points
  const exitPoints = [24, 36, 48, 60];

  // Get data for each exit point - calculate dynamically
  const exitData = exitPoints.map(months => {
    const scenarios = quotesWithCalcs.map(item => {
      const { calculations, quote } = item;
      
      // Calculate scenario dynamically using the canonical function
      const scenario = calculateExitScenario(
        months,
        quote.inputs.basePrice,
        calculations.totalMonths,
        quote.inputs,
        calculations.totalEntryCosts
      );
      
      return {
        quote: quote,
        profit: scenario.trueProfit,
        roe: scenario.annualizedROE,
        available: true,
      };
    });

    return {
      months,
      scenarios,
    };
  });

  const formatMonths = (months: number) => {
    const years = months / 12;
    if (years === Math.floor(years)) return `${years} Year${years > 1 ? 's' : ''}`;
    return `${months} Months`;
  };

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl p-5">
      <h3 className="text-lg font-semibold text-theme-text mb-4">Exit Scenarios Comparison</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-theme-border">
              <th className="text-left py-3 px-2 text-theme-text-muted text-sm font-medium">Exit Point</th>
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
              <tr key={months} className="border-b border-theme-border/50">
                <td className="py-4 px-2 text-theme-text-muted text-sm">
                  {formatMonths(months)}
                </td>
                {scenarios.map((scenario, idx) => (
                  <td key={idx} className="py-4 px-2">
                    {scenario.available ? (
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-theme-text">
                          {formatCurrency(scenario.profit || 0, currency, exchangeRate)}
                        </span>
                        <div className="text-xs text-theme-text-muted">
                          {scenario.roe !== null ? `${scenario.roe.toFixed(1)}% ROE/yr` : 'N/A'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-theme-text-muted">Not available</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-theme-text-muted mt-4">
        💡 Exit availability depends on minimum threshold requirements and handover timing.
      </p>
    </div>
  );
};
