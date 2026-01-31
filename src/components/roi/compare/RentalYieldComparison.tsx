import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { formatCurrency, Currency } from '@/components/roi/currencyUtils';
import { getQuoteDisplayName } from './utils';

interface RentalYieldComparisonProps {
  quotesWithCalcs: QuoteWithCalculations[];
  currency?: Currency;
  exchangeRate?: number;
}

export const RentalYieldComparison = ({
  quotesWithCalcs,
  currency = 'AED',
  exchangeRate = 1,
}: RentalYieldComparisonProps) => {
  const rows = useMemo(() => {
    return quotesWithCalcs.map(({ quote, calculations }) => {
      const grossYield = quote.inputs.rentalYieldPercent || 0;
      const netYield = calculations.holdAnalysis.rentalYieldOnInvestment || 0; // already %
      const netAnnual = calculations.holdAnalysis.netAnnualRent || 0;
      const monthlyNet = netAnnual / 12;
      const yearsToPay = calculations.holdAnalysis.yearsToPayOff || 0;

      return {
        quoteId: quote.id,
        title: getQuoteDisplayName(quote.title, quote.projectName),
        grossYield,
        netYield,
        netAnnual,
        monthlyNet,
        yearsToPay,
      };
    });
  }, [quotesWithCalcs]);

  const hasAnyRent = rows.some(r => r.grossYield > 0 || r.netAnnual > 0);
  if (!hasAnyRent) return null;

  const bestNetYield = Math.max(...rows.map(r => r.netYield));
  const bestNetAnnual = Math.max(...rows.map(r => r.netAnnual));
  const bestYearsToPay = Math.min(...rows.filter(r => r.yearsToPay > 0).map(r => r.yearsToPay));

  const MetricRow = ({
    label,
    render,
  }: {
    label: string;
    render: (r: typeof rows[number]) => { text: string; best?: boolean };
  }) => (
    <div
      className="grid gap-4 items-center py-2 border-b border-theme-border/50"
      style={{ gridTemplateColumns: `180px repeat(${rows.length}, 1fr)` }}
    >
      <div className="text-sm text-theme-text-muted">{label}</div>
      {rows.map((r) => {
        const { text, best } = render(r);
        return (
          <div
            key={r.quoteId}
            className={
              `text-sm font-mono text-center ${best ? 'text-green-400 font-semibold' : 'text-theme-text'}`
            }
          >
            {text}
            {best && <Check className="w-3 h-3 inline ml-1" />}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-2">
      <MetricRow
        label="Gross Yield (Input)"
        render={(r) => ({ text: r.grossYield > 0 ? `${r.grossYield.toFixed(1)}%` : '—' })}
      />
      <MetricRow
        label="Net Yield (Y1)"
        render={(r) => ({
          text: r.netYield > 0 ? `${r.netYield.toFixed(1)}%` : '—',
          best: r.netYield > 0 && r.netYield === bestNetYield,
        })}
      />
      <MetricRow
        label="Net Annual Rent (Y1)"
        render={(r) => ({
          text: r.netAnnual > 0 ? formatCurrency(r.netAnnual, currency, exchangeRate) : '—',
          best: r.netAnnual > 0 && r.netAnnual === bestNetAnnual,
        })}
      />
      <MetricRow
        label="Net Monthly (Y1)"
        render={(r) => ({
          text: r.monthlyNet > 0 ? formatCurrency(r.monthlyNet, currency, exchangeRate) : '—',
        })}
      />
      <MetricRow
        label="Years to Pay Off"
        render={(r) => ({
          text: r.yearsToPay > 0 ? `${r.yearsToPay.toFixed(1)} yrs` : '—',
          best: r.yearsToPay > 0 && r.yearsToPay === bestYearsToPay,
        })}
      />
    </div>
  );
};
