import { QuoteWithCalculations, ComparisonMetrics } from '@/hooks/useQuotesComparison';
import { formatCurrency } from '@/components/roi/currencyUtils';
import { Trophy } from 'lucide-react';

interface MetricsTableProps {
  quotesWithCalcs: QuoteWithCalculations[];
  metrics: ComparisonMetrics;
}

const MetricRow = ({ 
  label, 
  values, 
  formatter = (v: any) => v?.toString() ?? 'N/A',
  higherIsBetter = false,
}: { 
  label: string; 
  values: { value: any; best: boolean }[];
  formatter?: (value: any) => string;
  higherIsBetter?: boolean;
}) => {
  const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500'];
  
  return (
    <div className="grid items-center border-b border-[#2a3142] py-3" 
      style={{ gridTemplateColumns: `180px repeat(${values.length}, minmax(120px, 1fr))` }}>
      <span className="text-gray-400 text-sm">{label}</span>
      {values.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className={`font-medium ${item.best ? 'text-emerald-400' : 'text-white'}`}>
            {formatter(item.value)}
          </span>
          {item.best && (
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </div>
      ))}
    </div>
  );
};

export const MetricsTable = ({ quotesWithCalcs, metrics }: MetricsTableProps) => {
  const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500'];

  const formatMonths = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${months} mo`;
    if (remainingMonths === 0) return `${years}y`;
    return `${years}y ${remainingMonths}mo`;
  };

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-xl p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Key Metrics Comparison</h3>
      
      {/* Header row with quote names */}
      <div className="grid border-b border-[#2a3142] pb-3 mb-2" 
        style={{ gridTemplateColumns: `180px repeat(${quotesWithCalcs.length}, minmax(120px, 1fr))` }}>
        <span className="text-gray-500 text-sm">Metric</span>
        {quotesWithCalcs.map((q, idx) => (
          <span 
            key={q.quote.id} 
            className="font-medium text-sm truncate pr-2"
            style={{ color: colors[idx % colors.length] }}
          >
            {q.quote.title || q.quote.projectName || 'Quote'}
          </span>
        ))}
      </div>

      <div className="space-y-0">
        <MetricRow
          label="Base Price"
          values={metrics.basePrice}
          formatter={(v) => formatCurrency(v, 'AED', 1)}
        />
        <MetricRow
          label="Price / sqft"
          values={metrics.pricePerSqft}
          formatter={(v) => v !== null ? `AED ${Math.round(v).toLocaleString()}` : 'N/A'}
        />
        <MetricRow
          label="Total Investment"
          values={metrics.totalInvestment}
          formatter={(v) => formatCurrency(v, 'AED', 1)}
        />
        <MetricRow
          label="Handover"
          values={metrics.handoverMonths}
          formatter={formatMonths}
        />
        <MetricRow
          label="Pre-Handover %"
          values={metrics.preHandoverPercent}
          formatter={(v) => `${v}%`}
        />
        <MetricRow
          label="Rental Yield (Y1)"
          values={metrics.rentalYieldY1}
          formatter={(v) => v !== null ? `${v.toFixed(1)}%` : 'N/A'}
          higherIsBetter
        />
        <MetricRow
          label="Construction Appr."
          values={metrics.constructionAppreciation}
          formatter={(v) => `${v}%`}
          higherIsBetter
        />
        <MetricRow
          label="Growth Appr."
          values={metrics.growthAppreciation}
          formatter={(v) => `${v}%`}
          higherIsBetter
        />
        <MetricRow
          label="ROI @ 36mo"
          values={metrics.roiAt36Months}
          formatter={(v) => v !== null ? `${v.toFixed(1)}%` : 'N/A'}
          higherIsBetter
        />
      </div>
    </div>
  );
};
