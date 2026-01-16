import { TrendingUp } from 'lucide-react';
import { Currency, formatCurrency } from '../currencyUtils';
import { OIYearlyProjection } from '../useOICalculations';
import { cn } from '@/lib/utils';

interface AnnualCashflowRowProps {
  yearlyProjections: OIYearlyProjection[];
  currency: Currency;
  rate: number;
}

export const AnnualCashflowRow = ({
  yearlyProjections,
  currency,
  rate,
}: AnnualCashflowRowProps) => {
  // Filter to only post-handover years with income
  const incomeYears = yearlyProjections.filter(y => y.netIncome !== null && y.netIncome > 0);
  
  if (incomeYears.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Annual Net Cash Position
        </h3>
      </div>
      
      {/* Horizontal scroll table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium sticky left-0 bg-muted/30 min-w-[100px]">
                Year
              </th>
              {incomeYears.slice(0, 10).map((year) => (
                <th 
                  key={year.year} 
                  className={cn(
                    "text-center px-3 py-2 text-muted-foreground font-medium min-w-[100px]",
                    year.isBreakEven && "bg-green-500/10"
                  )}
                >
                  {year.calendarYear}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 font-medium text-foreground sticky left-0 bg-card">
                Net Annual Cash
              </td>
              {incomeYears.slice(0, 10).map((year) => (
                <td 
                  key={year.year} 
                  className={cn(
                    "px-3 py-3 text-center",
                    year.isBreakEven && "bg-green-500/10"
                  )}
                >
                  <span className="font-medium text-green-500 block">
                    {formatCurrency(year.netIncome || 0, 'AED', 1)}
                  </span>
                  {currency !== 'AED' && (
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(year.netIncome || 0, currency, rate)}
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-3 font-medium text-foreground sticky left-0 bg-card">
                Cumulative
              </td>
              {incomeYears.slice(0, 10).map((year) => (
                <td 
                  key={year.year} 
                  className={cn(
                    "px-3 py-3 text-center",
                    year.isBreakEven && "bg-green-500/10"
                  )}
                >
                  <span className={cn(
                    "font-medium block",
                    year.cumulativeNetIncome >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {formatCurrency(year.cumulativeNetIncome, 'AED', 1)}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Break-even indicator */}
      {incomeYears.some(y => y.isBreakEven) && (
        <div className="px-4 py-2 bg-green-500/10 border-t border-green-500/20 text-xs text-green-600">
          🎉 Break-even reached in year {incomeYears.find(y => y.isBreakEven)?.calendarYear}
        </div>
      )}
    </div>
  );
};
